# Notification & Transactional Email — Kiến trúc channel-ownership

> Từ khóa tra cứu: notification architecture, transactional email, dispatch event DTO, registry fan-out, secomm_notification config, event mapping enabled template, ScopePool bootstrap config, setAreaCode global, email_sent flag, OrderSender idempotent, payment-first order email, canSendNewEmailFlag, mailpit staging SMTP, idempotency_key, outbox, claim_token, atomic claim, MailException, retry classification, email_templates.xml area XSD, sender ownership, ContractShapeTest

Kiến trúc đã chốt sau 12 vòng review cho hệ notification (email/sms/push) — producer cực mỏng, channel tự sở hữu hành vi.

---

## 1. Kiến trúc channel-ownership

Ba tầng, ranh giới trách nhiệm cứng:

```
Business module (order, customer, flash-sale, ...)
  └─ chỉ PUBLISH: dispatch event + typed DTO + context
Notification core (registry fan-out, generic — không biết business)
  └─ đọc per-event config → chọn channel
Channel module (email / sms / push)
  └─ owns TOÀN BỘ channel behavior: template, transport, retry, locale
```

Nguyên tắc:

- **Business module chỉ PUBLISH** — dispatch event kèm typed DTO (order, customer, context). Không import, không gọi trực tiếp email/mailer.
- **Notification core là registry fan-out generic** — chỉ làm việc: nhận event → tra config event → fan-out tới channel đã đăng ký. Không có logic business nào lọt vào.
- **KHÔNG routing config** — routing = registry. Không table/bảng ánh xạ "event X → channel Y → template Z" ngoài registry + per-event config; thêm kênh nghĩa là đăng ký channel mới, không phải sửa routing của producer.
- **Producer cực mỏng** — một dispatch + một DTO. Nếu producer cần biết "email đã gửi chưa" thì thiết kế đã sai (xem mục 4 về cờ `email_sent` ở consumer).

### Ranh giới typed — cấm array ở mọi public/domain/channel boundary

Hợp đồng publish chốt sau review — mọi method public/domain/channel chỉ nhận/trả typed interface:

```php
publish(
    BusinessEventInterface $event,
    NotificationDataInterface $data,      // toJson(): string — không array
    NotificationContextInterface $context // getStoreId(): int
): PublishResultInterface;
```

- **Cấm free-form array** ở param lẫn return — enforce bằng `ContractShapeTest`: reflection quét mọi declared method của contract, chặn cả array param lẫn array return. Lưu ý `Throwable::getTrace(): array` — chỉ check method **khai báo tại chính type đó**, không check method kế thừa từ core.
- **Magento models KHÔNG vượt notification boundary** — factory convert sang scalar snapshot trước khi dispatch (model thay đổi trạng thái sau dispatch không được chảy vào email).

---

## 1a. Outbox pattern — idempotency theo `idempotency_key`

---

## 2. Per-event config

Mỗi event có config riêng, không map tập trung:

```
secomm_notification/email/event_<event_name>/enabled
secomm_notification/email/event_<event_name>/template
```

- Event **không được mapped → silently skip** — đây là **đúng thiết kế**, không log lỗi, không exception. Event publish trước khi channel/config cho event đó tồn tại là trạng thái hợp lệ (forward-compatible).
- Chỉ khi mapped và `enabled=1` mới fan-out; template thay đổi không đụng code producer.

> Khi debug "sao email không đi": kiểm tra theo đúng thứ tự — (1) event có được dispatch không, (2) path config `event_<event_name>` có tồn tại + enabled không, (3) channel transport có gửi được không. Phần lớn case là (2) — và skip im lặng là behavior mong muốn chứ không phải bug.

Khai báo field qua `system.xml` để admin bật/tắt từng event theo scope:

```xml
<group id="email" translate="label" type="text" sortOrder="10"
       showInDefault="1" showInWebsite="1" showInStore="1">
    <field id="event_order_created_enabled" type="select" sortOrder="10"
           showInDefault="1" showInWebsite="1" showInStore="1">
        <label>Order Created — Enabled</label>
        <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
    </field>
    <field id="event_order_created_template" type="select" sortOrder="20"
           showInDefault="1" showInWebsite="1" showInStore="1">
        <label>Order Created — Template</label>
        <source_model>Magento\Email\Model\Adminhtml\EmailTemplate</source_model>
    </field>
</group>
```

Producer phía business module mỏng tuyệt đối — DTO + dispatch, không biết email tồn tại:

```php
$this->eventManager->dispatch('secomm_order_created_notification', [
    'payload' => $this->dtoFactory->create([          // typed DTO
        'order'   => $order,
        'context' => ['source' => 'payment_callback'],
    ]),
]);
```

---

## 3. Gotchas smoke-test E2E (tốn ~1 ngày debug rút ra)

Bốn bẫy khi viết smoke-test end-to-end cho notification:

