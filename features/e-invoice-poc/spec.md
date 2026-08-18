# Spec - EInvoice POC (Secomm_EInvoiceLog + Core + Misa)

## Tuân thủ chuẩn chung

- `spec/config/constitution.md`
- `spec/config/checklist.md`
- `spec/config/magento-patterns.md`

## Input

- Feature: `e-invoice-poc`
- Vấn đề: Cần module Magento POC phát hành hóa đơn điện tử qua MISA cho khách demo.
- Mục tiêu: First shipment → sync MISA; log trên order + admin grid theo dõi.
- Module/scope: `app/code/Secomm/EInvoiceLog/`, `EInvoiceCore/`, `EInvoiceMisa/`
- Naming UI: **EInvoice** (không dùng label "Electronic Invoice" trên Admin).

## Business + scope

- In-scope:
  - `Secomm_EInvoiceLog` + `Secomm_EInvoiceCore` + `Secomm_EInvoiceMisa` (MISA direct POC)
  - `Secomm_EInvoiceCore` phụ thuộc `Secomm_Base` (menu tab Secomm)
  - Admin menu: **Secomm → EInvoice → Issue Logs / Configuration**
  - Admin grid + form read-only xem chi tiết log (`secomm_einvoice_issue_log`)
  - Admin config (provider, trigger, MISA credentials), order panel, nút Issue (retry thủ công)
  - Sync ngay khi first shipment (không cron/queue)
  - Log bảng `secomm_einvoice_issue_log` + file log
- Out-of-scope:
  - Module provider **Viettel** (chỉ mở rộng qua pool; implement phase sau)
  - SAP middleware, cron, CLI, MISA webhook/callback
  - Mock/fake provider module (đề xuất cho demo khi chưa có key — chưa implement)
  - meInvoice API riêng (POC dùng MISA CRM SaleOrders)
  - Shopify app

## Acceptance criteria

- AC-01: Admin bật module, cấu hình MISA (`client_id`, `client_secret`, `app_id`), trigger First Shipment + auto issue.
- AC-02: Admin mở order → thấy panel EInvoice + log + nút Issue khi chưa success.
- AC-03: First shipment → gọi MISA sync và ghi log.
- AC-04: Ship lần 2 / đã success → không gọi lại provider.
- AC-05: API fail → log `failed`; Admin Issue để thử lại.
- AC-06: First shipment = shipment đầu tiên của order (`shipment_count = 1`), không phải lần save event đầu tiên.
- AC-07: Rule first shipment áp cho flow hàng hóa (physical); virtual/service ngoài phạm vi POC.
- AC-08: Admin mở **Secomm → EInvoice → Issue Logs** → grid filter/sort; **View** xem payload request/response.

## Decision

- Approach: `EInvoiceLog` (DB + file log + admin grid); `EInvoiceCore` (orchestration + Magento glue); `EInvoiceMisa` (MISA provider).
- POC API: MISA CRM Open API v2 `POST /Account`, `POST /SaleOrders`.
- MISA **API base URL cố định trong code** (`MisaConfig::API_BASE_URL`) — không config Admin.
- MISA Admin config: `client_id`, `client_secret`, `app_id` (encrypted where applicable); group `misa` hiện khi `general/provider = misa`.
- Provider extensibility: `InvoiceIssuerPool` + `IssueRequestBuilderPool` + `di.xml` per provider module (vd. Viettel = module mới, không sửa Core).
- Idempotency: order đã có log `success` → không gọi lại provider ở shipment sau.
- Retry: không cron/queue; retry thủ công qua nút Admin Issue.
- ACL menu: parent `Secomm_EInvoiceCore::einvoice`; config resource `Secomm_EInvoiceCore::config` chỉ khai báo một lần (dưới `Magento_Config::config`).

## Testcase

- Happy: TC-01 ship lần đầu → success log + MISA (**cần credential MISA thật**).
- Edge: TC-02 fail → failed log, Admin Issue retry (test được không key — expect fail có message).
- Negative: TC-03 disabled / ship lần 2 → không gọi MISA.
- Admin: TC-04 grid Issue Logs hiển thị mọi attempt; form View read-only payload.
- Automated (không key): unit test Core/Misa mapper + orchestration (`phpunit` scope `EInvoiceCore`, `EInvoiceMisa`).
