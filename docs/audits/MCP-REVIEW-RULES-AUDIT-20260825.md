# Audit: magento-spec MCP knowledge + code-review rules (2026-08-25)

Repo: `/home/thanhle/Sites/spec` · Branch: `task/review-rules-mcp-audit-20260825` (from `main` @ `6ecee73`)

## 1. Repo discovery

- Identity (correction 2026-08-25, TL-verified): MCP name **magento-spec** (registered MCP server name, unchanged); GitHub repo **thanhle74/magento-mcp**; local path `/home/thanhle/Sites/spec`. Origin normalized from legacy `git@github.com:thanhle74/spec.git` (GitHub redirect) to `git@github.com:thanhle74/magento-mcp.git` after verifying fetch/push access.
- Pre-existing dirty work at audit start: coherent in-progress **MCP v1.2.0** feature (prompts capability in `src/index.js`, `scripts/check-links.mjs`, `.github/workflows/ci.yml`, README/AGENTS/package.json updates). Preserved and committed as separate attributed commit `a5db012` before audit changes.
- MCP entry: `node /home/thanhle/Sites/spec/src/index.js` (stdio, `@modelcontextprotocol/sdk`), registered in `~/.claude.json`. 5 tools, 3 prompts, substring search over `config/**/*.md` + `examples/**/*.md` (50-cap, `research-log.md` excluded, mtime cache, traversal guard).

## 2. Rule classification summary (Phase 3)

Audited: `config/constitution.md` (§1–16), `config/checklist.md` (§0–12), `config/magento-patterns.md`, `config/glossary.md`, and deep-read references: payment-gateway, rate-limiting, cache-management, unit-testing, multi-store, inventory-msi, event-observer-patterns (partial), admin-form, laybyland, examples/INDEX.

| Rule / area | Classification | Note |
|---|---|---|
| Constitution §1–§9 (strict_types, no OM, no core edits, declarative schema, preference-last, service contracts) | VALID | Framework invariants, consistent with core docs |
| Constitution §2 "no hardcoded store/website/group IDs" | VALID (reinforced by new multi-store §12) | |
| Constitution §10 testing policy (TDD, createMock only) | VALID + AMBIGUOUS edge | `unit-testing.md` §7D/§7a offers ObjectManager Helper for ≥5 deps — test-helper OM is fine, but doc should note it is test-scope only; left as-is (constitution says production code) |
| Constitution §16 / checklist §10 (PaySquad cron pitfalls) | PROJECT_SPECIFIC_NOT_FRAMEWORK_RULE | Kept but clearly labeled "rút kinh nghiệm PaySquad" — already labeled; not promoted to universal rules |
| `magento-patterns.md` "Quy tắc cứng" block | DUPLICATED (intentional) | Mirrors constitution §1–2 as index convenience; accepted, flagged for future drift risk |
| Glossary order `entity_id` vs `increment_id` | VALID | Verified against `OrderRepository::get($id)` contract |
| payment-gateway.md §0–§16 | VALID | Adapter/command-pool patterns match core; §12 area-scoped di.xml note verified against core behavior |
| payment-gateway.md §16 `strpos` prefix warning | PROJECT_SPECIFIC_NOT_FRAMEWORK_RULE (labeled Laybyland) | Correctly scoped in doc |
| rate-limiting.md §1–§4 (backpressure 2.4.7+) | VALID | Matches Adobe docs; version-scoped correctly |
| cache-management.md §2 (pre-audit) | **TOO_WEAK** | Did not document `App\Cache\Proxy::clean($tags)` contract — the exact trap that caused a real production no-op (Slaunchpad AiCommerce, redis MONITOR proof). **Fixed in this audit** |
| cache-management.md (pre-audit) on invalidation | **TOO_WEAK** | No coverage of MSI stock invalidation (`clean_cache_by_tags` + `cat_p` identities) or ETag/backend-work distinction. **Fixed** |
| event-observer-patterns.md §8 `clean_cache_by_tags` | VALID but TOO_WEAK example | Example only handles custom entity identities; MSI/product-tag usage added cross-ref via cache-management §10 |
| unit-testing.md (pre-audit) | TOO_WEAK | No guidance on realistic persisted data shapes, magic-method Event mocks, or runtime proof. **Fixed** (§9, §10) |
| multi-store.md (pre-audit) | TOO_WEAK | No root-category/path semantics, url_rewrite store scoping, or implicit-current-store hazard. **Fixed** (§10–12) |
| admin-form.md / ui-components.md (pre-audit) | GAP (NO_RESULT on retrieval) | No ui-select guidance for entity pickers. **Fixed** (admin-form §9) |
| checklist.md §12 review gate | TOO_WEAK | No severity vocabulary. **Fixed** (P0/P1/P2 ↔ BLOCKER/RECOMMENDATION/INFORMATIONAL table) |
| No conflicts with Magento core found | — | All core claims verified read-only against Slaunchpad `vendor/magento` (see §3) |

## 3. Core verification evidence (Phase 4 — read-only, Slaunchpad vendor/magento)

| Claim | Core evidence |
|---|---|
| Product Edit Categories field uses ui-select | `Magento_Catalog/Ui/DataProvider/Product/Form/Modifier/Categories.php:248,285` (`category_ids`, elementTmpl `ui/grid/filters/elements/ui-select`); Websites.php:309 same component |
| Category tree root | `Magento\Catalog\Model\Category::TREE_ROOT_ID = 1` (line 71); legacy `ROOT_CATEGORY_ID = 0` (line 66) |
| Store-group root category | `Magento\Store\Api\Data\GroupInterface::getRootCategoryId()` |
| `clean($tags)` Proxy contract | `Magento\Framework\App\Cache\Proxy::clean()` — Zend-style mode string becomes a tag; runtime-proven this session via redis MONITOR (`SINTER zc:ti:798_MATCHINGTAG`) |
| MSI invalidation signal | `module-inventory-cache/etc/di.xml` → `clean_cache_by_tags` + `CacheContext` identities `cat_p_<id>` on source-item sync + reservation queue; stock changes fire no `catalog_product_save_*` |

