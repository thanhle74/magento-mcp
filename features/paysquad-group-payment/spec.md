# Spec - paysquad-group-payment

## Input
- Feature: `PaySquad Group Payment`
- Vấn đề: Khách hàng muốn thanh toán đơn hàng theo nhóm — nhiều người cùng góp tiền cho một đơn
- Mục tiêu: Tích hợp PaySquad vào Magento 2 như một payment method async, order fulfil sau khi nhận webhook `paysquad.succeeded`
- Module/scope biết chắc: `app/code/Secomm/PaySquad` (module `Secomm_PaySquad`)

## Business + scope
- In-scope:
  - Hiển thị PaySquad tại checkout
  - Tạo PaySquad session qua API, redirect customer đến hosted flow
  - Nhận và xử lý webhook (`succeeded`, `failed`, `cancelled`)
  - Tạo Invoice duy nhất khi đủ 100% đóng góp
  - Refund toàn bộ qua Credit Memo
  - Giao diện My Account: progress bar, contributor list, share link
  - Giao diện Admin Order: danh sách contributions
  - Logging tập trung tại `var/log/paysquad_debug.log`
- Out-of-scope:
  - Partial refund (PaySquad chưa hỗ trợ)
  - Reconcile nightly job (có thể làm sau)
  - Webhook refund-completed (PaySquad chưa có)
  - Multi-currency conversion (dùng currency của order)

## Acceptance criteria

**AC-01 — Cấu hình Admin:**
- Admin config có: Merchant_ID, API_Secret_Key, Webhook_Secret, mode (Sandbox/Live)
- API_Secret_Key và Webhook_Secret được encrypt at rest
- Sandbox → base URL `https://api.sandbox.paysquad.co`; Live → `https://api.paysquad.co`
- Dùng sai environment key → 401, không crash silently

**AC-02 — Database:**
- Thêm `paysquad_id` (VARCHAR 255) và `contribution_link` (TEXT) vào `sales_order_payment`
- Tạo bảng contributions (implementation: `secomm_paysquad_transaction`): `transaction_id` PK, `order_id`, `contributor_name`, `amount` (INT minor units), `txn_id`, `status`, `created_at`
- Bổ sung có thể có `secomm_paysquad_webhook_log` cho idempotency webhook (`pay_squad_id` + `event_name`)

**AC-03 — Checkout:**
- PaySquad hiển thị trong danh sách payment methods khi module enabled
- Ẩn khi module disabled

**AC-04 — Place Order:**
- Tạo order với status `pending_payment`
- Gọi `POST /api/merchant/paysquad` với Basic Auth `base64(MerchantId:ApiSecretKey)`, payload gồm `items[]`, `currency`, `total` (minor units), `meta` (order increment ID), `successRedirectUrl`, `cancelRedirectUrl`
- `total` phải ≥ minimum contribution của currency trước khi gọi API
- Lưu `paySquadId` + `contributionLink` (từ response, không tự construct) vào `sales_order_payment`
- Redirect customer đến `contributionLink`
- Lỗi 4xx/5xx → cancel order, log, hiển thị lỗi thân thiện

**AC-05 — Webhook:**
- Endpoint `/paysquad/webhook/receive`
- Validate signature: `base64_decode(Webhook_Secret)` → HMAC key → `base64_encode(hash_hmac('sha256', rawBody, key, true))` so sánh với header `X-Paysquad-Signature` (constant-time)
- Sai signature → HTTP 401, log
- Trả HTTP 200 sau khi xử lý (implementation: xử lý **đồng bộ** trong request qua `Processor`, không Message Queue — khác wording “async” nếu hiểu theo MQ/thread riêng)
- Idempotency key: `paySquadId` + `eventName`
- `paysquad.succeeded` → GET details → lưu contributions → tạo 1 Invoice → order `processing`
- `paysquad.failed` / `paysquad.cancelled` → GET details → log `reason`/`subReason` → cancel order + restock
- Duplicate webhook cho order đã invoice → HTTP 200, không tạo invoice thêm

**AC-06 — Refund:**
- Admin tạo Credit Memo → gọi `POST /api/merchant/paysquad/refund` với `{ paySquadId, description, reference }`
- Chỉ refund được khi PaySquad status = `Complete`; chỉ full refund
- Response 202 → notify Admin refund đang queue
- Lỗi 400/404 → throw Magento payment exception, log

**AC-07 — My Account (Order Detail):**
- Progress bar: % tổng amount đã đóng góp, cập nhật real-time qua polling (không cần reload)
- Contributor list: name + amount (formatted từ minor units), cập nhật cùng lúc với progress
- "Copy Link" button: copy `contribution_link` vào clipboard
- Khi order `pending_payment`: progress bar + share link active; JS polling chạy mỗi 5s
- Khi order `processing`: progress bar 100%, ẩn share link, dừng polling
- Polling endpoint `GET /paysquad/order/progress?order_id=X` — yêu cầu customer đã login và là owner của order
- Polling dừng khi: order không còn `pending_payment`, tab bị ẩn (`visibilitychange`), hoặc component bị unmount

