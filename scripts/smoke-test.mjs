#!/usr/bin/env node
// Smoke test: spawn the MCP server over stdio and assert basic behaviors.
// Run: npm test
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const proc = spawn(process.execPath, [path.join(root, "src/index.js")], {
  stdio: ["pipe", "pipe", "inherit"],
});

const send = (msg) => proc.stdin.write(JSON.stringify(msg) + "\n");
const requests = new Map();
let nextId = 1;
const call = (method, params) =>
  new Promise((resolve) => {
    const id = nextId++;
    requests.set(id, resolve);
    send({ jsonrpc: "2.0", id, method, params });
  });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

let buffer = "";
proc.stdout.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id && requests.has(msg.id)) {
      requests.get(msg.id)(msg);
      requests.delete(msg.id);
    }
  }
});

const timeout = setTimeout(() => {
  console.error("TIMEOUT: server did not respond");
  proc.kill();
  process.exit(1);
}, 20000);

const init = await call("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke-test", version: "0" },
});
check(
  "server declares tools + prompts capabilities",
  init.result?.capabilities?.tools !== undefined &&
    init.result?.capabilities?.prompts !== undefined
);

// VERSION in src/index.js must not drift from package.json
const { readFile: fsReadFile } = await import("node:fs/promises");
const pkgVersion = JSON.parse(
  await fsReadFile(path.join(root, "package.json"), "utf-8")
).version;
check(
  "server version matches package.json",
  init.result?.serverInfo?.version === pkgVersion,
  `${init.result?.serverInfo?.version} vs package.json ${pkgVersion}`
);

send({ jsonrpc: "2.0", method: "notifications/initialized" });

// 1. tools/list — 5 tools
const tools = await call("tools/list", {});
const names = tools.result.tools.map((t) => t.name);
check("tools/list returns 5 tools", names.length === 5, names.join(", "));

// 2. path traversal blocked
const escape = await call("tools/call", {
  name: "read_spec_file",
  arguments: { path: "../escape-attempt.md" },
});
check(
  "path traversal blocked",
  escape.result.content[0].text.includes("access denied") && escape.result.isError === true
);

// 3. missing arg → isError
const missing = await call("tools/call", { name: "read_spec_file", arguments: {} });
check("missing path → isError", missing.result.isError === true);

// 4. read core file
const core = await call("tools/call", {
  name: "read_spec_file",
  arguments: { path: "config/constitution.md" },
});
check(
  "read constitution",
  core.result.content[0].text.includes("Constitution") && !core.result.isError
);

// 5. search hits config AND examples
const search = await call("tools/call", {
  name: "search_standards",
  arguments: { query: "blueprint" },
});
const searchText = search.result.content[0].text;
check(
  "search covers config/ and examples/",
  searchText.includes("examples/") || searchText.includes("config/"),
  searchText.split("\n")[0]
);

// 6. size discipline: no reference file exceeds the 30KB token guard
const fsMod = await import("node:fs/promises");
const pathMod = await import("node:path");
const refsRoot = pathMod.join(root, "config", "references");
const walkMd = async (dir) => {
  const out = [];
  for (const e of await fsMod.readdir(dir, { withFileTypes: true })) {
    const p = pathMod.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkMd(p)));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
};
const allRefFiles = await walkMd(refsRoot);
let largest = { size: 0, rel: "" };
for (const f of allRefFiles) {
  const { size } = await fsMod.stat(f);
  if (size > largest.size) largest = { size, rel: pathMod.relative(root, f) };
}
check(
  "reference size discipline (largest ≤ 30KB guard)",
  largest.size <= 30 * 1024,
  `largest: ${largest.rel} = ${largest.size}B`
);

// 7. references listing has no deleted files
const list = await call("tools/call", { name: "get_pattern_reference", arguments: {} });
const listText = list.result.content[0].text;
check(
  "reference listing clean (no merged/removed files)",
  !/plugins\.md|di-codegen|series\.md|release-notes/.test(listText)
);

