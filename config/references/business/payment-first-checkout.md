# Pattern: Payment-first checkout (redirect/async gateway)

> Từ khóa tra cứu: payment-first, redirect payment, IPN, webhook self-complete, payment attempt, OrderFinalizer, placeOrder guard, quote fingerprint, payment recovery, email after commit, MoMo ZaloPay, contract_mismatch quarantine, carrier mapper null field, session concurrency exceeded, outbound timeout.

Kiến trúc chuẩn team cho payment method dạng redirect/async (khách rời site sang provider rồi
quay về, hoặc provider gọi IPN/webhook). Rút từ tích hợp thực tế (MoMo, ZaloPay, PaySquad) —
mọi rule dưới đây đều bắt nguồn từ incident hoặc review blocker thật.

---

## 1. Nguyên tắc lõi: NO verified payment → NO Sales Order

- KHÔNG tạo Sales Order khi chưa có **verified payment** server-side. Quote đang active +
  attempt record là tất cả những gì tồn tại trước khi provider xác nhận.
- Browser return (trang success/error khách quay về) **chỉ là UX/recovery** — KHÔNG phải bằng
  chứng thanh toán (xem [payment-gateway.md §17](../security/payment-gateway.md) rule 1).
- Trạng thái đơn chỉ được xác lập qua IPN/webhook đã verify chữ ký, hoặc API query đã xác
  thực — IPN là driver chính, tự hoàn tất đơn mà không phụ thuộc browser.

**CẤM:** feature flag / fallback mode / admin toggle cho cơ chế payment-first (vd cờ
`payment_first` chuyển qua lại "kiểu cũ/kiểu mới"). Breaking là breaking — không có công tắc.

---

## 2. Attempt state machine

Mỗi lần khách bấm place order với redirect gateway = 1 **payment attempt** (bảng riêng, không
đụng `sales_order`). State machine tối thiểu:

```
INITIATED → ACTIVE (đã redirect) → PAID (authoritative success) → FINALIZED (order tạo xong)
                    ↘ FAILED (provider từ chối tường minh)
                    ↘ RECON_* (trạng thái quarantine khi evidence mâu thuẫn — cần ops soi)
```

Quy tắc:

1. **Reserve merchant reference trước khi rời site**: `orderId`/`requestId` gửi provider phải
   được persist trong attempt NGƯỚC khi gọi create API — response trả về phải đối chiếu được.
2. **Immutable amount/quote contract**: attempt khóa amount + quote contents ngay khi tạo.
   Khách đổi giỏ hàng giữa 2 lần redirect → attempt cũ invalid, tạo attempt mới — không sửa
   amount của attempt đang active.
3. Mọi state transition qua **Magento service**, không raw SQL (payment-gateway.md §17 rule 4).

---

## 3. Authoritative success — định nghĩa tường minh

Thanh toán chỉ được coi thành công khi ĐỦ:

1. **Signature verify** theo tài liệu provider (nếu response có signature — nhiều API query/
   refund KHÔNG có, xem [payment-gateway.md §19](../security/payment-gateway.md)).
2. **Merchant identity khớp**: partnerCode/merchantId của chính mình.
3. **Amount khớp** attempt (so chuỗi an toàn, tránh float).
4. **Transaction identity khớp**: requestId/orderId echo đúng attempt đang xử lý — chống
   evidence của attempt khác.

Thiếu bất kỳ → KHÔNG tạo đơn; nếu evidence mâu thuẫn (vd provider báo paid nhưng amount lệch)
→ state `RECON_*` + log critical, không tự đoán.

---

## 4. OrderFinalizer — single placeOrder site

Đơn hàng được tạo bởi **đúng 1 điểm duy nhất** (`OrderFinalizer`):

- Chạy trong DB transaction, có **lock theo attempt/reference** (chống IPN + Return + Recovery
  race → double order).
- Có **placement authorization**: attempt ở state PAID mới được phép placeOrder; finalizer là
  nơi duy nhất kiểm và set `FINALIZED`.
- Idempotent: attempt đã FINALIZED → no-op thành công (IPN retry phải an toàn).
- Verify E2E invariant: trước thanh toán 0 order → sau thanh toán đúng 1 order → reload
  Return URL không tạo thêm order.

**Gotcha guard placeOrder**: nếu dùng plugin global trên `QuoteManagement` để chặn placeOrder
(non-payment-first path), phải tuân DI isolation — xem
[payment-gateway.md §18](../security/payment-gateway.md). Lưu ý: Mageplaza One Step Checkout
đặt hàng thuần REST (không đi server-side `placeOrder`), còn Admin tạo đơn đi qua `submit()`
— guard trên `placeOrder` không chạm 2 đường này, test riêng.

---

## 5. Quote contract fingerprint

Khách có thể mở 2 tab, redirect nhiều lần. Mỗi attempt chụp **fingerprint** của quote contract
(items + amount + shipping + address hash) lúc tạo:

- IPN về cho attempt A nhưng quote đã mutate lệch fingerprint → từ chối finalize attempt đó,
  yêu cầu khách thanh toán lại (attempt mới).
