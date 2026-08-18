# GraphQL — Release Notes (tóm tắt)

Nguồn chính: [GraphQL release notes](https://developer.adobe.com/commerce/webapi/graphql/release-notes/)

---

## 1. Ghi chú quan trọng

- Từ **Adobe Commerce / Magento Open Source 2.4.1 trở lên**, GraphQL release notes được gộp vào bộ release notes chung của Adobe Commerce và Magento Open Source.
- Trang release notes GraphQL hiện tại chủ yếu là lịch sử thay đổi từ giai đoạn 2.3.x đến 2.4.0.

---

## 2. Adobe Commerce / Magento Open Source 2.4.0

- Thêm `reorderItems` mutation.
- Thêm `categories` query có filter + pagination (khác `categoryList`).
- Thêm `pickupLocations` query và hỗ trợ `pickup_location_code` trong `setShippingAddressesOnCart`.

---

## 3. Adobe Commerce / Magento Open Source 2.3.5

- `products` và `categoryList` có thể truy vấn dữ liệu trong staged campaign (cần admin token + staging headers).
- Cải thiện `MediaGalleryInterface` (thêm `position`, `disabled`) và nhiều bug fix cart/category image/shipping.

---

## 4. Adobe Commerce / Magento Open Source 2.3.4

- Thêm `mergeCarts`.
- Củng cố luồng multi-device checkout qua `customerCart`.
- `categoryList` thay thế `category` (deprecated).
- Bổ sung thêm mutation cho bundle/downloadable vào cart.
- Mở rộng cart totals/promotions và tăng test coverage.

Deprecated tại bản này:

- `category` query -> dùng `categoryList`
- `setPaymentMethodOnCartAndPlaceOrder` -> dùng `setPaymentMethodOnCart` + `placeOrder`
- `wishlist` query -> dùng `customer` query

---

## 5. Adobe Commerce / Magento Open Source 2.3.3

- Mở rộng thanh toán qua GraphQL: PayPal/Braintree/... và token/payment flows tương ứng.
- Adobe Commerce: thêm gift card và store credit operations trên cart/account.
- Thêm `addConfigurableProductsToCart`.

---

## 6. Magento Open Source 2.3.2

- Bổ sung gần như đầy đủ checkout mutations cho guest/customer:
  - add products, set shipping/billing, set shipping/payment method, coupon, guest email, place order.
- Thêm vault-support queries/mutations như `customerPaymentTokens`, `deletePaymentToken`.
- Hỗ trợ gửi query qua GET/POST, và nêu rõ các query có thể cache qua FPC/Varnish khi gọi GET.

---

## 7. Magento Open Source 2.3.1

- Mở rộng My Account operations qua GraphQL (account/profile/address/password/newsletter/order history...).
- Nâng cấp framework: token mutations, query complexity guard, variables, schema/browser improvements.

---

## 8. Cách dùng release notes trong dự án

- Khi debug khác biệt hành vi theo phiên bản, tra release notes trước để xác định thay đổi nền tảng.
- Với project hiện tại (2.4.8), lấy release notes làm lịch sử, còn quyết định API cuối cùng vẫn phải đối chiếu `reference.md` đúng version.

---

## Liên kết trong bộ `.spec`

- Mục lục GraphQL: [`README.md`](./README.md)
- API reference theo version: [`reference.md`](./reference.md)
- Tutorial checkout: [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md)