**AC-08 — Admin Order Detail:**
- Section "PaySquad Contributions": Contributor Name, Amount, Transaction ID (stripePaymentId), Status, Created At
- Chưa có contribution → hiển thị "No contributions recorded yet."

**AC-09 — API Client:**
- Basic Auth mọi request
- 401 → log + throw config exception
- 400 → log full error body (field-level errors) + throw validation exception
- 429 → retry exponential backoff
- 5xx → retry exponential backoff → throw gateway exception
- Log mọi request/response vào `var/log/paysquad_debug.log`

**AC-10 — Logging:**
- Mọi log PaySquad → `var/log/paysquad_debug.log`
- Không ghi vào `system.log` hay `exception.log`

## Decision
- Requirement understanding:
  - PaySquad là async payment: order fulfil qua webhook, không phải tại checkout
  - Amount luôn dùng minor units (integer) — cần convert từ Magento decimal
  - Webhook Secret phải base64-decode trước khi dùng làm HMAC key — khác với cách thông thường
  - `paymentCompleteWebhook` phải truyền trong mỗi Create request — PaySquad không tự biết URL
  - PaySquad **không có REST API cancel** từ merchant — cancel chỉ qua Merchant Portal UI hoặc Squad Leader cancel trong hosted flow. Khi admin cancel order trong Magento, PaySquad session vẫn còn active cho đến khi expire hoặc merchant vào Portal cancel thủ công
  - PaySquad sandbox không gửi webhook đáng tin cậy — cron sync là fallback bắt buộc, không phải optional
- Risks/assumptions:
  - Webhook có thể đến trước order được lưu xong → cần idempotency + retry-safe handler
  - Refund async (202) → không có webhook confirm — Admin cần biết refund chưa hoàn tất ngay
  - `AsyncOrder` module wrap `PaymentInformationManagementInterface` → after-plugin không được gọi
  - PaySquad không có webhook intermediate cho từng contribution → dùng polling từ frontend để hiển thị progress real-time
  - `Magento\Sales\Model\Order\Payment\State\OrderCommand` hardcode `STATE_PROCESSING` bất kể `payment_action` → cần observer để override
  - `payment_action = order` yêu cầu `can_order = 1` trong config — thiếu flag này `executeCommand('order')` bị skip hoàn toàn, API không được gọi, `contributionLink` không được lưu vào session
  - `Magento\Framework\View\Element\Template` không có `getOrder()` → phải dùng `Magento\Sales\Block\Order\Info` cho My Account block
  - Container `order_info_block` không tồn tại trong Magento core `sales_order_view.xml` → dùng `referenceContainer name="content"`
  - Static content deploy phải đúng theme active (`Laybyland/layup`), không phải `Magento/luma`
  - `getClass()` trong `AbstractBlock` trả về CSS class của block, không phải tab class — không override để trả về tab class
  - Cron/CLI chạy ngoài HTTP context không có area code → `InvoiceCreator` crash với "Area code is not set" → phải wrap bằng `$appState->emulateAreaCode(Area::AREA_ADMINHTML, fn() => ...)` trong `PendingOrdersSync`
  - `InvoiceCreator` phải set `transactionId = paySquadId` trên payment VÀ tạo capture transaction record trong `sales_payment_transaction` VÀ add transaction object vào `$dbTransaction->addObject()` để persist — thiếu bất kỳ bước nào thì Magento `canRefund()` trả false → Credit Memo không trigger gateway refund command
  - `Client::call()` ban đầu trả về decoded JSON body trực tiếp → `RefundValidator` đọc `$response['http_status']` nhận `null` → default 0 → báo fail dù API đã thành công. Fix: `Client::call()` trả về `['http_status' => int, 'body' => array]`; `GatewayClient::placeRequest()` merge thành `array_merge($result['body'], ['http_status' => $result['http_status']])`; tất cả callers của `Client::call()` phải đọc từ `$result['body']` thay vì `$result` trực tiếp
  - `RefundBuilder` không được dùng `$paymentDO->getOrder()` từ `SubjectReader` — Braintree's `OrderAdapter` inject vào cho tất cả payment methods, `getGrandTotalAmount()` trả `string` thay vì `?float` → PHP 8 TypeError. Phải dùng `$payment->getOrder()->getGrandTotal()` (native `Order` model)
  - Credit Memo phải được tạo từ **invoice page** (Admin → Order → Invoice → Credit Memo), không phải từ order page — nếu `invoice_id = null` thì Magento không gọi gateway refund command, chỉ refund offline
  - Khi thêm constructor argument mới vào class đã có generated code, Magento dùng bản cũ trong `generated/metadata/` → crash "Too few arguments" → phải xóa `generated/code/` và `generated/metadata/` sau mỗi lần thêm dependency
  - `type="image"` field trong `system.xml` với `config_path` custom → `RequestData` không map được file upload từ `$_FILES` → **không dùng `config_path`** cho image field, để Magento tự build path từ `section/group/field`
  - `scope_info="1"` trong `upload_dir` của image field → Magento append scope prefix vào path → `getLogoFile()` build sai URL → **không dùng `scope_info`** cho image upload đơn giản
  - `StoreManagerInterface` không nên inject vào `Gateway/Config/Config.php` (Gateway layer) — inject vào `ConfigProvider` thay thế để build media URL
  - `ContributionPersister` idempotency check: nếu record đã tồn tại theo `txn_id` thì skip hoàn toàn → **bug**: contribution status không được update khi PaySquad thay đổi từ `Uncaptured` → `Complete` → fix: nếu record tồn tại và status khác thì update status
  - `PendingOrdersSync` filter `$order->getState() === Order::STATE_PENDING_PAYMENT` — `awaiting_group_payment` vẫn có state `pending_payment` nên vẫn được sync, không bị bỏ sót
  - Template `details_snapshot.phtml` của `Laybyland_Layby` render cho tất cả orders kể cả PaySquad → crash "Trying to access array offset on null" khi `$laybyPaymentPlan` là null → phải guard `if ($laybyOrder && $laybyPaymentPlan)` trước khi render layby-specific content
