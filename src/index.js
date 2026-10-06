#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPEC_ROOT = process.env.SPEC_ROOT || path.resolve(__dirname, "..");
const VERSION = "1.3.0";

const CORE_FILES = [
  "config/constitution.md",
  "config/checklist.md",
  "config/magento-patterns.md",
];

// get_team_standards(part=...) — chọn 1 phần thay vì nạp cả 3 file.
const STANDARD_PARTS = {
  constitution: "config/constitution.md",
  checklist: "config/checklist.md",
  patterns: "config/magento-patterns.md",
};

// Bookkeeping logs — not standards; excluded from search results.
const SEARCH_EXCLUDE = new Set([
  "config/research-log.md",
  "config/research-log-archive.md",
]);

// Files above this size get a size warning prepended (token-cost guard).
const LARGE_FILE_BYTES = 30 * 1024;

// Search result guards: caps keep the response token-bounded.
const SEARCH_MAX_LINES_PER_FILE = 8;
const SEARCH_MAX_TOTAL = 60;
const SEARCH_CONTEXT_CHARS = 240; // trim long lines in results

// Content cache validated by mtime, so edited files are re-read.
const fileCache = new Map();
// Directory-walk cache (TTL) — search/list call it on every request.
const listCache = new Map();
const LIST_TTL_MS = 30_000;

const ROOT_WITH_SEP = SPEC_ROOT.endsWith(path.sep)
  ? SPEC_ROOT
  : SPEC_ROOT + path.sep;

/**
 * Resolve a repo-relative path and guard it stays inside SPEC_ROOT.
 * Returns the absolute path, or null when the input is invalid or escapes.
 */
function resolveInsideRoot(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    return null;
  }
  const fullPath = path.resolve(SPEC_ROOT, relativePath);
  if (fullPath !== SPEC_ROOT && !fullPath.startsWith(ROOT_WITH_SEP)) {
    return null;
  }
  return fullPath;
}

async function readCached(fullPath) {
  const { mtimeMs } = await fs.stat(fullPath);
  const hit = fileCache.get(fullPath);
  if (hit && hit.mtime === mtimeMs) return hit.content;
  const content = await fs.readFile(fullPath, "utf-8");
  fileCache.set(fullPath, { mtime: mtimeMs, content });
  return content;
}

/** Read a repo-relative file → { text, isError } (stringly errors were misdetected by startsWith("Error")). */
async function readFileSafe(relativePath) {
  const fullPath = resolveInsideRoot(relativePath);
  if (!fullPath) {
    return {
      text: `Error: access denied — path must be inside the spec repository (got: ${relativePath})`,
      isError: true,
    };
  }
  try {
    return { text: await readCached(fullPath), isError: false };
  } catch (err) {
    return { text: `Error reading ${relativePath}: ${err.message}`, isError: true };
  }
}

function withSizeNote(content) {
  if (content.length > LARGE_FILE_BYTES) {
    const lines = content.split("\n").length;
    return `> ⚠️ Large file (~${Math.round(content.length / 1024)}KB, ${lines} lines). Use read_spec_file/get_pattern_reference with offset+limit to slice, or search_standards to locate the section first.\n\n${content}`;
  }
  return content;
}

async function listFilesRecursive(dir, base = "") {
  const cacheKey = `${dir}|${base}`;
  const hit = listCache.get(cacheKey);
  if (hit && Date.now() - hit.at < LIST_TTL_MS) return hit.data;

  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.join(base, entry.name);
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subResults = await listFilesRecursive(fullPath, relPath);
      results = results.concat(subResults);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(relPath);
    }
  }
  listCache.set(cacheKey, { at: Date.now(), data: results });
  return results;
}