## 4. Changes made (Phases 5–7, 9)

| File | Change |
|---|---|
| `config/references/infrastructure/cache-management.md` | §2: `CacheInterface::clean([tags])` Proxy-contract trap (lesson: real production no-op). §10 invalidation completeness incl. MSI via `clean_cache_by_tags`, bounded-TTL rule. §11 ETag/304 vs backend vs edge (lessons F/G) |
| `config/references/ops/multi-store.md` | §10 root category/category path `1/<root>/<child>`/cross-root leakage/no N+1 (lesson D); §11 url_rewrite store-scoped, data-vs-code, no fabricated URLs (lesson E); §12 no implicit current-store config reads (lesson C) |
| `config/references/frontend/admin-form.md` | §9 reuse core ui-select for entity pickers, no custom jstree (lesson B) with core file refs |
| `config/references/ops/unit-testing.md` | §9 realistic persisted data shapes table + Event magic-method mock builder (lesson A); §10 bounded runtime proof after mock-heavy tests (lesson J) |
| `config/references/security/payment-gateway.md` | §17 redirect payment flow review rules: browser-return ≠ proof, idempotent callback, signature/amount/currency verify, state via services not raw SQL, URL expiry cron, expiry-vs-late-callback race, no auto-cancel when paid, multi-attempt state model (Phase 6; provider-agnostic — no VNPAY/MoMo/ZaloPay claims) |
| `config/references/security/rate-limiting.md` | §4 edge-vs-Magento responsibility split table (lesson H, labeled architecture guidance) |
| `config/checklist.md` | §12 severity table (P0/P1/P2 ↔ BLOCKER/RECOMMENDATION/INFORMATIONAL); new §13 root-cause data-vs-code + invalidation completeness + Proxy-clean + persisted fixtures + runtime proof + admin UI reuse (lesson I + gate items) |
| 5 references | Added `> Từ khóa tra cứu:` alias lines (retrieval metadata, not hardcoded answers) |

No Magento core files touched. No new scattered micro-docs — all lessons folded into existing indexed references (check-links enforces index discipline; no index changes needed).

## 5. Retrieval tests (Phase 8, before → after)

| # | Query | Before | After |
|---|---|---|---|
| 1 | `Categories selector Product Edit` | NO_RESULT | GOOD — admin-form.md §9 (+ keyword line) |
| 2 | `root category` | PARTIAL (glossary rows only) | GOOD — multi-store.md §10 full semantics |
| 3 | `category path` | NO_RESULT | GOOD — multi-store.md §10 + checklist §13 |
| 4 | `url rewrite` / `url_rewrite` | PARTIAL (1 unrelated graphql hit) | GOOD — multi-store.md §11 store-scoping rules |
| 5 | `config scope` | NO_RESULT | GOOD — multi-store.md §12 + keyword line |
| 6 | `clean_cache_by_tags` / `MSI stock` | GOOD (event doc) | GOOD — now also cache-management §10 + checklist §13 |
| 7 | `ETag` | MISLEADING (unrelated `cacheTag` hits only) | GOOD — cache-management §11 distinction table |

## 6. Validation (Phase 10)

| Check | Result |
|---|---|
| MCP server starts; smoke test | `npm test` — all 13 assertions pass |
| tools/list (5 tools) + prompts (3) | pass |
| `npm run check:links` | 937 links / 160 files, 0 dead, 0 orphans |
| Secrets / generated artifacts staged | none (only tracked .md edits + this audit doc) |
| Magento core files modified | none |

## 7. Git

- Task branch `task/review-rules-mcp-audit-20260825` from `main` @ `6ecee73`.
- Commit 1 (`a5db012`): preserved pre-existing v1.2.0 work (separately attributed).
- Commit 2: audit changes + this document.
- Pushed to origin; **not merged to main** — awaiting independent review.


## 8. Correction (2026-08-25, follow-up review)

- **Severity taxonomy SSOT**: unified to P0/BLOCKER, P1/RECOMMENDATION, P2/INFORMATIONAL.
  Updated: `src/index.js` `review` prompt (was Critical/High/Medium/Low), `config/checklist.md` §12 gate line, `config/constitution.md` blocking rules (3 occurrences of Critical/High). No stricter gate invented — completion rule = no unresolved P0/BLOCKER; P1 fixed or accepted as follow-up with owner; P2 informational.
- **ObjectManager-in-tests**: checklist §9 `createMock()`-only rule confirmed **intentional stricter team policy** vs Magento permissiveness (`unit-testing.md` §7D OM Helper) — now documented in §9; not loosened.
- **Runtime proof**: scoped to framework-sensitive changes only (checklist §13, unit-testing.md §10 wording already bounded) — verified, no change needed.
- **MSI invalidation wording**: claims limited to what core evidence proves (same `clean_cache_by_tags`/`cat_p` signal core `module-inventory-cache` uses for FPC; no claim of universal coverage; bounded-TTL fallback required for unprovable sources) — verified, no change needed.
- **Repo identity**: local origin normalized to `thanhle74/magento-mcp.git` (metadata only).
- **Regression**: smoke test now asserts the `review` prompt contains canonical severity terms and no Critical/High/Medium/Low gate instruction; 7 retrieval queries re-run — GOOD ×7.
