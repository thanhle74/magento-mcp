# GraphQL — Schema (Guide): Payment Services extension (workflows + queries + mutations)

Tóm tắt nhóm **Payment Services extension** của Adobe Commerce: workflows checkout/minicart/PDP/vault và các query/mutation đặc thù của extension.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Payment Services extension (tổng quan)

Nguồn: [Payment Services extension](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/)

- Bổ sung lớp thanh toán mở rộng cho storefront (PayPal Smart Buttons, Hosted Fields, Apple Pay, Google Pay, vault workflows).
- Extension này không thay thế core `Cart`/`Checkout`; nó thêm operation riêng và workflow orchestration.
- Version gate theo Adobe:
  - base queries/mutations checkout: **2.3.0+**
  - vault without purchase: **2.10.0+**
  - PDP cart workflow (`addProductsToNewCart`, `setCartAsInactive`, `completeOrder`): **2.12.0+**

---

## 2. Payment Services extension — workflows (mục lục)

Nguồn: [Workflows](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/)

| Workflow | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| Checkout | [checkout](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/checkout/) | §3 |
| Minicart | [minicart](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/minicart/) | §4 |
| Add product to new cart on PDP | [cart-pdp](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/cart-pdp/) | §5 |
| Vault a card during checkout authorization | [vault-with-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-with-purchase/) | §6 |
| Vault a card without purchase | [vault-without-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-without-purchase/) | §7 |
| Checkout with vaulted card | [vaulted-card](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vaulted-card/) | §8 |

---

## 3. Workflow: checkout authorization

Nguồn: [checkout workflow](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/checkout/)

- Luồng điển hình: `getPaymentConfig` -> `setPaymentMethodOnCart` (khi cần) -> `createPaymentOrder` -> (tuỳ chọn) `getPaymentOrder` -> `placeOrder`.
- Với Smart Buttons/Apple Pay, Adobe cho phép bỏ qua `setPaymentMethodOnCart`; Hosted Fields chỉ cần khi vault hoặc dùng stored card.
- `setPaymentMethodOnCart` cho hosted fields dùng object `payment_services_paypal_hosted_fields`.

---

## 4. Workflow: minicart

Nguồn: [minicart workflow](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/minicart/)

- Luồng chính: `getPaymentConfig` -> `createPaymentOrder` -> `syncPaymentOrder` -> `setShippingMethodsOnCart` -> `placeOrder`.
- `syncPaymentOrder` đồng bộ quote với shipping/billing/email/phone từ payment order.

---

## 5. Workflow: add product to new cart on PDP

Nguồn: [cart-pdp workflow](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/cart-pdp/)

- Luồng chính: `getPaymentConfig` -> `addProductsToNewCart` -> `createPaymentOrder` -> `placeOrder`.
- Khi huỷ thanh toán hoặc lỗi payment: gọi `setCartAsInactive` để tránh nhiều active cart cho cùng customer.

---

## 6. Workflow: vault a card during checkout

Nguồn: [vault-with-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-with-purchase/)

- Điều kiện: Payment Services **2.10.0+**, customer đăng nhập.
- Khác biệt chính: `createPaymentOrder(vaultIntent: true)` và `setPaymentMethodOnCart(... is_active_payment_token_enabler: true)`.
- Sau `placeOrder`, token vault được tạo/lưu cho customer.

---

## 7. Workflow: vault a card without purchase

Nguồn: [vault-without-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-without-purchase/)

- Luồng chính: `getVaultConfig` -> `createVaultCardSetupToken` -> SDK cập nhật card data -> `createVaultCardPaymentToken`.
- `setup_token` là token tạm; mutation thứ hai trả `vault_token_id` vĩnh viễn.

---

## 8. Workflow: checkout with vaulted card

Nguồn: [vaulted-card workflow](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vaulted-card/)

- Luồng chính: `customerPaymentTokens` -> `setPaymentMethodOnCart(code: "payment_services_paypal_vault")` -> `placeOrder`.
- `public_hash` lấy từ `customerPaymentTokens` là input quan trọng cho object `payment_services_paypal_vault`.

---

## 9. Payment Services extension — queries (mục lục)