- Approach đã chốt:
  - Module `Secomm/PaySquad` (`Secomm_PaySquad`), không sửa core Magento
  - **Method code: `paysquad`** (không phải `laybyland_paysquad`) để tránh conflict với layby prefix filter
  - Webhook xử lý synchronous (không cần MQ) — handler chạy < 10s
  - `CreateHandler` set session data trực tiếp thay vì dùng after-plugin (vì AsyncOrder)
  - `payment_action = order` + `can_order = 1` — bắt buộc phải có `<can_order>1</can_order>` trong `config.xml`, thiếu flag này `canPerformCommand('order')` trả false → API không được gọi
  - `Magento\Sales\Model\Order\Payment\State\OrderCommand` hardcode `STATE_PROCESSING` → observer `SetOrderPendingPayment` trên event `sales_order_place_after` force lại `state=pending_payment`, `status=pending_payment` (không phải `awaiting_group_payment` — status đó chỉ set khi có contribution thực tế)
  - **Order status flow**: `pending_payment` (mới tạo, chưa có contribution) → `awaiting_group_payment` (có ít nhất 1 contribution) → `processing` (invoice tạo, 100% paid). Logic set `awaiting_group_payment` phải có ở cả 3 chỗ: `SucceededHandler`, `PendingOrdersSync::syncOrder()`, và cron
  - Order status mới `awaiting_group_payment` = "Awaiting Group Payment" tạo qua Data Patch, map vào state `pending_payment`, `is_default=1`, `visible_on_front=1`
  - `SucceededHandler` dùng `StatusResolver::getOrderStatusByState()` để resolve status khi tạo Invoice, không hardcode `'processing'`
  - My Account block dùng `Magento\Sales\Block\Order\Info` (tự load order từ registry qua `getOrder()`), inject vào `referenceContainer name="content"` sau `sales.order.view`; **không dùng** `Magento\Framework\View\Element\Template` vì không có `getOrder()`; **không dùng** `referenceContainer name="order_info_block"` vì container đó không tồn tại trong Magento core
  - Template dùng `$block->getOrder()` (không phải `$block->getData('order')`)
  - `isPaysquadOrder()` và `getContributionLink()` fallback sang `additional_information` nếu DB column null
  - CSS dùng LESS file `view/frontend/web/css/source/_module.less` + `_group-payment.less`; deploy phải đúng theme đang active (`Laybyland/layup`), không phải `Magento/luma`
  - Shared services: `OrderLookupService`, `ContributionPersister`, `InvoiceCreator` tránh duplicate logic giữa handlers và sync service
  - `FailedHandler` + `CancelledHandler` extend `AbstractCancellationHandler` để tránh duplicate `cancelOrderAndRestock()`
  - Redirect plugins dùng `StoreContributionLinkTrait` để tránh duplicate giữa logged-in và guest checkout
  - Cron hourly `paysquad:sync` + CLI command `bin/magento paysquad:sync` dùng chung `PendingOrdersSync` service; cron là fallback quan trọng vì sandbox webhook không reliable
  - `PendingOrdersSync` phải dùng `$appState->emulateAreaCode(Area::AREA_ADMINHTML, ...)` để tránh "Area code is not set" khi tạo invoice trong CLI/cron context
  - Checkout payment template: logo upload qua Admin config (`type="image"`, không dùng `config_path`, không dùng `scope_info`); logo URL build trong `ConfigProvider` (không phải `Gateway/Config/Config.php`); JS renderer expose `getLogoUrl()` đọc từ `checkoutConfig`; template dùng KO `if` guard để ẩn khi không có logo
  - Checkout payment template: description configurable qua Admin textarea, expose qua `ConfigProvider` → `getDescription()` trong JS → `html` binding trong template
  - Admin config image upload: sau khi thay đổi `system.xml`, phải xóa `generated/metadata/` (không chỉ `generated/code/`) để Magento pick up constructor changes mới
  - Progress real-time: JS polling `GET /paysquad/order/progress` mỗi 5s khi order `pending_payment`; dừng khi order không còn pending hoặc tab ẩn
  - Cancel từ Magento → PaySquad: **không thể** vì PaySquad không có REST API cancel. Chỉ cancel được từ Merchant Portal. Khi admin cancel order trong Magento, nên thêm order comment nhắc admin vào Portal cancel thủ công
