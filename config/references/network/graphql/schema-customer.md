# GraphQL — Schema (Guide): Customer (queries + mutations)

Tóm tắt nhóm **Customer** trên Adobe, gồm **queries + mutations** phục vụ đăng ký/đăng nhập, quản lý hồ sơ và địa chỉ, token/password, và luồng guest-to-customer. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Customer (nhóm schema)

Nguồn: [Customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/)

- Customer là shopper đã có account; để truy vấn/sửa dữ liệu customer nên ưu tiên dùng **customer token** trong header (Adobe cũng nhắc có thể dùng session auth).
- B2B có thể bổ sung thêm field trên object `Customer` như `job_title`, `requisition_lists`, `role`, `status`, `team`, `telephone`.

---

## 2. Customer — danh sách queries (mục lục)

Nguồn: [Customer queries](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `customer` | [customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer/) | §3 |
| `customerCart` | [customerCart](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/cart/) | §4 |
| `customerDownloadableProducts` | [customerDownloadableProducts](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/downloadable-products/) | §5 |
| `customerOrders` | [customerOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/orders/) | §6 |
| `giftCardAccount` | [giftCardAccount](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/giftcard-account/) | §7 |
| `isEmailAvailable` | [isEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/is-email-available/) | §8 |
| `customerGroup` | [customerGroup](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-group/) | §9 |
| `customerSegments` | [customerSegments](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-segments/) | §10 |

---

## 3. `customer`

Nguồn: [customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer/)

- Trả thông tin customer đã đăng nhập (profile, addresses, wishlist / store-credit-history tuỳ field chọn trong query).
- Khuyến nghị dùng customer token trong header.
- Cú pháp guide: `customer: Customer`

---

## 4. `customerCart`

Nguồn: [customerCart](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/cart/)

- Trả giỏ active của customer đã đăng nhập; nếu chưa có giỏ thì hệ thống tạo mới.
- Khác `cart` query:
  - `customerCart` không nhận input, bắt buộc chạy cho logged-in customer;
  - `cart` cần `cart_id` và có thể dùng cho guest.
- Có thể lấy `id` từ `customerCart` để dùng trong `mergeCarts` (merge guest cart vào customer cart).
- Cú pháp: `customerCart: Cart!`

---

## 5. `customerDownloadableProducts`

Nguồn: [customerDownloadableProducts](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/downloadable-products/)

- **PaaS only** (badge trên doc). Trả danh sách downloadable products customer đã mua.
- Cần customer đã đăng nhập; lỗi phổ biến: customer không authorized.
- Cú pháp guide: `customerDownloadableProducts: CustomerDownloadableProducts`

---

## 6. `customerOrders`

Nguồn: [customerOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/orders/)

- **PaaS only** (badge trên doc). Query này đã **deprecated**; Adobe khuyến nghị dùng object `orders` bên trong query `customer`.
- Dùng để lấy lịch sử order của customer đăng nhập.
- Cú pháp guide: `customerOrders: CustomerOrders`

---

## 7. `giftCardAccount`

Nguồn: [giftCardAccount](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/giftcard-account/)

- **Adobe Commerce only** (badge trên doc). Tra cứu thông tin gift card theo code (balance, expiration, ...).
- Lưu ý doc có thể thể hiện cú pháp tóm tắt `giftCardAccount(code: String!): GiftCardAccount` và ví dụ dùng input object; khi triển khai cần đối chiếu đúng reference/introspection bản đang chạy.

---

## 8. `isEmailAvailable`

Nguồn: [isEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/is-email-available/)

- Kiểm tra email đã dùng để tạo account chưa.
- Theo Adobe, từ Commerce 2.4.7 mặc định query này luôn trả `true`; có thể đổi hành vi bằng setting **Enable Guest Checkout Login** (đổi setting này có rủi ro lộ thông tin customer cho unauthenticated users).
- Cú pháp guide: `isEmailAvailable(email: String!): IsEmailAvailableOutput`

---

## 9. `customerGroup`

Nguồn: [customerGroup](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-group/)

- Thuộc **Storefront Compatibility Package**; doc ghi sẽ thêm vào Adobe Commerce 2.4.9.
- Trả encoded ID của customer group cho logged-in customer hoặc guest.
- Với logged-in customer nên truyền token; với guest không truyền token.
- Cú pháp guide: `customerGroup: CustomerGroupStorefront!`

---

## 10. `customerSegments`

Nguồn: [customerSegments](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-segments/)

- Thuộc **Storefront Compatibility Package**; doc ghi sẽ thêm vào Adobe Commerce 2.4.9.
- Trả encoded IDs của customer segments cho logged-in customer hoặc guest.
- Với logged-in customer nên truyền token; với guest không truyền token.
- Cú pháp guide: `customerSegments(cartId: String!): [CustomerSegmentStorefront!]`

---

## 11. Customer — danh sách mutations (mục lục)

Nguồn: [Customer mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/)

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `generateCustomerToken` | [generateCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token/) | §12 |
| `exchangeOtpForCustomerToken` | [exchangeOtpForCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-otp-customer-token/) | §13 |
| `exchangeExternalCustomerToken` | [exchangeExternalCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-external-customer-token/) | §14 |
| `deleteCustomerAddressV2` | [deleteCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address-v2/) | §15 |
| `deleteCustomerAddress` | [deleteCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address/) | §16 |
| `createCustomerV2` | [createCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-v2/) | §17 |
| `createCustomerAddress` | [createCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-address/) | §18 |
| `createCustomer` | [createCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create/) | §19 |
| `confirmEmail` | [confirmEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/confirm-email/) | §20 |
| `changeCustomerPassword` | [changeCustomerPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/change-password/) | §21 |
| `assignCompareListToCustomer` | [assignCompareListToCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/assign-compare-list/) | §22 |
| `updateCustomerV2` | [updateCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-v2/) | §23 |
| `updateCustomerEmail` | [updateCustomerEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-email/) | §24 |
| `updateCustomerAddressV2` | [updateCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address-v2/) | §25 |
| `updateCustomerAddress` | [updateCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address/) | §26 |
| `updateCustomer` | [updateCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update/) | §27 |
| `subscribeEmailToNewsletter` | [subscribeEmailToNewsletter](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/subscribe-email-to-newsletter/) | §28 |
| `sendEmailToFriend` | [sendEmailToFriend](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/send-email-to-friend/) | §29 |
| `revokeCustomerToken` | [revokeCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/revoke-token/) | §30 |
| `resetPassword` | [resetPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/reset-password/) | §31 |
| `resendConfirmationEmail` | [resendConfirmationEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/resend-confirmation-email/) | §32 |
| `requestPasswordResetEmail` | [requestPasswordResetEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/request-password-reset-email/) | §33 |
| `generateCustomerTokenAsAdmin` | [generateCustomerTokenAsAdmin](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token-as-admin/) | §34 |

---

## 12. `generateCustomerToken`

Nguồn: [generateCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token/)

- Tạo customer token để gọi các query/mutation cần đăng nhập.
- Doc mới ghi **SaaS only** và có luồng Login as Customer bằng OTC (one-time code) từ Admin/REST.
- `password` có thể là mật khẩu account, reset token một lần, hoặc OTC admin (tuỳ ngữ cảnh và cấu hình).
- Cú pháp: `generateCustomerToken(email: String!, password: String!): CustomerToken`

---

## 13. `exchangeOtpForCustomerToken`

Nguồn: [exchangeOtpForCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-otp-customer-token/)

- **SaaS only**. Đổi OTP (gửi qua email/phone) lấy customer token.
- OTP bị invalidate ngay sau khi exchange thành công; mutation có tích hợp kiểm soát reCAPTCHA để hạn chế abuse.
- Cú pháp: `exchangeOtpForCustomerToken(email: String!, otp: String!): CustomerToken`

---

## 14. `exchangeExternalCustomerToken`

Nguồn: [exchangeExternalCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-external-customer-token/)

- Thuộc **Storefront Compatibility Package**; doc ghi sẽ thêm vào Adobe Commerce 2.4.9.
- Dùng cho social/external login qua App Builder; nếu customer chưa tồn tại có thể được tạo mới rồi trả về token.
- Yêu cầu tích hợp external auth đã cấu hình (Adobe mô tả OAuth 1.0 integration credentials).
- Cú pháp: `exchangeExternalCustomerToken(input: ExchangeExternalCustomerTokenInput!): ExchangeExternalCustomerTokenOutput`

---

## 15. `deleteCustomerAddressV2`

Nguồn: [deleteCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address-v2/)

- **SaaS only** trong doc và thuộc **Storefront Compatibility Package** (2.4.9).
- Xóa địa chỉ theo `uid: ID!`, trả về `Boolean`.
- Không xóa được địa chỉ đang là default billing/shipping.
- Cần customer đang đăng nhập (khuyến nghị dùng customer token).
- Cú pháp: `deleteCustomerAddressV2(uid: ID!): Boolean`

---

## 16. `deleteCustomerAddress`

Nguồn: [deleteCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address/)

- Mutation cũ, đã **deprecated** trên SaaS và sẽ deprecated trong Adobe Commerce 2.4.9.
- Dùng `id: Int!` (thay vì `uid`) để xóa địa chỉ, trả `Boolean`.
- Adobe khuyến nghị chuyển sang `deleteCustomerAddressV2`.
- Cú pháp: `deleteCustomerAddress(id: Int!): Boolean`

---

## 17. `createCustomerV2`

Nguồn: [createCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-v2/)

- Là mutation được khuyến nghị để tạo account customer mới (thay cho `createCustomer`).
- Dùng input `CustomerCreateInput` (tách biệt rõ ràng với update flow), hỗ trợ `custom_attributes` từ 2.4.7.
- Có cảnh báo bảo mật/pháp lý khi lưu đủ ngày sinh (`date_of_birth`) cùng dữ liệu định danh.
- Cú pháp: `createCustomerV2(input: CustomerCreateInput!): CustomerOutput`

---

## 18. `createCustomerAddress`

Nguồn: [createCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-address/)

- Tạo địa chỉ cho customer đang đăng nhập.
- Hỗ trợ gán `custom_attributesV2`; doc cũng có ví dụ address kèm file attribute (**SaaS only**).
- Lỗi phổ biến: thiếu field bắt buộc (như `firstname`) hoặc `street` vượt số dòng cho phép.
- Cú pháp: `createCustomerAddress(input: CustomerAddressInput!): CustomerAddress`

---

## 19. `createCustomer`

Nguồn: [createCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create/)

- Mutation tạo customer phiên bản cũ (**PaaS only** theo badge trang hiện tại).
- Adobe khuyến nghị dùng `createCustomerV2` cho flow mới.
- Vẫn cần lưu ý bảo mật khi truyền/lưu `date_of_birth`.
- Cú pháp: `createCustomer(input: CustomerInput!): CustomerOutput`

---

## 20. `confirmEmail`

Nguồn: [confirmEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/confirm-email/)

- Hoàn tất kích hoạt account bằng `email` + `confirmation_key`.
- Dùng khi store bật xác thực email account sau đăng ký.
- Lỗi thường gặp: token xác nhận không hợp lệ hoặc account đã active.
- Cú pháp: `confirmEmail(input: ConfirmEmailInput!): CustomerOutput`

---

## 21. `changeCustomerPassword`

Nguồn: [changeCustomerPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/change-password/)

- Đổi mật khẩu cho customer đang đăng nhập.
- Yêu cầu `currentPassword` đúng và `newPassword` hợp lệ; account lock sẽ không đổi được.
- Cần context authenticated customer (token/session hợp lệ).
- Cú pháp: `changeCustomerPassword(currentPassword: String!, newPassword: String!): Customer`

---

## 22. `assignCompareListToCustomer`

Nguồn: [assignCompareListToCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/assign-compare-list/)

- Gán compare list tạo lúc guest cho customer đã đăng nhập.
- Hữu ích sau flow guest browsing -> login.
- Bắt buộc có customer auth token hợp lệ.
- Cú pháp: `assignCompareListToCustomer(uid: ID!): AssignCompareListToCustomerOutput`

---

## 23. `updateCustomerV2`

Nguồn: [updateCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-v2/)

- Mutation cập nhật profile customer được Adobe khuyến nghị dùng thay `updateCustomer`.
- Dùng input `CustomerUpdateInput`; hỗ trợ `custom_attributes` (2.4.7+) cho các thuộc tính mở rộng.
- Email update nên tách riêng qua `updateCustomerEmail`.
- Cú pháp: `updateCustomerV2(input: CustomerUpdateInput!): CustomerOutput`

---

## 24. `updateCustomerEmail`

Nguồn: [updateCustomerEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-email/)

- Đổi email của customer đang đăng nhập.
- Yêu cầu cung cấp `password` hiện tại để xác nhận thao tác đổi email.
- Áp dụng cho SaaS/PaaS theo badge trang mutation.
- Cú pháp: `updateCustomerEmail(email: String!, password: String!): CustomerOutput`

---

## 25. `updateCustomerAddressV2`

Nguồn: [updateCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address-v2/)

- **SaaS only** và thuộc **Storefront Compatibility Package** (bổ sung cho 2.4.9 theo doc).
- Dùng `uid: ID!` để cập nhật địa chỉ, thay cho biến thể cũ theo `id: Int!`.
- Hỗ trợ `custom_attributesV2` trên địa chỉ.
- Cú pháp: `updateCustomerAddressV2(uid: ID!, input: CustomerAddressInput): CustomerAddress`

---

## 26. `updateCustomerAddress`

Nguồn: [updateCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address/)

- Mutation cũ để cập nhật địa chỉ theo `id: Int!`.
- Đã **deprecated** trên SaaS và sẽ deprecated trong Adobe Commerce 2.4.9.
- Adobe khuyến nghị chuyển sang `updateCustomerAddressV2`.
- Cú pháp: `updateCustomerAddress(id: Int!, input: CustomerAddressInput): CustomerAddress`

---

## 27. `updateCustomer`

Nguồn: [updateCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update/)

- Mutation cũ để cập nhật thông tin cá nhân customer (**PaaS only** theo badge trang hiện tại).
- Nếu đổi email qua mutation này có thể cần cung cấp password hiện tại; để rõ ràng nên dùng `updateCustomerEmail`.
- Adobe khuyến nghị dùng `updateCustomerV2`.
- Cú pháp: `updateCustomer(input: CustomerInput!): CustomerOutput`

---

## 28. `subscribeEmailToNewsletter`

Nguồn: [subscribeEmailToNewsletter](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/subscribe-email-to-newsletter/)

- Cho phép guest hoặc customer đăng ký newsletter (phụ thuộc cấu hình Allow Guest Subscription).
- Trả trạng thái subscription (`NOT_ACTIVE` hoặc `SUBSCRIBED`).
- Lỗi thường gặp: email sai format, email đã subscribed, hoặc guest subscription bị tắt.
- Cú pháp: `subscribeEmailToNewsletter(email: String!): SubscribeEmailToNewsletterOutput`

---

## 29. `sendEmailToFriend`

Nguồn: [sendEmailToFriend](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/send-email-to-friend/)

- **PaaS only** theo badge trang hiện tại.
- Gửi email giới thiệu sản phẩm cho danh sách người nhận; phụ thuộc cấu hình **Catalog > Email to a friend** trong Admin.
- Có giới hạn tần suất gửi theo cấu hình và có thể bật/tắt cho guest.
- Cú pháp: `sendEmailToFriend(input: SendEmailToFriendInput): SendEmailToFriendOutput`

---

## 30. `revokeCustomerToken`

Nguồn: [revokeCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/revoke-token/)

- Thu hồi token hiện tại của customer (logout token-level).
- Cần customer đang authenticated; response phổ biến chứa `result: true`.
- Dùng kèm flow tạo token (`generateCustomerToken`, `generateCustomerTokenAsAdmin`) để quản trị phiên.
- Cú pháp: `revokeCustomerToken: RevokeCustomerTokenOutput`

---

## 31. `resetPassword`

Nguồn: [resetPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/reset-password/)

- Đặt mật khẩu mới bằng `email` + `resetPasswordToken` + `newPassword`.
- Thường đi sau `requestPasswordResetEmail`; token lấy từ link reset gửi qua email.
- Trả `Boolean`; chịu ràng buộc password policy và trạng thái account lock.
- Cú pháp: `resetPassword(email: String!, resetPasswordToken: String!, newPassword: String!): Boolean`

---

## 32. `resendConfirmationEmail`

Nguồn: [resendConfirmationEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/resend-confirmation-email/)

- Gửi lại email xác nhận cho account chưa active.
- Trả `Boolean` cho kết quả xử lý.
- Lỗi thường gặp: email không tồn tại hoặc account đã xác nhận nên không cần gửi lại.
- Cú pháp: `resendConfirmationEmail(email: String!): Boolean`

---

## 33. `requestPasswordResetEmail`

Nguồn: [requestPasswordResetEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/request-password-reset-email/)

- Khởi tạo luồng quên mật khẩu và gửi email chứa reset link/token.
- Trả `Boolean`; nếu thành công mới nên tiếp tục gọi `resetPassword`.
- Lỗi phổ biến: email rỗng/sai format hoặc account đang locked.
- Cú pháp: `requestPasswordResetEmail(email: String!): Boolean`

---

## 34. `generateCustomerTokenAsAdmin`

Nguồn: [generateCustomerTokenAsAdmin](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token-as-admin/)

- Tạo customer token từ ngữ cảnh admin để hỗ trợ **remote shopping assistance**.
- Chỉ dùng được khi customer bật `allow_remote_shopping_assistance`.
- Hữu ích cho support flow thao tác thay mặt customer (ví dụ thêm sản phẩm vào cart).
- Cú pháp: `generateCustomerTokenAsAdmin(input: GenerateCustomerTokenAsAdminInput!): GenerateCustomerTokenAsAdminOutput`

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Nhóm Cart / Checkout: [`schema-cart.md`](./schema-cart.md), [`schema-checkout.md`](./schema-checkout.md)
- Nhóm B2B Company: [`schema-b2b-company.md`](./schema-b2b-company.md)
