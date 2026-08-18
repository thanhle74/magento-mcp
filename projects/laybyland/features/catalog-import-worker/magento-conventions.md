# CatalogImportWorker — Magento conventions (agent)

> Bổ sung cho `spec.md`. Chuẩn chung: `config/constitution.md`, `config/checklist.md`.

## Module layout (đã implement — phase 2+)

```
app/code/Laybyland/CatalogImportWorker/
├── Api/                          # @api @since; FQCN trong @param/@return
├── Api/Data/                     # S3ImportConfigInterface, JobInterface, …
├── Console/Command/
├── Model/
│   ├── Config.php                # Module-wide ScopeConfig (apply/reclaim)
│   ├── Config/                   # BonarFeed, S3Import, Notification, …
│   ├── Data/                     # DTO; getter/setter → @inheritdoc
│   ├── Service/                  # JobClaimer, JobProcessor, S3ImportConfigProvider, …
│   ├── Webapi/                   # REST facade mỏng (vd. S3ImportConfig)
│   └── S3/                       # MountedFolderParser (pure helper)
├── Setup/Patch/Data/             # Integration patch (logic trong patch class)
└── Test/Unit/
```

**Không** đặt logic REST trong `Model/*Management.php` ở root `Model/`. **Không** đọc `ScopeConfig` trực tiếp trong Webapi facade.

## Staging DB (`JobClaimer`)

- Claim: `SELECT id … LIMIT 1` rồi `UPDATE … WHERE status = STAGED` (optimistic).
- Timestamp cột: `new \Magento\Framework\DB\Sql\Expression('NOW()')` / `COALESCE(started_at, NOW())`.
- Tránh raw SQL string nếu PHPCS/sniff bắt; ưu tiên `select()` + `update()` + bound params.

## REST — S3 config (Node server tách Magento)

| | |
|--|--|
| Route | `GET /rest/V1/catalog-import/s3-config?storeCode=` |
| Auth | Integration Bearer `catalog-import-middleware` |
| ACL | `Laybyland_CatalogImportWorker::s3_config` (**không** All) |
| Response | `store_id`, `store_code`, `use_s3`, `s3_enabled`, `bucket`, `region`, `bucket_path_prefix`, `import_prefix` |
| Không trả | `key`, `secret` — Node dùng env/IAM |
| Config nguồn | `lblintegration_options/s3/*` (store) + `secommconfig/s3bucket/*` (global) |

Implementation: `Model\Config\S3Import` → `Model\Service\S3ImportConfigProvider` → `Model\Webapi\S3ImportConfig`.

## Integration data patch

| | |
|--|--|
| Patch | `Setup/Patch/Data/CreateCatalogImportMiddlewareIntegration.php` (logic + constants trong patch) |
| Token | Patch gọi `createAccessToken()` nếu chưa có; **không** log token; copy Admin hoặc DB → `MAGENTO_INTEGRATION_TOKEN` |

Callback/Identity URL = placeholder — **không** dùng với Bearer manual integration.

## Two-lane jobs (product + image)

- `job_type`: `product_data` \| `product_image`; `parent_job_id` cho image lane.
- UK idempotency: `(store_code, file_checksum, job_type)`.
- CLI: `catalog-import:dispatch` + `catalog-import:dispatch-images`.
- Image job: không archive/reconcile như product (xem `JobProcessor`).

## Review gate (module này)

```bash
docker exec layup-phpfpm-1 vendor/bin/phpcs --standard=Magento2 \
  app/code/Laybyland/CatalogImportWorker
# 0 errors, 0 warnings

docker exec layup-phpfpm-1 vendor/bin/phpunit --no-configuration \
  app/code/Laybyland/CatalogImportWorker/Test/Unit
```

Sau đổi DI: `bin/magento setup:di:compile`.

## Luồng chính vẫn không HTTP

Node ↔ Magento **staging 3 bảng** cho ingest/apply. HTTP chỉ cho **S3 config** khi Node chạy server riêng (pickup S3).
