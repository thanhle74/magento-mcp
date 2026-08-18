# Integration import — middleware (Laybyland) — agent index

> **Mục đích:** tóm tắt quyết định đã chốt + đường dẫn tài liệu/code để agent **không phải suy đoán lại** khi chat mới. Chi tiết luồng, SQL, pseudo-code nằm ở tech design repo root — **đây không thay thế** file đó.

---

## Tech design (nguồn sự thật chi tiết)

| Tài liệu | Path (từ repo root `src/`) |
|----------|----------------------------|
| Tech design (đầy đủ B0–B9, schema, cron, phụ lục) | [`integration_import_tech_design_202605130620485055896.md`](../../../integration_import_tech_design_202605130620485055896.md) |
| HTML export (paste task / comment) | `integration_import_tech_design_202605130620485055896.html` (cùng thư mục với `.md`) |

Nếu sau này đổi tên file tech design (snapshot ngày khác): **cập nhật lại bảng trên** và dòng đầu glossary `integration_import` → link mới.

---

## Quyết định kiến trúc (đồng bộ với tech design — chỉ tóm tắt)

| Chủ đề | Đã chốt |
|--------|---------|
| Module Magento mới | `Laybyland_CatalogImportWorker` — **tách** khỏi `Laybyland_Integration` (module cũ giữ nguyên). |
| Node | **TypeScript**, CLI + lib (`mysql2`, `undici`, `pino`, `zod`), **không** Nest/Express làm core. |
| Giao tiếp Node ↔ Magento | Luồng chính: **chỉ 3 bảng staging** (ingest/apply). **Ngoại lệ:** Node server tách host → `GET /rest/V1/catalog-import/s3-config` (Integration Bearer, không GraphQL). |
| S3 / feed pickup (Node) | Config qua REST (`Laybyland_CatalogImportWorker`); credentials AWS từ **env/IAM** trên Node — Magento **không** trả key/secret. Legacy Magento vẫn: `catalog-import:s3-sync` + `Laybyland_Integration` StockSystem plugin. |
| Integration Magento | Tên `catalog-import-middleware`; ACL `Laybyland_CatalogImportWorker::s3_config` (least privilege). Data patch `CreateCatalogImportMiddlewareIntegration`; token copy một lần/env — xem `features/catalog-import-worker/magento-conventions.md`. |
| Hai lane import | `job_type` `product_data` + `product_image` (`parent_job_id`); cùng `file_checksum`, UK gồm `job_type`. Node: `CATALOG_IMPORT_SPLIT_IMAGE_LANE`; Magento: `dispatch` + `dispatch-images`. |
| Magento worker | Thin executor: `json_decode` → Magmi **pass-through**, không transform payload; B7 disable set-based SQL; B8 selective cache/index **một lần cuối job**. |
| File feed tên | `<store>_products_<full\|delta>_<YYYYMMDD>_<HHMMSS>.txt` — tách `_` **đúng 5 phần** (đã có trong code: `CatalogImportProcessing::filterProductImportFiles`). |
| Store list | Một constant PHP (`StoreList::STORES`) + mirror env `STORES` trên Node — onboard store = sửa **cả hai**. |
| Reclaim | `APPLYING` theo `last_heartbeat_at`; `PARSING` theo `updated_at` + ngưỡng riêng. |
| Idempotency job/item | `file_checksum` (streaming hash); `UNIQUE (job_id, line_no)` + `INSERT … ON DUPLICATE KEY UPDATE` cho item. |
| Full disable an toàn | Gate `full_disable_min_ratio` trước anti-join B7.2 — tránh wipe catalog khi file lỗi. |
| Notification | Slack (CRITICAL/WARNING) vs Email (INFO/soft); Node gom trong **`src/infra/notification/`** — pipeline không `fetch` webhook rải rác. |
| Triển khai / toggle / cron / rollback | **Phụ lục F** trong tech design — **không** nhét sizing máy / chi phí vào tech design (ticket DevOps riêng). |
| Mở rộng cây Node | **§6.3.1** trong tech design — thêm command → thêm stage → con-folder → package. |

---

## Code legacy thường đọc trước khi implement

| Việc | Path (repo root `src/`) |
|------|-------------------------|
| Cron import cũ, thứ tự store, ví dụ tên file | `app/code/Laybyland/Integration/Console/Command/CatalogImportProcessing.php` |
| Ảnh: HEAD, backup server, download, path | `app/code/Laybyland/Integration/Process/Import/Product.php` |
| Thư mục import / processed / S3 | `app/code/Laybyland/Integration/Model/StockSystem.php` + `Plugin/Model/StockSystem.php` |
| Magmi logger reuse | `app/code/Laybyland/Integration/Model/MagmiLoggerFactory.php` (hoặc tương đương trong module) |
| Module worker + REST S3 | `app/code/Laybyland/CatalogImportWorker/` — conventions: `spec/projects/laybyland/features/catalog-import-worker/magento-conventions.md` |

---

## Khi nào cập nhật file này

- Đổi **tên file** tech design hoặc tách repo Node ra ngoài `src/`.
- Đổi **một dòng quyết định** mang tính “contract” (vd bỏ bảng staging, đổi format tên file) — cập nhật bảng **Quyết định kiến trúc** cho khớp tech design.

**Không** dán transcript chat vào đây — chỉ ghi **kết luận đã merge** vào tech design rồi mirror tóm tắt vào bảng trên.
