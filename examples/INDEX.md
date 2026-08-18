# Examples Index

> Mục đích: AI đọc file này trước để biết cần đọc file nào, tránh đọc thừa.
> Quy tắc: khi cần ví dụ, đọc INDEX này → chọn đúng file → đọc file đó. Không đọc tất cả.

---

## Cách dùng

```text
Tôi cần ví dụ về <chủ đề>.
Đọc examples/INDEX.md và chọn blueprint phù hợp nhất.
```

---

## Integration Blueprints (`examples/integration/`)

| File | Chủ đề | Dùng khi |
|---|---|---|
| `magento-module-admin-grid-employee-blueprint.md` | Admin Grid + Form + Repository | Tạo CRUD module với admin UI |
| `magento-module-base-admin-branding-blueprint.md` | Admin menu + branding base module | Tạo module base với admin menu |
| `magento-module-notes-webapi-blueprint.md` | Custom REST API + Repository + Bulk update | Tạo REST endpoint mới |
| `magento-module-store-webapi-blueprint.md` | Website/StoreGroup Web API extension | Mở rộng API store/website |
| `magento-module-address-extension-graphql-blueprint.md` | Customer Address EAV + Extension Attributes + GraphQL | Mở rộng GraphQL schema, extension attributes |
| `magento-module-insert-on-duplicate-graphql-blueprint.md` | GraphQL mutation + insertOnDuplicate DB | GraphQL mutation ghi DB hiệu quả |
| `magento-module-bulk-email-rabbitmq-blueprint.md` | Message Queue / RabbitMQ + bulk email | Xử lý bất đồng bộ, message queue |
| `magento-module-csp-whitelist-blueprint.md` | CSP Whitelist config | Thêm CSP whitelist cho external resource |
| `magento-module-custom-logger-blueprint.md` | Custom Monolog logger riêng cho module | Tạo file log riêng, tránh ghi vào system.log |
| `magento-modules-catalog.md` | Index tổng hợp các module NullTraceX | Tra cứu nhanh module nào có blueprint |
| `custom-shipping-carrier-blueprint.md` | Custom shipping carrier (AbstractCarrier) | Tạo shipping method mới với collectRates |
| `custom-payment-offline-blueprint.md` | Offline payment method (Adapter pattern) | Tạo payment method không cần gateway API |
| `transactional-email-blueprint.md` | Transactional email + TransportBuilder | Gửi email từ custom module |
| `custom-product-type-blueprint.md` | Custom product type + price model | Tạo product type mới với logic riêng |
| `extension-attributes-join-blueprint.md` | Extension attributes + join directive + plugin | Thêm extension attribute với bảng riêng |
| `custom-widget-blueprint.md` | Widget với parameters cấu hình từ Admin | Tạo CMS widget tái sử dụng |
| `integration-test-module-blueprint.md` | Integration test + PHP Attributes fixtures | Viết integration test cho custom module |
| `console-command-progress-bar-blueprint.md` | CLI command + Symfony ProgressBar | Tạo CLI command với progress bar |
| `custom-price-modifier-blueprint.md` | Catalog rule condition + final price modifier | Custom giá theo logic riêng |
| `custom-rest-api-pagination-blueprint.md` | Custom REST API + SearchCriteria + pagination | Tạo REST endpoint với filter/sort/page chuẩn |
| `graphql-mutation-input-validation-blueprint.md` | GraphQL mutation + input validation + auth check | Tạo GraphQL mutation với validation đầy đủ |

---

## Module Skeleton (`examples/integration/module-skeleton/`)

| File | Nội dung |
|---|---|
| `README.md` | Hướng dẫn dùng skeleton |
| `file-map.md` | Map đầy đủ file/folder chuẩn của 1 module |
| `templates.md` | Code template cho từng file trong module |

> Dùng skeleton khi tạo module mới từ đầu, trước khi chọn blueprint cụ thể.

---

## Quy tắc thêm ví dụ mới

Khi thêm blueprint mới vào `examples/integration/`, cập nhật bảng trên với:
- Tên file
- Chủ đề ngắn gọn (≤ 5 từ)
- Điều kiện "Dùng khi" (≤ 1 câu)