/** Nearest markdown heading at or above line `idx` — section context for a hit. */
function headingContext(lines, idx) {
  for (let i = idx; i >= 0; i--) {
    const m = lines[i].match(/^#{1,6}\s+(.*)/);
    if (m) return m[1].trim();
  }
  return "";
}

/**
 * Parse a search query: quoted segments are phrases, remaining words are
 * AND-ed terms. Returns { phrases: string[], terms: string[] } (lowercased).
 */
function parseQuery(raw) {
  const phrases = [];
  let rest = raw;
  const quoteRe = /"([^"]+)"/g;
  let m;
  while ((m = quoteRe.exec(raw)) !== null) {
    phrases.push(m[1].toLowerCase().trim());
    rest = rest.replace(m[0], " ");
  }
  const terms = rest
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return { phrases, terms };
}

function lineMatches(lineLower, { phrases, terms }) {
  return phrases.every((p) => lineLower.includes(p)) &&
    terms.every((t) => lineLower.includes(t));
}

/**
 * Parse magento-patterns.md index tables → Map(referencePath → {name, when}).
 * Table rows look like: | Pattern | Dùng khi | [Name](./references/x/y.md) |
 * Best-effort: returns an empty map when the format changes.
 */
async function buildReferenceSummaries() {
  const summaries = new Map();
  try {
    const content = await readCached(
      resolveInsideRoot("config/magento-patterns.md")
    );
    const rowRe =
      /^\|([^|]+)\|([^|]+)\|\s*\[[^\]]*\]\(\.\/references\/([^)|]+)\)\s*\|/;
    for (const line of content.split("\n")) {
      const m = rowRe.exec(line.trim());
      if (!m) continue;
      const refPath = m[3].trim();
      if (!refPath.endsWith(".md")) continue;
      summaries.set(refPath, {
        name: m[1].trim(),
        when: m[2].trim(),
      });
    }
  } catch {
    // Index unreadable → plain listing fallback.
  }
  return summaries;
}

/**
 * Grouped reference listing with "dùng khi" summaries from the pattern index,
 * so the agent can pick the right reference without a second lookup.
 */
async function buildReferenceListing() {
  const referencesDir = path.resolve(SPEC_ROOT, "config/references");
  const files = (await listFilesRecursive(referencesDir)).sort();
  const summaries = await buildReferenceSummaries();

  const groups = new Map();
  for (const f of files) {
    const dir = path.dirname(f) === "." ? "(root)" : path.dirname(f);
    if (!groups.has(dir)) groups.set(dir, []);
    const info = summaries.get(f);
    groups
      .get(dir)
      .push(
        `- ${f}${info ? ` — ${info.name}: ${info.when}` : ""}`
      );
  }

  const lines = [
    `Available references in config/references/ (${files.length} files, grouped by area; summary from magento-patterns.md index).`,
    `Call get_pattern_reference with a path below to read one.`,
    "",
  ];
  for (const [dir, entries] of groups) {
    lines.push(`## ${dir} (${entries.length})`);
    lines.push(...entries, "");
  }
  return lines.join("\n").trimEnd();
}

/**
 * Extract one markdown section (from a `## N.` heading to the next `## `).
 */
function extractSection(content, startHeading, nextHeading) {
  const start = content.indexOf(startHeading);
  if (start === -1) return "";
  const end = content.indexOf(nextHeading, start);
  return content.slice(start, end === -1 ? content.length : end).trim();
}

/**
 * Shared sliced read used by read_spec_file and get_pattern_reference.
 * offset is 1-based; both bounds are optional. Prepends a one-line header with
 * total line count so the agent knows how much is left.
 */
async function slicedRead(relativePath, args) {
  const { text: content, isError } = await readFileSafe(relativePath);
  if (isError) {
    return { text: content, isError: true };
  }

  const toInt = (v) =>
    Number.isInteger(v) && v > 0 ? v : null;
  const offset = toInt(args?.offset);
  const limit = toInt(args?.limit);

  const lines = content.split("\n");
  if (offset === null && limit === null) {
    return { text: withSizeNote(content), isError: false };
  }

  const start = (offset ?? 1) - 1;
  const end = limit === null ? lines.length : start + limit;
  const slice = lines.slice(Math.min(start, lines.length), Math.min(end, lines.length));
  const header = `# ${relativePath} — lines ${start + 1}-${Math.min(end, lines.length)} of ${lines.length}`;
  return {
    text: `${header}\n\n${slice.join("\n")}`,
    isError: false,
  };
}

