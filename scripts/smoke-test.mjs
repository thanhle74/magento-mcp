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

// 6. large file gets size warning
const big = await call("tools/call", {
  name: "get_pattern_reference",
  arguments: { path: "frontend/ui-component-library.md" },
});
check("large file gets size warning", big.result.content[0].text.startsWith("> ⚠️"));

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

clearTimeout(timeout);
const failed = results.filter((r) => !r.ok).length;
proc.kill();
console.log(failed === 0 ? "\nAll smoke tests passed" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
