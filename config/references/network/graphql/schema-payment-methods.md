# GraphQL — Schema (Guide): Core payment methods

Tóm tắt nhóm **Core GraphQL payment methods** của Adobe Commerce: luồng tích hợp và payload chính khi gọi `setPaymentMethodOnCart`, cùng các query/mutation checkout liên quan. Đây là guide vận hành cho payment methods (không phải nhóm schema query/mutation độc lập như Cart/Checkout).  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Core payment methods (tổng quan)

Nguồn: [Core GraphQL payment methods](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/)

- Nhóm này mô tả cách tích hợp các cổng thanh toán bên thứ ba qua GraphQL storefront.
- Hầu hết luồng đều xoay quanh:
  - `create*Token` / query checkout lấy token hoặc URL (tuỳ cổng)
  - `setPaymentMethodOnCart` với object theo từng cổng
  - `placeOrder` để chốt đơn
- Nhiều phương thức PayPal là **PaaS only** và được Adobe gắn nhãn legacy.
- `setPaymentMethodOnCart` và `placeOrder` thuộc schema `Cart`; một số token/query phụ thuộc `Checkout`.

---

## 2. Core payment methods — danh sách (mục lục)

| Payment method | Nguồn Adobe | Trong file này |
|----------------|-------------|----------------|
| Braintree | [Braintree](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree/) | §3 |
| Braintree Vault | [Braintree Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree-vault/) | §4 |
| Klarna | [Klarna](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/klarna/) | §5 |
| PayPal Express Checkout | [PayPal Express Checkout](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/paypal-express-checkout/) | §6 |
| Express Checkout for other PayPal solutions | [payflow_express](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-express/) | §7 |
| PayPal Payflow Link | [Payflow Link](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-link/) | §8 |
| PayPal Payflow Pro | [Payflow Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro/) | §9 |
| PayPal Payflow Pro Vault | [Payflow Pro Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro-vault/) | §10 |
| PayPal Payments Advanced | [Payments Advanced](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payments-advanced/) | §11 |
| PayPal Website Payments Pro Hosted Solution | [Hosted Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/hosted-pro/) | §12 |

---

## 3. `braintree`

Nguồn: [Braintree](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree/)

- Luồng chuẩn:
  - `createBraintreeClientToken`
  - SDK Braintree tokenize card ở client
  - `setPaymentMethodOnCart` với `code: "braintree"`
  - `placeOrder`
- Payload chính trong `payment_method.braintree`:
  - `payment_method_nonce` (bắt buộc)
  - `is_active_payment_token_enabler` (bật lưu thẻ cho vault, tuỳ cấu hình)
  - `device_data` (tuỳ chọn, khi dùng Kount)

---

## 4. `braintree_cc_vault`

Nguồn: [Braintree Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree-vault/)

- Dùng cho khách đã lưu thẻ trước đó (vault flow).
- Trước khi set payment method thường gọi `customerPaymentTokens` để lấy token đã lưu.
- `setPaymentMethodOnCart`:
  - `code: "braintree_cc_vault"`
  - `braintree_cc_vault.public_hash` (bắt buộc)
  - `device_data` (tuỳ chọn)

---

## 5. Klarna (`klarna_<identifier>`)

Nguồn: [Klarna](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/klarna/)

- Luồng chuẩn:
  - `createKlarnaPaymentsSession` lấy `client_token` + danh sách payment categories
  - render Klarna widget và lấy `authorization_token`
  - `setPaymentMethodOnCart` với `code: "klarna_<identifier>"`
  - `placeOrder`
- Payload chính: `payment_method.klarna.authorization_token`.
- Sau khi cart thay đổi (coupon/address/shipping), cần refresh trạng thái payment options theo luồng Adobe.

---

## 6. `paypal_express`

Nguồn: [PayPal Express Checkout](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/paypal-express-checkout/)

- Luồng chuẩn:
  - `createPaypalExpressToken`
  - redirect khách sang PayPal approve
  - callback trả `token` + `payer_id`
  - `setPaymentMethodOnCart` rồi `placeOrder`
- Payload chính:
  - `code: "paypal_express"`
  - `paypal_express { payer_id, token }`

---

## 7. `payflow_express`

Nguồn: [Express Checkout for other PayPal solutions](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-express/)

- Dùng khi Express Checkout bật cho các solution như Payflow Link/Pro/Payments Advanced.
- Luồng tích hợp gần như giống `paypal_express`, khác chủ yếu ở `code`.
- Payload chính:
  - `code: "payflow_express"`
  - `payflow_express { payer_id, token }`

---

## 8. `payflow_link` (PaaS only)

Nguồn: [Payflow Link](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-link/)

- Adobe gắn nhãn legacy; áp dụng theo vùng/cấu hình hỗ trợ của PayPal.
- Luồng: `setPaymentMethodOnCart` -> `placeOrder` -> `getPayflowLinkToken` -> render iframe URL từ `paypal_url` -> silent post.
- Payload chính:
  - `code: "payflow_link"`
  - `payflow_link { return_url, error_url, cancel_url }` (URL tương đối)

---

## 9. `payflowpro` (PaaS only)

Nguồn: [Payflow Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro/)

- Luồng chuẩn:
  - `setPaymentMethodOnCart` (card metadata)
  - `createPayflowProToken`
  - gửi/nhận payload từ gateway
  - `handlePayflowProResponse`
  - `placeOrder`
- Payload chính trong `payflowpro`:
  - `cc_details` (`cc_exp_month`, `cc_exp_year`, `cc_last_4`, `cc_type`)
  - `is_active_payment_token_enabler` (tuỳ vault)

---

## 10. `payflowpro_cc_vault` (PaaS only)

Nguồn: [Payflow Pro Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro-vault/)

- Dùng cho khách đăng nhập đã có payment token lưu trong vault.
- Luồng: `customerPaymentTokens` -> `setPaymentMethodOnCart` -> `placeOrder`.
- Payload chính:
  - `code: "payflowpro_cc_vault"`
  - `payflowpro_cc_vault.public_hash` (bắt buộc)

---

## 11. `payflow_advanced` (PaaS only)

Nguồn: [Payments Advanced](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payments-advanced/)

- Adobe gắn nhãn legacy.
- GraphQL integration gần như giống `payflow_link`, khác ở `code`.
- Payload chính:
  - `code: "payflow_advanced"`
  - `payflow_link { return_url, error_url, cancel_url }`

---

## 12. `hosted_pro` (PaaS only)

Nguồn: [Hosted Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/hosted-pro/)

- Adobe gắn nhãn legacy.
- Luồng: `setPaymentMethodOnCart` -> `placeOrder` -> `getHostedProUrl` -> render iframe `secure_form_url` -> silent post.
- Payload chính:
  - `code: "hosted_pro"`
  - `hosted_pro { return_url, cancel_url }`

---

## 13. Ghi chú triển khai nhanh (headless)

- Dùng `storeConfig` để kiểm tra cổng nào đang bật trước khi render UI chọn payment.
- URL trong payload PayPal thường là URL tương đối để backend ghép base URL đúng store.
- Tách rõ các flow:
  - flow cần redirect (`paypal_express`, `payflow_express`)
  - flow iframe/token (`payflow_link`, `payflow_advanced`, `hosted_pro`)
  - flow hosted fields/tokenization (`braintree`)
  - flow vault (`*_vault`)
- Với flow legacy/PaaS, log kỹ bước tạo token và callback/silent-post để debug mismatch trạng thái đơn.

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Checkout queries/mutations: [`schema-checkout.md`](./schema-checkout.md)
- Cart payment mutations: [`schema-cart.md`](./schema-cart.md)
