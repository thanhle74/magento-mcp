# Spec - paysquad-webhook-log

## Input
- Feature: `PaySquad Webhook Log Admin Grid`
- Vấn đề: Webhook events từ PaySquad (succeeded/failed/cancelled) chỉ ghi vào file log — support team không thể tự kiểm tra khi có sự cố payment mà không cần SSH vào server.
- Mục tiêu: Lưu mỗi webhook event vào DB và hiển thị trong admin grid để dễ debug, filter theo event/status/order/date.
- Module/scope biết chắc: `app/code/Laybyland/PaySquad`

## Đã kiểm tra code hiện tại
- `Logger/Logger.php` + `Logger/Handler.php`: ghi vào `var/log/paysquad_debug.log` — không có DB log.
- `Model/Webhook/Processor.php`: dispatch 3 event types: `paysquad.succeeded`, `paysquad.failed`, `paysquad.cancelled`.
- `Model/Webhook/Handler/SucceededHandler.php`: có thể skip (đã invoiced), error (order not found, cannot invoice).
- `Model/Webhook/Handler/FailedHandler.php`: có thể skip (đã canceled), error (order not found).
- `Model/Webhook/Handler/CancelledHandler.php`: tương tự FailedHandler.
- `Model/Transaction.php` + `Model/ResourceModel/Transaction.php`: pattern DB đã có sẵn — bám theo.
- Bảng `laybyland_paysquad_transaction` đã tồn tại — bảng log sẽ là bảng riêng `laybyland_paysquad_webhook_log`.

## Business + scope
- In-scope:
  - Tạo bảng `laybyland_paysquad_webhook_log` lưu mỗi webhook event
  - Inject `WebhookLogRepository` vào `Processor` để ghi log sau khi xử lý
  - Admin grid tại `Laybyland > PaySquad > Webhook Logs` với filter/sort
  - Columns: ID, PaySquad ID, Event Name, Order ID, Status, Message, Created At
- Out-of-scope:
  - Không xóa/sửa log từ admin (read-only grid)
  - Không log API calls đến PaySquad API — đã có file log
  - Không tạo form edit
  - Không export CSV
  - Không tự động purge log cũ

## Acceptance criteria
- AC-01: Mỗi webhook event được xử lý bởi `Processor` đều tạo 1 bản ghi trong `laybyland_paysquad_webhook_log`
- AC-02: Bản ghi log có đủ: `pay_squad_id`, `event_name`, `order_id` (nullable), `status` (`processed`/`skipped`/`error`), `message`, `created_at`
- AC-03: Admin grid hiển thị tại menu `Laybyland > PaySquad > Webhook Logs`
- AC-04: Grid filter được theo `event_name`, `status`, `pay_squad_id`, `order_id`, `created_at` (date range)
- AC-05: Grid sort được theo tất cả columns
- AC-06: ACL bảo vệ — chỉ admin có quyền `Laybyland_PaySquad::webhook_log` mới truy cập được
- AC-07: Log được ghi kể cả khi handler throw exception (status=`error`, message=exception message)

## Decision
- Requirement understanding:
  - Webhook log là read-only audit trail — chỉ cần Index controller + grid, không cần CRUD đầy đủ
  - Log phải ghi được cả trường hợp lỗi — cần wrap handler call trong try/catch tại `Processor`
  - `order_id` nullable vì có case order not found
- Risks/assumptions:
  - `Processor` hiện tại không wrap handler call trong try/catch — cần sửa để bắt exception và ghi log error
  - Volume log có thể lớn theo thời gian — chấp nhận, purge là out-of-scope
- Approach đã chốt: Tạo `Model/WebhookLog.php` + ResourceModel + Collection theo pattern của `Transaction`. Inject `WebhookLogRepository` vào `Processor` để ghi log. Admin grid dùng UI component chuẩn Magento.
- Business rules chính:
  - 1 webhook call = 1 log entry (kể cả duplicate/skipped)
  - `status`: `processed` = handler chạy thành công, `skipped` = idempotency skip hoặc no handler, `error` = exception
- Scope được phép sửa: `app/code/Laybyland/PaySquad`

## Testcase
- Happy: TC-01 `paysquad.succeeded` xử lý thành công → log status=`processed`, order_id đúng
- Happy: TC-02 `paysquad.failed` xử lý thành công → log status=`processed`
- Happy: TC-03 `paysquad.cancelled` xử lý thành công → log status=`processed`
- Edge: TC-04 Duplicate event (idempotency skip) → log status=`skipped`, message ghi rõ lý do
- Edge: TC-05 Event không có handler → log status=`skipped`, message=`no handler registered`
- Negative: TC-06 Order not found → log status=`error`, order_id=null, message ghi lỗi
- Negative: TC-07 Handler throw exception → log status=`error`, message=exception message
- Negative: TC-08 Truy cập admin grid không có quyền → redirect 403
