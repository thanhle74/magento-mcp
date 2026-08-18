# NullTraceX Modules Catalog (`app/code`)

Tổng module phát hiện: **8**

Mục tiêu: index nhanh để AI biết có blueprint nào cho từng module khi chỉ mang thư mục `.spec`.

---

## Danh sách module + blueprint

| Module | Loại module | Blueprint |
|---|---|---|
| `NullTraceX_Employee` | Admin grid CRUD + repository + webapi | `magento-module-admin-grid-employee-blueprint.md` |
| `NullTraceX_Address` | Customer address EAV + extension attributes + GraphQL | `magento-module-address-extension-graphql-blueprint.md` |
| `NullTraceX_Base` | Admin base menu + branding assets | `magento-module-base-admin-branding-blueprint.md` |
| `NullTraceX_BulkEmail` | Message queue (publisher/consumer) | `magento-module-bulk-email-rabbitmq-blueprint.md` |
| `NullTraceX_CspWhitelist` | CSP policy whitelist | `magento-module-csp-whitelist-blueprint.md` |
| `NullTraceX_InsertOnDuplicate` | GraphQL trigger + DB insertOnDuplicate service | `magento-module-insert-on-duplicate-graphql-blueprint.md` |
| `NullTraceX_Notes` | Web API notes service + custom repository + db schema | `magento-module-notes-webapi-blueprint.md` |
| `NullTraceX_Store` | Website/Store Group Web API extension | `magento-module-store-webapi-blueprint.md` |

---

## Cách dùng khi generate module mới

1. Chọn blueprint gần nhất với use case.
2. Yêu cầu AI clone pattern theo `<Vendor>/<Module>` mới.
3. Giới hạn scope sửa file rõ ràng.
4. Chạy verify steps trong blueprint đã chọn.