**(a) ScopePool đọc scope config lúc BOOTSTRAP.** Scope config được cache trong process khi bootstrap — **INSERT config bằng SQL trong CÙNG process test là VÔ HÌNH** với phần code đã bootstrap. Hệ quả: test đổi config qua SQL rồi dispatch event ngay → event chạy với config CŨ. Fix bắt buộc: **mỗi phase test = process mới** (tách chạy CLI riêng, hoặc restart process), và **purge `var/cache` trong container** giữa các phase.

**(b) Mọi event dispatch + email send cần area code.** Không có area code (`\Magento\Framework\App\State::setAreaCode('global')` hoặc area tương ứng — `frontend`, `adminhtml`), các path translate/template loading chết hoặc **lỗi bị swallow im lặng** — không exception, không log, email chỉ không đi. Trong script CLI/cron test, set area trước mọi dispatch.

**(c) `config.xml` DEFAULT thắng việc DELETE DB row.** Config có giá trị trong `etc/config.xml` (DEFAULT) thì xóa row `core_config_data` **không** đưa về "chưa cấu hình" — giá trị DEFAULT vẫn áp. Muốn override về trạng thái "unmapped" (để test silently skip) phải tạo **override row RỖNG ở scope `stores`** (giá trị `''`, scope_id store cụ thể), không phải xóa row. Xem thêm ngữ nghĩa null vs `''`: [../core/debugging-troubleshooting.md](../core/debugging-troubleshooting.md).

**(d) Email fail KHÔNG được rollback business transaction.** Order đã commit không được rollback vì SMTP chết — notification là side-effect có thể retry, business transaction là nguồn chân lý. Trong test cũng vậy: assert order tồn tại ngay cả khi mock transport throw.

---

## 4. Gửi email order trong payment-first flow

Flow payment-first (IPN/Return về trước, order được tạo trong callback): Magento core có sẵn observer (`SubmitObserver`) gửi email "order confirmed" **ngay khi order place** — trước khi payment thực sự xác nhận. Chặn nó và tự gửi sau commit:

```php
// Khi tạo order trong payment callback:
$payment->getOrder()->setCanSendNewEmailFlag(false);

// Sau khi payment transaction COMMIT thành công:
$this->orderSender->send($order);
```

**Idempotent bằng cờ `email_sent`** — IPN, Return URL và email recovery có thể đến **trùng** cho cùng 1 order; `OrderSender` kiểm tra và đặt cờ `email_sent` trên order:

```php
if ($order->getEmailSent()) {
    return; // đã gửi — skip, không gửi lần 2
}
$this->orderSender->send($order);
```

Không có guard này: khách nhận 2-3 email "đơn hàng đã xác nhận" cho 1 đơn.

---

## 5. Staging SMTP — verify giao thức, không verify deliverability

Staging SMTP thường trỏ **mailpit** (hoặc tương đương: MailHog, smtp4dev). Hệ quả quy ước:

- **KHÔNG BAO GIỜ test được mail thật trên staging** — mailpit bắt mọi email, không có bounces, không có spam filter, không có rate limit của nhà cung cấp.
- Trên staging chỉ verify được: đúng giao thức (SMTP handshake, TLS optional), đúng recipient, đúng template/locale, đúng trigger.
- **Deliverability** (inbox vs spam, domain auth SPF/DKIM/DMARC) chỉ verify trên môi trường có mail server thật — ghi rõ trong report cho khách, không hứa "đã test mail xong" khi chỉ test qua mailpit.

---

---

## 6. Outbox idempotency — duplicate resolution theo đúng key, không filter broad

Outbox table + cron flush (mỗi phút, batch ~50). Row QUEUED được INSERT **sau khi order commit** — seam single-funnel duy nhất là `sales_model_service_quote_submit_success` (fire sau khi order item có id, phủ storefront/REST/GraphQL/admin qua events.xml global). Loại `sales_order_place_after` (fire trước save) và `checkout_submit_all_after` (không single funnel).

**Key = sha256 của canonical JSON** với key order cố định, `JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE`:

```php
// {"v":1,"event_code":...,"entity_type":...,"entity_ref":...,
//  "recipient_email"(trim+strtolower),"channel":...,"store_id":...,
//  "occurrence"(explicit-null cho event đơn-lần)}
$this->idempotencyKey = hash('sha256', json_encode($canonical, $flags));
```

**Duplicate lookup phải theo đúng `idempotency_key` (UNIQUE index), không filter broad.** Bug thật: `findExistingId()` filter theo event/entity/channel/store — với repeatable event (cùng event, khác `occurrence`), replay B trả nhầm deliveryId của row A. Fix: build key 1 lần/leg, dùng chung cho INSERT và duplicate lookup.

---

## 7. Atomic claim — `claim_token` + lease, phải chứng minh bằng race thật

Cron worker claim việc bằng **1 UPDATE có điều kiện** (không SELECT-then-UPDATE):

