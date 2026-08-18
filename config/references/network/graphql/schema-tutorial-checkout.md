# GraphQL — Tutorial (Guide): Checkout (10 bước)

Nguồn chính:

- [GraphQL tutorials](https://developer.adobe.com/commerce/webapi/graphql/tutorials/)
- [GraphQL checkout tutorial](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/)

---

## 1. Checkout tutorial (tổng quan)

Checkout tutorial mô tả luồng đặt hàng đầy đủ qua GraphQL cho hai kiểu người mua:

- **Logged-in customer**
- **Guest customer**

Luồng chuẩn gồm 10 bước theo Adobe, trọng tâm là thao tác storefront/check-out, không bao gồm các nghiệp vụ backend như invoice/shipment.

---

## 2. Checkout tutorial — mục lục nhanh (10 bước)

| Bước | Mục tiêu | Link Adobe |
|------|----------|------------|
| 1 | Tạo customer + token | [create-customer](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/create-customer/) |
| 2 | Tạo cart rỗng | [create-cart](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/create-cart/) |
| 3 | Thêm sản phẩm vào cart | [add-product-to-cart](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/add-product-to-cart/) |
| 4 | Thiết lập địa chỉ giao hàng | [set-shipping-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-shipping-address/) |
| 5 | Thiết lập địa chỉ thanh toán | [set-billing-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-billing-address/) |
| 6 | Chọn phương thức giao hàng | [set-delivery-method](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-delivery-method/) |
| 7 | Áp mã giảm giá (tuỳ chọn) | [apply-coupon](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/apply-coupon/) |
| 8 | Gắn email cho guest cart (guest only) | [set-email-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-email-address/) |
| 9 | Chọn phương thức thanh toán | [set-payment-method](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-payment-method/) |
| 10 | Đặt hàng | [place-order](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/place-order/) |

---

## 3. Step 1 — create customer + generate token

- Tạo user bằng `createCustomerV2`.
- Lấy customer token bằng `generateCustomerToken`.
- Gắn header `Authorization: Bearer <token>` cho các bước customer.

Ghi chú:

- Có thể bỏ qua step này nếu chạy flow guest.
- Với flow customer, thiếu token sẽ fail ở các bước cần quyền customer.

---

## 4. Step 2 — create cart

Hai nhánh:

- **Customer**: query `customerCart` (trả cart đang active; chưa có thì tạo mới).
- **Guest**: mutation `createGuestCart`.

Kết quả cần lưu:

- `cart.id` dùng xuyên suốt các bước sau (`{ CART_ID }`).

---

## 5. Step 3 — add product to cart

- Dùng mutation thêm sản phẩm vào cart (tuỳ loại sản phẩm).
- Kiểm tra lại cart items/giá trị trả về để xác nhận số lượng và SKU.

Gợi ý triển khai:

- Chuẩn hóa input theo từng loại sản phẩm (simple, configurable, bundle...).
- Gom lỗi validation (SKU không tồn tại, qty sai, option thiếu) thành message dễ hiểu cho UI.

---

## 6. Step 4 — set shipping address

- Dùng `setShippingAddressesOnCart` để gắn địa chỉ giao hàng.
- Response thường bao gồm shipping methods khả dụng để dùng cho Step 6.

Ghi chú:

- Chỉ áp dụng cho đơn có shipment; đơn chỉ gồm virtual/downloadable có thể khác luồng.

---

## 7. Step 5 — set billing address

- Dùng `setBillingAddressOnCart` để gắn địa chỉ thanh toán.
- Có thể chọn địa chỉ khác shipping, hoặc tái sử dụng dữ liệu phù hợp luồng storefront.

---

## 8. Step 6 — set delivery method

- Dùng `setShippingMethodsOnCart`.
- Input chính: `cart_id`, `carrier_code`, `method_code`.
- `carrier_code/method_code` lấy từ dữ liệu shipping methods khả dụng trước đó.

---

## 9. Step 7 — apply coupon (optional)

- Dùng `applyCouponToCart` với `coupon_code`.
- Nếu cần rollback mã, dùng `removeCouponFromCart`.

Ghi chú:

- Coupon phải được tạo sẵn ở Admin (không tạo coupon trực tiếp bằng GraphQL tutorial flow).

---

## 10. Step 8 — set guest email (guest only)

- Guest bắt buộc gọi `setGuestEmailOnCart` trước khi đặt hàng.
- Customer đã đăng nhập thì bỏ qua bước này.

---

## 11. Step 9 — set payment method

- Query `cart { available_payment_methods }` để lấy danh sách phương thức khả dụng.
- Dùng `setPaymentMethodOnCart` để set phương thức (ví dụ `checkmo` trong tutorial).

---

## 12. Step 10 — place order

- Gọi `placeOrder(input: { cart_id })`.
- Nếu thành công, nhận `orderV2.number`.
- Xử lý `errors[]` trong payload để hiển thị lỗi nghiệp vụ rõ ràng.

---

## 13. Ghi chú triển khai nhanh (headless)

- Luôn giữ state `cart_id`, token, store headers theo session checkout.
- Tách rõ flow guest/customer ngay từ đầu để tránh gọi thừa mutation.
- Step 9/10 nên lock UI khi submit để tránh double-submit đơn.
- Luôn log correlation id giữa cart và order number cho debug.

---

## Liên kết trong bộ `.spec`

- Cart schema: [`schema-cart.md`](./schema-cart.md)
- Checkout schema: [`schema-checkout.md`](./schema-checkout.md)
- Core payment methods: [`schema-payment-methods.md`](./schema-payment-methods.md)
- Payment Services extension: [`schema-payment-services-extension.md`](./schema-payment-services-extension.md)