- Business rules chính:
  - Chỉ tạo 1 Invoice duy nhất khi đủ 100%
  - Chỉ full refund, chỉ khi PaySquad status = `Complete`
  - Contributions luôn được lưu kể cả khi order đã có Invoice (idempotency tách riêng)
  - Contribution status phải được update khi thay đổi (Uncaptured → Complete) — không chỉ skip nếu record đã tồn tại
  - Progress bar trong My Account cập nhật real-time qua polling PaySquad API — không cần reload trang
  - Order status `awaiting_group_payment` chỉ set khi có contribution thực tế, không set ngay lúc place order
- Scope được phép sửa: `app/code/Secomm/PaySquad/` (toàn bộ module) + theme `Laybyland/layup` khi cần (ví dụ override `Secomm_PaySquad` LESS)

## Testcase
- Happy:
  - TC-01: Customer place order → API trả 201 → redirect đến contributionLink
  - TC-02: Webhook `paysquad.succeeded` hợp lệ → GET details → lưu contributions → tạo Invoice → order `processing`
  - TC-03: Admin tạo Credit Memo → API trả 202 → notify Admin
  - TC-04: Customer xem My Account → thấy progress bar 75%, contributor list, copy link
  - TC-13: Order `pending_payment` → JS polling mỗi 5s → contributor mới đóng góp → progress bar + list cập nhật không reload
  - TC-14: Order chuyển sang `processing` → polling dừng, progress = 100%, share link ẩn
  - TC-17: Cron sync chạy → order `Complete` ở PaySquad → invoice tạo thành công (không cần webhook)
  - TC-18: Contribution status `Uncaptured` → cron sync lại → status update thành `Complete`
- Edge:
  - TC-05: Webhook `paysquad.succeeded` gửi lại lần 2 → không tạo Invoice thứ 2
  - TC-06: `total` order nhỏ hơn minimum contribution → không gọi API, hiển thị lỗi
  - TC-07: Webhook `paysquad.failed` với reason `Expired` → cancel order + restock
  - TC-08: Webhook `paysquad.cancelled` với subReason `RequestedByCustomer` → cancel order + restock
  - TC-15: Customer ẩn tab → polling dừng; mở lại tab → polling tiếp tục
  - TC-16: Polling endpoint được gọi bởi user không phải owner → 403
  - TC-19: Customer place order → back về mà không contribute → order giữ `pending_payment`, PaySquad session vẫn active cho đến khi expire
  - TC-20: Admin cancel order trong Magento → order canceled trong Magento, PaySquad session vẫn còn (không có API cancel) → admin phải vào Merchant Portal cancel thủ công
  - TC-21: Order `awaiting_group_payment` → cron sync → contributions update, status giữ nguyên nếu chưa Complete
  - TC-22: Non-PaySquad order xem My Account (details_snapshot) → không crash, layby block không render
- Negative:
  - TC-09: Webhook signature sai → HTTP 401, không xử lý
  - TC-10: API trả 401 khi place order → cancel order, log, hiển thị lỗi
  - TC-11: Refund khi PaySquad status ≠ `Complete` → API trả 400 → throw exception, log
  - TC-12: Dùng sandbox key với production URL → 401, log rõ nguyên nhân
  - TC-23: Cron/CLI chạy không có area code → không crash (emulateAreaCode đã handle)
  - TC-24: Upload logo với `config_path` custom → value không lưu vào DB → fix: bỏ `config_path` khỏi image field