// 8. prompts/list — 3 prompts
const prompts = await call("prompts/list", {});
const promptNames = prompts.result.prompts.map((p) => p.name);
check(
  "prompts/list returns 3 prompts",
  promptNames.length === 3 && promptNames.includes("implement"),
  promptNames.join(", ")
);

// 9. prompts/get interpolates the task argument
const impl = await call("prompts/get", {
  name: "implement",
  arguments: { task: "add admin grid" },
});
check(
  "prompts/get implement interpolates task",
  impl.result?.messages?.[0]?.content?.text?.includes("add admin grid")
);

// 10. prompts/get with missing required argument → JSON-RPC error
const noTask = await call("prompts/get", { name: "implement", arguments: {} });
check("prompts/get implement without task → error", noTask.error !== undefined);

// 11. prompts/get unknown prompt → JSON-RPC error
const bogus = await call("prompts/get", { name: "nope" });
check("prompts/get unknown prompt → error", bogus.error !== undefined);

// 12. review prompt uses the canonical severity taxonomy (checklist §12)
const review = await call("prompts/get", { name: "review", arguments: {} });
const reviewText = review.result?.messages
  ?.map((m) => m.content?.text ?? "")
  .join("\n");
check(
  "review prompt has canonical severity terms",
  ["P0", "P1", "P2", "BLOCKER", "RECOMMENDATION", "INFORMATIONAL"].every((t) =>
    reviewText.includes(t)
  )
);
check(
  "review prompt does not teach Critical/High/Medium/Low gate",
  !/Critical\s*\/\s*High/.test(reviewText)
);

// 13. get_team_standards part=checklist loads only the checklist
const partChecklist = await call("tools/call", {
  name: "get_team_standards",
  arguments: { part: "checklist" },
});
const partText = partChecklist.result.content[0].text;
check(
  "get_team_standards part=checklist loads only checklist",
  partText.includes("Review gate") === false || partText.length < 20000,
  `${partText.length} bytes`
);
check(
  "part=checklist excludes constitution body",
  !partText.includes("Object Readiness")
);

// 14. get_team_standards unknown part → isError with valid values
const badPart = await call("tools/call", {
  name: "get_team_standards",
  arguments: { part: "nope" },
});
check(
  "get_team_standards unknown part → isError",
  badPart.result.isError === true &&
    badPart.result.content[0].text.includes("constitution")
);

// 15. read_spec_file offset/limit slice
const slice = await call("tools/call", {
  name: "read_spec_file",
  arguments: { path: "config/constitution.md", offset: 56, limit: 8 },
});
const sliceText = slice.result.content[0].text;
check(
  "read_spec_file slice returns bounded lines with header",
  sliceText.startsWith("# config/constitution.md — lines 56-63 of") &&
    sliceText.split("\n").length <= 12 // header + blank + 8 sliced lines
);

// 16. search_standards scope=references + multi-term AND
const scoped = await call("tools/call", {
  name: "search_standards",
  arguments: { query: "webhook payment", scope: "references" },
});
const scopedText = scoped.result.content[0].text;
check(
  "search scope=references multi-term AND works",
  scopedText.includes("config/references/") &&
    !scopedText.includes("examples/") &&
    scopedText.includes("[") // heading context present
);

// 17. grouped reference listing carries 'dùng khi' summaries
const listing = await call("tools/call", { name: "get_pattern_reference", arguments: {} });
const listingText = listing.result.content[0].text;
check(
  "reference listing grouped with summaries",
  listingText.includes("## core (") &&
    listingText.includes("— Plugin (Interceptor):")
);

// 18. section-level fallback: terms spread across lines of one section
const sectionFallback = await call("tools/call", {
  name: "search_standards",
  arguments: { query: "plugin sortOrder conflict" },
});
const sfText = sectionFallback.result.content[0].text;
check(
  "search section-level fallback finds spread terms",
  sfText.includes("magento-patterns.md") && sfText.includes("L33")
);

clearTimeout(timeout);
const failed = results.filter((r) => !r.ok).length;
proc.kill();
console.log(failed === 0 ? "\nAll smoke tests passed" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