```php
// claim: 1 statement — chỉ winner thay đổi được row
UPDATE delivery SET status='processing', claimed_at=NOW(), claim_token=:token
WHERE status='queued' AND id IN (...) LIMIT :batch;
// finish/release: guard bằng token
WHERE entity_id = :id AND claim_token = :token
```

- `claim_token = bin2hex(random_bytes(32))`; grace reclaim ~900s cho stale `processing` (worker chết giữa chừng).
- `UNIQUE(delivery_id, attempt_no)` chặn duplicate attempt — trùng cho SQL 1062 thay vì gửi 2 lần.

**Gate bắt buộc trên 2 DB connection thật**: đúng 1 winner; loser gọi finish → `affected = 0`; stale claim (-1000s > grace) được reclaim; token cũ bị chặn; duplicate attempt → 1062. Unit test mock ResourceModel **không thấy được SQL sai bên dưới** — không có gate này là ship bug claim.

---

## 8. MailException — phân loại retry, walk `getPrevious()`

Source-verified 2.4.8: **symfony/mailer ^6.4 là live path** (Laminas Mail là dead code — loại khỏi map). Surface type DUY NHẤT khi gửi là `Magento\Framework\Exception\MailException` (third-party SMTP plugin gói mọi `\Throwable`).

Quy tắc classifier:

1. **Walk `getPrevious()` chain** — mã lỗi thật nằm sâu trong exception gốc, không phải trên vỏ `MailException`.
2. **Tách phase BUILD vs SEND**: lỗi BUILD (template missing, config sai) **luôn FINAL** — retry không bao giờ thành công; chỉ lỗi SEND mới được retry.
3. Parse mã SMTP 3-digit chỉ cho nhánh `UnexpectedResponseException` — Symfony không có typed signal 4xx/5xx riêng.
4. **`MailException` IS-A `LocalizedException`; previous = null → `unclassified_error`** (fail-safe, không retry mù), không rơi vào nhánh retry được.
5. Có các silent-suppression path → trạng thái `ACCEPTED` ≠ đã gửi — reconcile bằng outbox/delivery status, không tin transport return.

---

## 9. `email_templates.xml` — XSD 2.4.8 bắt buộc `area` + `.html`

```xml
<template id="vendor_order_created" label="Order Created"
          file="order_created.html" type="html" area="frontend"/>
```

- Thiếu attribute **`area`** → Converter đọc vô điều kiện → `template_not_found` trên **mọi** lần send (không phải chỉ một template).
- `file=` phải có extension (`.html`) — quy ước giống `Magento_Sales`.
- Cả 2 lỗi **chỉ lộ qua functional smoke thật** — unit test với mock `TransportBuilder` không bắt được. Mock còn phải stub `setTemplateIdentifier` — quên stub thì chuỗi fluent trả null → `\Error` ở BUILD phase, tưởng là bug template.

---

## 10. Sender ownership — fail-closed per Event+Channel+Scope

Khi 2 sender có thể cùng gửi 1 email (channel riêng + native `OrderSender`), ownership phải check **fail-closed** và **per leg** trong fan-out:

- Default `magento_native`. Config path có channel dimension: `ownership_<channel>/<event_code>`.
- **Guard chống double-send**: channel owns event mà native email còn active (`sales_email/order/enabled=1`) → **KHÔNG gửi**, outcome `sender_ownership_conflict` — reprocess được sau khi flip config. Runbook flip: disable `sales_email/order/enabled`.
- Ownership check **theo từng channel leg**: email NOT_OWNED không cản zalo QUEUED (leg độc lập).
- Outcome `NOT_OWNED` = no-op **không tạo Delivery row** (khác lỗi send có row để retry).

1. Event publish từ business module không import class channel nào (grep imports).
2. Event unmapped → skip im lặng, không lỗi log.
3. Smoke-test: mỗi phase chạy process mới + purge `var/cache`; email đến mailpit đúng template.
4. Payment-first: đặt order qua callback → đúng 1 email; gọi callback lần 2 → không email thứ 2.
5. Transport throw → order vẫn commit, không rollback.
6. Outbox: replay cùng event → duplicate lookup trả đúng delivery của row đó (không nhầm row khác).
7. Claim race: 2 connection thật — 1 winner, loser `affected=0`, duplicate attempt → 1062.

---

## Liên kết

- Ngữ nghĩa config null vs rỗng: xem [../core/debugging-troubleshooting.md](../core/debugging-troubleshooting.md)
- Blueprint email đơn-channel (TransportBuilder, template, CC/BCC): xem [../../../examples/integration/transactional-email-blueprint.md](../../../examples/integration/transactional-email-blueprint.md)
- Event-observer pattern: xem [../core/event-observer-patterns.md](../core/event-observer-patterns.md)
- Redis backend (nơi email queue/cache sống): xem [redis.md](redis.md)
- Message queue (nếu fan-out qua queue): xem [../network/message-queues.md](../network/message-queues.md)
- Order lifecycle: xem [../business/order-lifecycle.md](../business/order-lifecycle.md)