// Slash-command prompts (MCP prompts capability). Each prompt is an instruction
// message telling the agent WHICH MCP tools to call — content stays in the KB.
const PROMPTS = [
  {
    name: "session-start",
    description:
      "Bootstrap đầu session: nạp chuẩn team Magento (SSOT) trước khi code.",
    arguments: [],
    build: () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Bootstrap session làm việc trên dự án Magento 2.4.8-p5 / PHP 8.3.",
              "",
              "Thực hiện theo thứ tự:",
              "1. Gọi tool `get_team_standards` để nạp Constitution + Checklist + Pattern index từ SSOT của team.",
              "2. Gọi tool `get_pattern_reference` (không truyền path) để lấy danh sách references chi tiết (đã kèm tóm tắt 'dùng khi' cho từng reference).",
              "3. Tóm tắt ngắn gọn (tối đa 10 dòng) các rule quan trọng nhất bạn sẽ tuân thủ: coding standard, những điều cấm (Constitution §2), scope governance (§9), testing policy (§10).",
              "4. Xác nhận đã sẵn sàng rồi chờ task. KHÔNG tự code gì trước khi có task cụ thể.",
            ].join("\n"),
          },
        },
      ],
    }),
  },
  {
    name: "review",
    description:
      "Review diff hiện tại theo Review Gate của team (checklist §12).",
    arguments: [],
    build: () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Review thay đổi code Magento hiện tại theo Review Gate của team.",
              "",
              "Thực hiện:",
              "1. Gọi tool `get_review_gate` để nạp checklist review (§12 là Review Gate).",
              "2. Xem diff hiện tại của repo (git diff HEAD; nếu có staged changes thì xem cả git diff --cached).",
              "3. Đối chiếu TỪNG mục checklist liên quan với diff; mọi vi phạm phải kèm file:line cụ thể.",
              "4. Phân loại MỖI finding theo taxonomy chuẩn (checklist.md §12): P0/BLOCKER — phải sửa trước khi merge; P1/RECOMMENDATION — sửa trong scope task HOẶC ghi follow-up có owner rõ ràng; P2/INFORMATIONAL — ghi nhận, không chặn. Mọi finding phải kèm bằng chứng file:line.",
              "5. Kết luận: PASS chỉ khi không còn P0/BLOCKER chưa xử lý (theo checklist §12); P1 phải đã fix hoặc được chấp nhận là follow-up; NEEDS FIX kèm danh sách issue và chỗ cần sửa.",
              "",
              "Lưu ý: KHÔNG tự sửa code — chỉ review và báo cáo.",
            ].join("\n"),
          },
        },
      ],
    }),
  },
  {
    name: "implement",
    description:
      "Implement một task Magento theo chuẩn team: load chuẩn → chọn pattern → code → review gate.",
    arguments: [
      {
        name: "task",
        description: "Mô tả task cần implement",
        required: true,
      },
    ],
    build: (args) => {
      if (typeof args?.task !== "string" || args.task.trim() === "") {
        throw new Error(
          "Prompt 'implement' requires a non-empty 'task' argument"
        );
      }
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Implement task Magento sau theo chuẩn team (SSOT): "${args.task.trim()}"`,
                "",
                "Quy trình bắt buộc:",
                "1. Gọi `get_team_standards` để nạp Constitution + Checklist + Pattern index.",
                "2. Chọn pattern liên quan từ Pattern index, đọc chi tiết qua `get_pattern_reference` hoặc `search_standards` — KHÔNG code theo trí nhớ.",
                "3. Trước khi code: nêu understanding của requirement, rủi ro thấy trước, và phương án nếu có nhiều cách làm (Constitution §15). Core-first: kiểm tra Magento core hỗ trợ sẵn trước khi build mới (§9).",
                "4. Implement theo chuẩn; viết unit test cho business logic (§10), TDD khi khả thi.",
                "5. Trước khi báo done: gọi `get_review_gate` và đối chiếu §12.",
              ].join("\n"),
            },
          },
        ],
      };
    },
  },
];

const server = new Server(
  {
    name: "magento-spec-mcp",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_team_standards",
        description:
          "Load Magento 2.4.8-p5 / PHP 8.3 team standards, constitution, checklist, and pattern index (Single Source of Truth - SSOT). Pass part='constitution'|'checklist'|'patterns' to load only one document instead of all three.",
        inputSchema: {
          type: "object",
          properties: {
            part: {
              type: "string",
              enum: ["constitution", "checklist", "patterns"],
              description:
                "Optional: load a single document. Omit for all three (full SSOT load).",
            },
          },
        },
      },
      {
        name: "get_review_gate",
        description:
          "Load code review gate checklist and DoD criteria for Magento code before marking done.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_pattern_reference",
        description:
          "Get specific Magento pattern reference doc from config/references/ (e.g. core/plugin-patterns.md, core/declarative-schema.md). Call without path to list all references grouped by area with 'when to use' summaries. Large docs can be sliced with offset/limit (1-based lines).",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Relative path under config/references/ (e.g. core/plugin-patterns.md). Omit to list all.",
            },
            offset: {
              type: "integer",
              minimum: 1,
              description:
                "Optional: 1-based start line, read only a slice of large docs.",
            },
            limit: {
              type: "integer",
              minimum: 1,
              description:
                "Optional: max number of lines to return from offset.",
            },
          },
        },
      },
      {
        name: "search_standards",
        description:
          "Search Magento standards, rules, patterns, and example blueprints by keyword (scans config/ and examples/). Multiple words are AND-ed; use quotes for exact phrases. Results are grouped per file with line numbers and nearest heading, so you can jump straight to the section with get_pattern_reference/read_spec_file offset.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Keyword(s) — multiple words AND-ed; \"quoted phrase\" for exact match.",
            },
            scope: {
              type: "string",
              enum: ["all", "config", "references", "examples"],
              description:
                "Optional: restrict search — 'references' only scans config/references/, 'config' scans all of config/, 'examples' only examples/. Default: all.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "read_spec_file",
        description:
          "Read any markdown documentation file in this spec repository — config/, examples/, README.md, etc. Large docs can be sliced with offset/limit (1-based lines) to save tokens.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Repo-relative file path (e.g. config/constitution.md, examples/INDEX.md)",
            },
            offset: {
              type: "integer",
              minimum: 1,
              description:
                "Optional: 1-based start line — read only a slice of large docs.",
            },
            limit: {
              type: "integer",
              minimum: 1,
              description:
                "Optional: max number of lines to return from offset.",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_team_standards") {
    const part =
      typeof args?.part === "string" ? args.part.toLowerCase() : "all";

    if (part === "all") {
      let output = "# Magento 2.4.8-p5 / PHP 8.3 Team Standards (SSOT)\n\n";
      let anyError = false;
      for (const rel of CORE_FILES) {
        const { text: content, isError } = await readFileSafe(rel);
        anyError = anyError || isError;
        output += `---\n## ${rel}\n\n${content}\n\n`;
      }
      return {
        content: [{ type: "text", text: output }],
        isError: anyError,
      };
    }

    const rel = STANDARD_PARTS[part];
    if (!rel) {
      return {
        content: [
          {
            type: "text",
            text: `Error: unknown part "${args?.part}". Valid values: constitution, checklist, patterns (or omit for all).`,
          },
        ],
        isError: true,
      };
    }
    const { text: content, isError } = await readFileSafe(rel);
    return {
      content: [{ type: "text", text: `# ${rel} (SSOT)\n\n${content}` }],
      isError,
    };
  }

  if (name === "get_review_gate") {
    const { text: content, isError: checklistError } = await readFileSafe(
      "config/checklist.md"
    );
    const { text: constitution, isError: constitutionError } =
      await readFileSafe("config/constitution.md");
    const dod = extractSection(constitution, "## 11.", "## 12.");
    const dodBlock =
      dod ||
      `> ⚠️ Không tìm thấy mục DoD — heading "## 11." / "## 12." trong config/constitution.md đã đổi? Kiểm tra lại số mục.\n`;
    const output = `# Review Gate Checklist (SSOT)\n\n${content}\n\n---\n# Definition of Done (Constitution §11)\n\n${dodBlock}\n`;
    return {
      content: [{ type: "text", text: output }],
      isError: checklistError || constitutionError,
    };
  }

  if (name === "get_pattern_reference") {
    const refPath = args?.path;

    if (typeof refPath !== "string" || refPath.trim() === "") {
      try {
        return {
          content: [{ type: "text", text: await buildReferenceListing() }],
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: `Error listing references: ${err.message}` },
          ],
        };
      }
    }

    const fullRelPath = refPath.startsWith("config/references/")
      ? refPath
      : `config/references/${refPath}`;

    const { text, isError } = await slicedRead(fullRelPath, args);
    return {
      content: [{ type: "text", text }],
      isError,
    };
  }

  if (name === "search_standards") {
    const rawQuery =
      typeof args?.query === "string" ? args.query.trim() : "";
    if (!rawQuery) {
      return {
        content: [{ type: "text", text: "Error: query is required" }],
        isError: true,
      };
    }

    const scope =
      typeof args?.scope === "string" ? args.scope.toLowerCase() : "all";
    const scopeRoots = {
      all: ["config", "examples"],
      config: ["config"],
      references: ["config/references"],
      examples: ["examples"],
    };
    if (!scopeRoots[scope]) {
      return {
        content: [
          {
            type: "text",
            text: `Error: unknown scope "${args?.scope}". Valid values: all, config, references, examples.`,
          },
        ],
        isError: true,
      };
    }

    const parsed = parseQuery(rawQuery);
    if (parsed.phrases.length === 0 && parsed.terms.length === 0) {
      return {
        content: [{ type: "text", text: `Error: query is required` }],
        isError: true,
      };
    }

    try {
      const fileGroups = [];
      for (const root of scopeRoots[scope]) {
        const absRoot = path.resolve(SPEC_ROOT, root);
        const base = root;
        fileGroups.push(await listFilesRecursive(absRoot, base));
      }
      const files = fileGroups.flat();

      const pathMatches = [];
      const fileHits = new Map(); // file → array of {no, section, text}
      let totalMatches = 0;

      for (const relPath of files) {
        if (SEARCH_EXCLUDE.has(relPath)) continue;
        const lowerRel = relPath.toLowerCase();
        if (parsed.phrases.every((p) => lowerRel.includes(p)) &&
            parsed.terms.every((t) => lowerRel.includes(t))) {
          pathMatches.push(relPath);
        }
        const { text: content, isError: readError } = await readFileSafe(relPath);
        if (readError) continue;
        const lines = content.split("\n");

        // Pass 1 — line-level: every term on the same line.
        const hits = [];
        for (let idx = 0; idx < lines.length; idx++) {
          if (lineMatches(lines[idx].toLowerCase(), parsed)) {
            totalMatches++;
            if (hits.length < SEARCH_MAX_LINES_PER_FILE) {
              hits.push({
                no: idx + 1,
                section: headingContext(lines, idx),
                text: lines[idx].trim().slice(0, SEARCH_CONTEXT_CHARS),
              });
            }
          }
        }
        if (hits.length > 0) {
          fileHits.set(relPath, hits);
          continue;
        }

        // Pass 2 — section-level fallback: every term inside one heading
        // section (terms spread across lines of the same topic).
        const headingRe = /^#{1,6}\s+(.*)/;
        let secTitle = "(file top)";
        let secRows = [];
        const secHits = [];
        const flushSection = () => {
          if (secRows.length === 0 || secHits.length >= SEARCH_MAX_LINES_PER_FILE) {
            secRows = [];
            return;
          }
          const joined = secRows.map((r) => r.lower).join("\n");
          if (!lineMatches(joined, parsed)) {
            secRows = [];
            return;
          }
          for (const r of secRows) {
            const anyTerm =
              parsed.phrases.some((p) => r.lower.includes(p)) ||
              parsed.terms.some((t) => r.lower.includes(t));
            if (anyTerm) {
              secHits.push({
                no: r.no,
                section: secTitle,
                text: r.raw.trim().slice(0, SEARCH_CONTEXT_CHARS),
              });
              if (secHits.length >= SEARCH_MAX_LINES_PER_FILE) break;
            }
          }
          secRows = [];
        };
        for (let idx = 0; idx < lines.length; idx++) {
          const heading = lines[idx].match(headingRe);
          if (heading) {
            flushSection();
            secTitle = heading[1].trim();
            continue;
          }
          secRows.push({
            no: idx + 1,
            raw: lines[idx],
            lower: lines[idx].toLowerCase(),
          });
        }
        flushSection();
        if (secHits.length > 0) {
          totalMatches += secHits.length;
          fileHits.set(relPath, secHits);
        }
      }

      const parts = [];
      let emitted = 0;
      for (const [relPath, hits] of fileHits) {
        if (emitted >= SEARCH_MAX_TOTAL) break;
        parts.push(`## ${relPath}`);
        for (const h of hits) {
          if (emitted >= SEARCH_MAX_TOTAL) {
            parts.push(`  … (more matches truncated)`);
            break;
          }
          const sec = h.section ? ` [${h.section}]` : "";
          parts.push(`  L${h.no}${sec}: ${h.text}`);
          emitted++;
        }
        parts.push("");
      }

      let resultText;
      if (parts.length === 0 && pathMatches.length === 0) {
        resultText =
          `No matches for "${rawQuery}" in ${scope === "all" ? "config/ + examples/" : scopeRoots[scope].join(", ")}. ` +
          `Try a shorter keyword, or browse magento-patterns.md via get_team_standards(part='patterns').`;
      } else {
        const scopeNote =
          totalMatches > emitted ? ` (showing ${emitted} of ${totalMatches})` : "";
        resultText = `Search "${rawQuery}" — ${totalMatches} line matches in ${fileHits.size} files${scopeNote}:\n\n${parts.join("\n").trimEnd()}`;
        if (pathMatches.length > 0) {
          resultText += `\n\nFilename matches: ${pathMatches.slice(0, 15).map((f) => f).join(", ")}${pathMatches.length > 15 ? ", …" : ""}`;
        }
        resultText += `\n\nNext: read the section with get_pattern_reference/read_spec_file + offset=<line>, or read the whole file if small.`;
      }

      return { content: [{ type: "text", text: resultText }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Search error: ${err.message}` }],
      };
    }
  }

  if (name === "read_spec_file") {
    if (typeof args?.path !== "string" || args.path.trim() === "") {
      return {
        content: [
          { type: "text", text: "Error: path is required (e.g. config/constitution.md)" },
        ],
        isError: true,
      };
    }
    const { text, isError } = await slicedRead(args.path, args);
    return {
      content: [{ type: "text", text }],
      isError,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS.map(({ name, description, arguments: args }) => ({
    name,
    description,
    arguments: args,
  })),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const prompt = PROMPTS.find((p) => p.name === name);
  if (!prompt) {
    throw new Error(
      `Unknown prompt: ${name} (available: ${PROMPTS.map((p) => p.name).join(", ")})`
    );
  }
  return { description: prompt.description, ...prompt.build(args ?? {}) };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Magento Spec MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