- Snapshot lựa chọn quan trọng (campaign, gift wrap...) vào **quote item options** khi
  add-to-cart — không đọc lại từ config runtime khi finalize.

---

## 6. Recovery cron + console command pair

Mọi gateway redirect cần recovery job quét attempt treo (ACTIVE quá X phút):

1. **Claim atomic trước HTTP**: `UPDATE ... SET claimed_at = :now WHERE state='ACTIVE' AND
   claimed_at IS NULL LIMIT n` — check affected rows; nhiều node không được query provider
   cùng lúc cho 1 attempt.
2. **Query provider NGOÀI DB transaction** — HTTP call trong TX giữ lock + treo connection.
3. **Exhaustion (hết retry query)** = operational-only: attempt sang `RECON_*` + log critical,
   KHÔNG tự hủy/tự finalize khi chưa có verified evidence.
4. **Cron phải có cặp console command** (`bin/magento vendor:payment:recover --attempt=ID`)
   để test/recovery thủ công không phải chờ cron window.

---

## 7. Email — sau commit, idempotent

1. **Chặn gửi sớm**: redirect payment KHÔNG gửi order email khi đơn còn pending — set
   `$payment->getOrder()->setCanSendNewEmailFlag(false)` (SubmitObserver sẽ không gửi).
2. **Gửi sau commit** (payment verified + order tạo thành công): gọi `OrderSender` sau khi TX
   commit, kèm claim/grace (vd 900s) chống gửi trùng khi IPN + Return cùng chạy.
3. **Idempotency tự xử lý** — KHÔNG assume `OrderSender` idempotent: check cờ
   `email_sent`/`send_email` trước khi gửi.
4. **Mail fail KHÔNG rollback payment**: gửi email nằm sau commit — exception email chỉ log,
   business transaction đã xong.
5. Staging SMTP thường trỏ mailpit → không bao giờ test được deliverability thật trên staging.

---

## 8. Checklist E2E trước khi báo done

- [ ] Trước thanh toán: 0 order. Sau verified payment: đúng 1 order. Reload Return URL: vẫn 1.
- [ ] IPN đến TRƯỚC browser return: đơn vẫn được finalize đúng 1 lần.
- [ ] IPN retry x3: idempotent, không double invoice/capture/email.
- [ ] Signature sai / amount lệch / requestId lạ: KHÔNG tạo đơn, có log cảnh báo.
- [ ] Khách bỏ giữa chừng: attempt treo được recovery claim, không order zombie.
- [ ] Cron-expiry vs late-callback race xử lý tường minh (payment-gateway.md §17 rule 6).
- [ ] DI binding test + runtime smoke cho mọi service trong chuỗi (payment-gateway.md §18).
- [ ] Không có feature flag/fallback nào cho luồng payment-first.

---

## 9. Fingerprint drift — quote bị mutate giữa window thanh toán

Incident thật: attempt `payment_status=paid | order_id=NULL | requires_reconciliation=1 |
reconciliation_code=contract_mismatch` **dù provider xác nhận đã nhận tiền** — fingerprint
Start ≠ Return trong khi không ai đổi giỏ hàng. Nguyên nhân: shipping-carrier mapping fail
(`No mapping found for address: region_id=..., city_id=...`) kèm request estimate/totals ghi
đè `street`/`city` thành NULL liên tục trên `quote_address` trong window thanh toán.

Quy tắc:

1. **Carrier mapper KHÔNG được null field trên quote khi mapping fail** — fail = bỏ qua +
   message/exception tường minh, tuyệt đối không "sanitize" address thành NULL.
2. **Fingerprint tính trên state ĐÃ PERSIST** — đọc lại quote từ DB lúc verify, không hash
   in-memory object đang bị các request khác mutate giữa chừng.
3. Kết án drift bằng test có kiểm soát: tắt carrier API → attempt hash Start = Return → order
   tạo thành công (chứng minh carrier là thủ phạm, không phải fingerprint logic).
4. Attempt rơi `contract_mismatch` dù tiền đã vào → đi qua reconciliation tường minh
   (refund/re-order theo evidence), không tự finalize — đúng §3.

---

## 10. Outbound HTTP client bắt buộc có timeout

Mọi HTTP client outbound (payment gateway, carrier API) **phải set timeout tường minh**.
Client không timeout (vd `setOptions([])` trống) khi treo sẽ giữ session lock
(`Cm_RedisSession`) mãi → mọi request cùng session nhận *"Session concurrency exceeded: N
waiting, M total requests"* (503) — triệu chứng: Place Order loading vô hạn +
`customer/section/load` 500/503. Refund/query timeout tối thiểu 30s cho provider xử lý chậm
— đặt thấp hơn sinh UNKNOWN ảo (xem [../security/payment-gateway.md](../security/payment-gateway.md) §24).

---

## Liên kết

- Gateway facade/command pool: xem [../security/payment-gateway.md](../security/payment-gateway.md)
- Gotchas tích hợp thực tế: xem [laybyland-payment-integration.md](laybyland-payment-integration.md)
- Review rules redirect payment: xem [../security/payment-gateway.md](../security/payment-gateway.md) §17