Nguồn: [Payment Services extension queries](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `getPaymentConfig` | [getPaymentConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-config/) | §10 |
| `getPaymentOrder` | [getPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-order/) | §11 |
| `getPaymentSDK` | [getPaymentSDK](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-sdk/) | §12 |
| `getVaultConfig` | [getVaultConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-vault-config/) | §13 |

---

## 10. `getPaymentConfig`

Nguồn: [getPaymentConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-config/)

- Trả cấu hình payment methods theo `location` (`PRODUCT_DETAIL`, `MINICART`, `CART`, `CHECKOUT`, `ADMIN`).
- Dùng để render Hosted Fields / Smart Buttons / Apple Pay / Google Pay cùng `sdk_params`.
- Cho Hosted Fields, các flag đáng chú ý: `payment_source`, `three_ds_mode`, `is_vault_enabled`, `cc_vault_code`, `requires_card_details`.

---

## 11. `getPaymentOrder`

Nguồn: [getPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-order/)

- Input chính: `cartId`, `id` (PayPal order id).
- Trả chi tiết payment order (`mp_order_id`, `status`, `payment_source_details`).
- Theo Adobe, query này cần khi bật Signifyd + Hosted Fields để lấy dữ liệu payment details cập nhật.

---

## 12. `getPaymentSDK`

Nguồn: [getPaymentSDK](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-sdk/)

- Trả danh sách `sdkParams` theo `location` để load PayPal JS SDK.
- Mỗi entry gồm `code` payment method và `params[]` (`name`, `value`).

---

## 13. `getVaultConfig`

Nguồn: [getVaultConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-vault-config/)

- Chỉ có ở Payment Services **2.10.0+**.
- Dùng trước flow vault without purchase để kiểm tra `is_vault_enabled`.
- Output thường gồm `credit_card` config với `is_vault_enabled`, `three_ds_mode`, `sdk_params[]`.

---

## 14. Payment Services extension — mutations (mục lục)

Nguồn: [Payment Services extension mutations](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/)

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `syncPaymentOrder` | [syncPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/sync-payment-order/) | §15 |
| `setCartAsInactive` | [setCartAsInactive](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/set-cart-inactive/) | §16 |
| `createVaultCardSetupToken` | [createVaultCardSetupToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-setup-token/) | §17 |
| `createVaultCardPaymentToken` | [createVaultCardPaymentToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-payment-token/) | §18 |
| `createPaymentOrder` | [createPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-payment-order/) | §19 |
| `completeOrder` | [completeOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/complete-order/) | §20 |
| `addProductsToNewCart` | [addProductsToNewCart](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/add-products-new-cart/) | §21 |

---

## 15. `syncPaymentOrder`

Nguồn: [syncPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/sync-payment-order/)

- Có từ Payment Services **2.3.0+**.
- Dùng sau `createPaymentOrder`.
- Đồng bộ quote bằng dữ liệu payment order (shipping/billing/email/phone).
- Input bắt buộc: `cartId`, `id` (PayPal order id). Output là `Boolean` thành công/thất bại.

---

## 16. `setCartAsInactive`

Nguồn: [setCartAsInactive](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/set-cart-inactive/)

- Có từ Payment Services **2.12.0+**.
- Đặt `cartId` thành inactive để tránh nhiều active carts (đặc biệt trong PDP smart button flow).
- Phù hợp khi payment bị huỷ/lỗi sau `addProductsToNewCart`.
- Output thường trả `success` + `error`.

---

## 17. `createVaultCardSetupToken`

Nguồn: [createVaultCardSetupToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-setup-token/)

- Có từ Payment Services **2.10.0+**.
- Tạo token tạm `setup_token` cho luồng vault không qua checkout.
- Input gồm `setup_token.payment_source.card...` và tùy chọn `three_ds_mode` (`OFF`, `SCA_ALWAYS`, `SCA_WHEN_REQUIRED`).

---

## 18. `createVaultCardPaymentToken`

Nguồn: [createVaultCardPaymentToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-payment-token/)

- Có từ Payment Services **2.10.0+**.
- Dùng `setup_token_id` từ mutation §17 để tạo `vault_token_id` vĩnh viễn.
- Có thể kèm `card_description` để hiển thị trong storefront.

---

## 19. `createPaymentOrder`

Nguồn: [createPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-payment-order/)

- Có từ Payment Services **2.3.0+**.
- Dùng để mở payment order trước khi `placeOrder`.
- Input chính: `cartId`, `methodCode`, `paymentSource`, `location`, `vaultIntent`.
- Output chính: `id`, `mp_order_id`, `status`, `amount`, `currency_code`.

---

## 20. `completeOrder`

Nguồn: [completeOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/complete-order/)

- Có từ Payment Services **2.12.0+**.
- Mục đích: đồng bộ/finalize order details trước `placeOrder` cho flow extension.
- Input: `cartId`, `id` (payment/checkout/transaction id).
- Output: `orderV2 { number, token }` + `errors[]`; token có thể dùng với `guestOrderByToken`.

---

## 21. `addProductsToNewCart`

Nguồn: [addProductsToNewCart](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/add-products-new-cart/)

- Có từ Payment Services **2.12.0+**.
- Luôn tạo cart mới rồi thêm item (khác `addProductsToCart` cần cart có sẵn).
- Dùng chủ yếu cho PDP smart button flow.
- Trả `cart.id` và `user_errors`; Adobe khuyến nghị kết hợp `setCartAsInactive` khi flow bị huỷ/lỗi.

---

## 22. Ghi chú triển khai nhanh (headless)

- Tách rõ core flow (`schema-cart.md`, `schema-checkout.md`) và Payment Services flow để tránh gọi nhầm operation.
- Với smart buttons/Apple Pay, chỉ dùng `setPaymentMethodOnCart` khi flow cần vault/stored card.
- Với vault flow, cần theo dõi mapping: `setup_token` -> `vault_token_id` -> `public_hash` (khi checkout bằng vaulted card).
- Với PDP/minicart flow, thêm nhánh cleanup bằng `setCartAsInactive`.

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Core payment methods: [`schema-payment-methods.md`](./schema-payment-methods.md)
- Checkout core: [`schema-checkout.md`](./schema-checkout.md)
- Cart core: [`schema-cart.md`](./schema-cart.md)
