# Spec - catalog-import-worker

## Tuân thủ chuẩn chung

- `config/constitution.md`, `config/checklist.md`, `config/magento-patterns.md`
- **Conventions riêng module:** [`magento-conventions.md`](./magento-conventions.md) (layout, REST S3, integration patch, JobClaimer, PHPCS gate)

## Input
- Feature: `catalog-import-worker`
- Vấn đề: Node middleware đã stage job/item nhưng Magento chưa có worker apply Magmi (B6–B9).
- Mục tiêu: Module `Laybyland_CatalogImportWorker` — thin executor đọc staging DB, apply catalog, không transform payload.
- Module/scope biết chắc: `app/code/Laybyland/CatalogImportWorker/` (mới), reuse `Laybyland_Integration` (StockSystem, MagmiLogger).

## Đã kiểm tra code hiện tại
- Node repo `/home/thanhle/Sites/Node/middleware` — B1–B5 chạy OK, job #7 `STAGED` (9 items).
- 3 bảng staging đã tồn tại (tạo qua `sql/schema.sql` Node).
- Legacy import: `CatalogImportProcessing.php` + `Process/Import/Product.php` — giữ làm rollback, không sửa.
- Tech design: `integration_import_tech_design_202605130620485055896.md` — đổi tên module từ `IntegrationImport` → `CatalogImportWorker`.

## Business + scope
- In-scope (phase 1 — skeleton + B6 smoke):
  - Module skeleton: registration, `db_schema.xml`, DI, ACL, system config toggle.
  - Console: `catalog-import:dispatch`, `catalog-import:apply --job=`, `catalog-import:reclaim`, `catalog-import:s3-sync`.
  - Service contracts: JobClaimer, ItemReader, MagmiAdapter, SnapshotWriter, JobProcessor.
  - B6: pass-through Magmi ingest batch + ghi snapshot.
  - B7 delta: disable SKU `DISABLE_REQUIRED` (SQL set-based).
  - B8/B9: stub có log (cache/index, archive) — phase 2.
- Out-of-scope (phase 1):
  - Sửa `Laybyland_Integration` legacy cron/command.
  - Full disable B7.2 + safeguard ratio.
  - Cron XML (phase 2 sau smoke test).
  - Notification Slack/email.
- In-scope (đã làm sau phase 1 — xem `magento-conventions.md`):
  - REST `GET /V1/catalog-import/s3-config` + integration `catalog-import-middleware`.
  - Hai lane `job_type` / `dispatch-images`.
  - PHPCS 0/0 + unit tests module.

## Acceptance criteria
- AC-01: `bin/magento module:enable Laybyland_CatalogImportWorker` + `setup:upgrade` không lỗi trên Docker.
- AC-02: `bin/magento catalog-import:apply --job=7` apply UPSERT qua Magmi khi toggle bật.
- AC-03: Snapshot ghi `integration_product_snapshot` sau item apply thành công.
- AC-04: Item `DISABLE_REQUIRED` disable product sau B7 delta.
- AC-05: Toggle `catalog_import_worker/general/enabled = 0` → dispatch/apply no-op.
- AC-06: Unit test pass cho Config + StoreList (+ JobClaimer logic cơ bản).

## Decision
- Requirement understanding:
  - PHP worker chỉ đọc `payload_json` đã có — không normalize lại.
  - Giao tiếp Node ↔ Magento chỉ qua 3 bảng staging.
  - Module tách khỏi `Laybyland_Integration` để rollout an toàn.
- Risks/assumptions:
  - Bảng staging đã tồn tại — `db_schema.xml` reconcile, không rename bảng.
  - Magmi profile mặc định `laybyland` (giống legacy).
  - Docker container: `layup-phpfpm-1`.
- Approach đã chốt: Module mới `Laybyland_CatalogImportWorker`, skeleton + B6/B7 delta MVP, B8/B9 stub.
- Business rules chính:
  - `UPSERT_REQUIRED` → Magmi pass-through.
  - `SKIP_NO_CHANGE` → mark APPLIED, không Magmi.
  - `DISABLE_REQUIRED` → B7 SQL disable.
- Scope được phép sửa:
  - `app/code/Laybyland/CatalogImportWorker/**`
  - `spec/projects/laybyland/features/catalog-import-worker/**`
  - `spec/projects/laybyland/integration-import-middleware.md` (cập nhật tên module)

## Testcase
- Happy: TC-01 `catalog-import:apply --job=7` → job `COMPLETED`, snapshot có 7 SKU.
- Happy: TC-02 `catalog-import:dispatch` claim job STAGED khi toggle ON.
- Edge: TC-03 apply khi toggle OFF → exit 0, không đổi DB.
- Negative: TC-04 apply job không tồn tại → CLI error message rõ.
