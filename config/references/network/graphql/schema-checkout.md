# GraphQL — Schema (Guide): Checkout

Tóm tắt nhóm **Checkout** trên Adobe: **queries** dùng cho điều khoản, token thanh toán đã lưu, URL PayPal hosted / Payflow Link; **mutations** dùng tạo / xử lý token thanh toán cho các cổng online (Braintree, Klarna, PayPal, …). Trong file này: queries §2–§6; mutations §7–§13. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Checkout (nhóm schema)

Nguồn: [Checkout](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/)

- Schema **Checkout** hỗ trợ hoàn tất quy trình thanh toán: lấy / quản lý **payment token**, **checkout agreements**, và luồng tích hợp **PayPal** (từng phương thức có workflow riêng — xem doc “Core payment methods” trên Adobe).
- Cài **Payment Services** (≥ 2.3.0) có thêm query checkout (vd. `getPaymentConfig`, `getPaymentOrder`, `getPaymentSDK`) — không nằm trong các mục §3–§6; xem [Checkout queries](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/) và tài liệu Payment Services.

---

## 2. Checkout — danh sách queries (mục lục)

Nguồn: [Checkout queries](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/)

Tóm tắt theo Adobe: mỗi query có **phạm vi hẹp** — chỉ dùng khi bật điều kiện tương ứng (Terms & Conditions, Vault, hoặc đúng cổng PayPal).

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `checkoutAgreements` | [checkoutAgreements](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/agreements/) | §3 |
| `customerPaymentTokens` | [customerPaymentTokens](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/customer-payment-tokens/) | §4 |
| `getHostedProUrl` | [getHostedProUrl](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-hosted-pro-url/) | §5 |
| `getPayflowLinkToken` | [getPayflowLinkToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-payflow-link-token/) | §6 |

---

## 3. `checkoutAgreements`

Nguồn: [checkoutAgreements](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/agreements/)

- Lấy **checkout agreements** (điều khoản). Nếu **Enable Terms and Conditions** = **No** trong Admin, query **luôn trả mảng rỗng** — config `checkout/options/enable_agreements` (theo Adobe).
- Trường **`content`** có thể là HTML hoặc text thuần; dùng **`is_html`** để phân biệt.
- Cú pháp (theo doc): `checkoutAgreements: [CheckoutAgreement]`

---

## 4. `customerPaymentTokens`

Nguồn: [customerPaymentTokens](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/customer-payment-tokens/)

- Khi tích hợp hỗ trợ **vault** và đã bật, khách có thể **lưu thẻ**; lần sau xem danh sách phương thức đã lưu (vd. **Braintree**; bên thứ ba có thể hỗ trợ tương tự).
- Trả về mảng token đã lưu; xoá token bằng mutation **`deletePaymentToken`** (theo Adobe).
- **Bắt buộc** header **customer authorization token** (đã đăng nhập).
- Cú pháp (theo doc): `customerPaymentTokens: CustomerPaymentTokens` (cấu trúc `items`: `details`, `public_hash`, `payment_method_code`, `type`, … — xem Reference).

---

## 5. `getHostedProUrl`

Nguồn: [getHostedProUrl](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-hosted-pro-url/)

- **PaaS only** (badge trên doc). Cần khi chọn **PayPal Website Payments Pro Hosted Solution**: lấy URL do PayPal tạo để PWA/client mở form, khách nhập tài khoản PayPal và hoàn tất giao dịch.
- Gọi **sau** khi đã **set payment method** và **place order** (theo Adobe).
- Cú pháp (theo doc): `getHostedProUrl(input: HostedProUrlInput!): HostedProUrl` — output ví dụ: **`secure_form_url`**.
- Lỗi thường gặp (theo doc): không tìm thấy giỏ, giỏ không active, thiếu `cart_id`.

---

## 6. `getPayflowLinkToken`

Nguồn: [getPayflowLinkToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-payflow-link-token/)

- **PaaS only** (badge trên doc). Lấy credential PayPal cho giao dịch **PayPal Payflow Link** (`secure_token`, `secure_token_id`, `mode`, `paypal_url`, …).
- Gọi **sau** khi đã **set payment method** và **place order**; workflow chi tiết: doc **PayPal Payflow Link** (theo Adobe).
- Cú pháp (theo doc): `getPayflowLinkToken(input: PayflowLinkTokenInput): PayflowLinkToken`
- Lỗi (theo doc): ví dụ **No such entity with cartId** khi `cart_id` không hợp lệ.

