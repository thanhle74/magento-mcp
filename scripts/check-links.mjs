#!/usr/bin/env node
// KB integrity check: dead relative links + orphan reference files.
// Exit 1 on any problem. Run: npm run check:links (also runs in CI).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = ["config", "examples"];
const ROOT_DOCS = ["README.md", "AGENTS.md"];
// Files that must be referenced (by path or basename) from another scanned doc.
const ORPHAN_SCOPES = ["config/references", "examples"];

async function listMdFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(path.join(ROOT, dir), { withFileTypes: true });
  } catch {
    return [];
  }
  let results = [];
  for (const entry of entries) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await listMdFiles(rel));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(rel);
    }
  }
  return results;
}

const files = [];
for (const doc of ROOT_DOCS) {
  try {
    await fs.stat(path.join(ROOT, doc));
    files.push(doc);
  } catch {
    // root doc absent — skip
  }
}
for (const dir of SCAN_DIRS) {
  files.push(...(await listMdFiles(dir)));
}

// Materialize contents once: reused by both checks.
const contents = new Map();
for (const rel of files) {
  contents.set(rel, await fs.readFile(path.join(ROOT, rel), "utf-8"));
}

// --- Check 1: every relative markdown link resolves to an existing file ---
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const deadLinks = [];
let checkedLinks = 0;

for (const rel of contents.keys()) {
  const content = contents.get(rel);
  for (const match of content.matchAll(LINK_RE)) {
    let target = match[1];
    if (/^(https?:|mailto:|#|\/)/.test(target)) continue; // external / anchor-only / absolute
    target = target.split("#")[0];
    if (!target) continue;
    checkedLinks++;
    const resolved = path.resolve(ROOT, path.dirname(rel), decodeURIComponent(target));
    let exists = true;
    try {
      await fs.stat(resolved);
    } catch {
      exists = false;
    }
    if (!exists) deadLinks.push(`${rel} → ${target}`);
  }
}

// --- Check 2: no orphan reference/example files ---
const orphans = [];
for (const rel of contents.keys()) {
  if (!ORPHAN_SCOPES.some((scope) => rel.startsWith(scope + "/"))) continue;
  const basename = path.basename(rel);
  let referenced = false;
  for (const [other, content] of contents) {
    if (other === rel) continue;
    if (content.includes(rel) || content.includes(basename)) {
      referenced = true;
      break;
    }
  }
  if (!referenced) orphans.push(rel);
}

console.log(`Checked ${checkedLinks} relative links across ${contents.size} files.`);
if (deadLinks.length > 0) {
  console.error(`\n✗ Dead links (${deadLinks.length}):`);
  for (const l of deadLinks) console.error(`  - ${l}`);
}
if (orphans.length > 0) {
  console.error(
    `\n✗ Orphan files — not linked from any index/doc (${orphans.length}):`
  );
  for (const o of orphans) console.error(`  - ${o}`);
  console.error("  → Add a row in config/magento-patterns.md or examples/INDEX.md.");
}

if (deadLinks.length > 0 || orphans.length > 0) process.exit(1);
console.log("✓ No dead links, no orphan reference files.");
