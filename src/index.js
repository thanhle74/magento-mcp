#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPEC_ROOT = process.env.SPEC_ROOT || path.resolve(__dirname, "..");

const CORE_FILES = [
  "config/constitution.md",
  "config/checklist.md",
  "config/magento-patterns.md",
];

// Bookkeeping logs — not standards; excluded from search results.
const SEARCH_EXCLUDE = new Set(["config/research-log.md"]);

// Content cache validated by mtime, so edited files are re-read.
const fileCache = new Map();

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

async function readFileSafe(relativePath) {
  const fullPath = resolveInsideRoot(relativePath);
  if (!fullPath) {
    return `Error: access denied — path must be inside the spec repository (got: ${relativePath})`;
  }
  try {
    return await readCached(fullPath);
  } catch (err) {
    return `Error reading ${relativePath}: ${err.message}`;
  }
}

async function listFilesRecursive(dir, base = "") {
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
  return results;
}

const server = new Server(
  {
    name: "magento-spec-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_team_standards",
        description:
          "Load Magento 2.4.8-p4 / PHP 8.3 team standards, constitution, checklist, and pattern index (Single Source of Truth - SSOT).",
        inputSchema: {
          type: "object",
          properties: {},
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
          "Get specific Magento pattern reference doc from config/references/ (e.g. core/plugin-patterns.md, core/declarative-schema.md). Call without path to list all available references.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Relative path under config/references/ (e.g. core/plugin-patterns.md). Omit to list all.",
            },
          },
        },
      },
      {
        name: "search_standards",
        description:
          "Search for Magento standards, rules, and patterns in config/ by keyword.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Keyword or phrase to search",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "read_spec_file",
        description:
          "Read any markdown documentation file in this spec repository — config/, examples/, README.md, etc.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Repo-relative file path (e.g. config/constitution.md, examples/INDEX.md)",
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
    let output = "# Magento 2.4.8-p4 / PHP 8.3 Team Standards (SSOT)\n\n";
    for (const rel of CORE_FILES) {
      const content = await readFileSafe(rel);
      output += `---\n## ${rel}\n\n${content}\n\n`;
    }
    return {
      content: [{ type: "text", text: output }],
    };
  }

  if (name === "get_review_gate") {
    const content = await readFileSafe("config/checklist.md");
    const output = `# Review Gate Checklist (SSOT)\n\n${content}`;
    return {
      content: [{ type: "text", text: output }],
    };
  }

  if (name === "get_pattern_reference") {
    const refPath = args?.path;
    const referencesDir = path.resolve(SPEC_ROOT, "config/references");

    if (typeof refPath !== "string" || refPath.trim() === "") {
      // List available references
      try {
        const files = await listFilesRecursive(referencesDir);
        return {
          content: [
            {
              type: "text",
              text: `Please specify a pattern reference path. Available references in config/references/:\n\n${files
                .map((f) => `- ${f}`)
                .join("\n")}`,
            },
          ],
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

    const content = await readFileSafe(fullRelPath);
    return {
      content: [{ type: "text", text: content }],
    };
  }

  if (name === "search_standards") {
    const query =
      typeof args?.query === "string" ? args.query.toLowerCase().trim() : "";
    if (!query) {
      return { content: [{ type: "text", text: "Error: query is required" }] };
    }

    const configDir = path.resolve(SPEC_ROOT, "config");
    let matches = [];

    try {
      const files = await listFilesRecursive(configDir, "config");
      for (const relPath of files) {
        if (SEARCH_EXCLUDE.has(relPath)) continue;
        const content = await readFileSafe(relPath);
        if (content.toLowerCase().includes(query)) {
          const lines = content.split("\n");
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query)) {
              matches.push(`${relPath}:${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }

      const resultText =
        matches.length > 0
          ? `Search results for "${query}" (${matches.length} matches):\n\n` +
            matches.slice(0, 50).join("\n") +
            (matches.length > 50 ? "\n... (truncated)" : "")
          : `No matches found for "${query}" in config/`;

      return {
        content: [{ type: "text", text: resultText }],
      };
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
      };
    }
    const content = await readFileSafe(args.path);
    return {
      content: [{ type: "text", text: content }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
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