---

## 7. Checkout — danh sách mutations (mục lục)

Nguồn: [Checkout mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/)

- Nhóm mutation này tạo / quản lý payment token để hoàn tất checkout cho cổng online.
- Nếu cài **Payment Services** (>= 2.3.0), Adobe có thêm mutation như `createPaymentOrder`, `syncPaymentOrder` (không nằm trong danh sách §8–§13 dưới đây).

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `createBraintreeClientToken` | [create-braintree-client-token](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-braintree-client-token/) | §8 |
| `createKlarnaPaymentsSession` | [create-klarna-payments-session](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-klarna-payments-session/) | §9 |
| `createPayflowProToken` | [create-payflow-pro-token](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-payflow-pro-token/) | §10 |
| `createPaypalExpressToken` | [create-paypal-express-token](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-paypal-express-token/) | §11 |
| `deletePaymentToken` | [delete-payment-token](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/delete-payment-token/) | §12 |
| `handlePayflowProResponse` | [handle-payflow-pro-response](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/handle-payflow-pro-response/) | §13 |

---

## 8. `createBraintreeClientToken`

Nguồn: [createBraintreeClientToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-braintree-client-token/)

- Tạo client token để khởi tạo Braintree JavaScript SDK.
- Cú pháp (theo doc): `createBraintreeClientToken: String`
- Lỗi thường gặp: Braintree payment method chưa active trên admin.

---

## 9. `createKlarnaPaymentsSession`

Nguồn: [createKlarnaPaymentsSession](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-klarna-payments-session/)

- **PaaS only** + mutation này được Adobe ghi rõ là **không còn hỗ trợ** do Klarna Vendor Bundled Extension bị gỡ từ 2.4.4.
- Nếu vẫn tham chiếu hệ cũ: mutation khởi tạo phiên Klarna, trả `client_token` và danh sách `payment_method_categories`; khi set payment dùng `payment_method.code` dạng `klarna_<identifier>` cùng token từ response.
- Cú pháp guide: `createKlarnaPaymentsSession(input: CreateKlarnaPaymentsSessionInput): CreateKlarnaPaymentsSessionOutput` (đối chiếu reference bản bạn dùng).

---

## 10. `createPayflowProToken`

Nguồn: [createPayflowProToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-payflow-pro-token/)

- **PaaS only**. Khởi tạo giao dịch Payflow Pro và nhận token.
- Input cần các URL tương đối (`return_url`, `cancel_url`, `error_url`) để Magento ghép base URL thành URL đầy đủ.
- Cú pháp (theo doc): `createPayflowProToken(input: PayflowProTokenInput): CreatePayflowProTokenOutput`

---

## 11. `createPaypalExpressToken`

Nguồn: [createPaypalExpressToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-paypal-express-token/)

- **PaaS only**. Bắt đầu authorize cho PayPal Express Checkout / Payflow Pro with Express Checkout / Payflow Link with Express Checkout.
- Input `urls` chứa URL tương đối (`return_url`, `cancel_url`) để hệ thống tạo URL đầy đủ; response trả token và `paypal_urls` (`start`, `edit`).
- Token này được dùng ở bước `setPaymentMethodOnCart` tiếp theo.
- Cú pháp (theo doc): `createPaypalExpressToken(input: PaypalExpressTokenInput): PaypalExpressTokenOutput`

---

## 12. `deletePaymentToken`

Nguồn: [deletePaymentToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/delete-payment-token/)

- Xoá payment token khỏi hệ thống (token lấy từ query `customerPaymentTokens`).
- Cần header customer authorization token.
- Cú pháp (theo doc): `deletePaymentToken(public_hash: String!): DeletePaymentTokenOutput`
- Lỗi thường gặp: `public_hash` không tồn tại hoặc customer chưa authorized.

---

## 13. `handlePayflowProResponse`

Nguồn: [handlePayflowProResponse](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/handle-payflow-pro-response/)

- **PaaS only**. Gửi lại payload silent post từ Payflow Pro gateway về Magento để hệ thống xử lý kết quả giao dịch.
- Payload thay đổi theo quốc gia merchant, sản phẩm, billing/shipping, v.v. (Adobe có ví dụ payload dài).
- Cú pháp (theo doc): `handlePayflowProResponse(input: PayflowProResponseInput!): PayflowProResponseOutput`

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Giỏ & đặt hàng (core): [`schema-cart.md`](./schema-cart.md)
- Tutorial: [GraphQL checkout tutorial](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/)
