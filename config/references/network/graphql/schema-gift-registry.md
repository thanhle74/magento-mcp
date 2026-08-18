# GraphQL — Schema (Guide): Gift registry (queries + mutations)

Tóm tắt nhóm **Gift registry** trên Adobe Commerce, gồm **queries + mutations** để tra cứu, tạo/chia sẻ, cập nhật, và dọn dữ liệu gift registry. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Gift registry (nhóm schema)

Nguồn: [Gift registry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/)

- Đây là nhóm tính năng **Adobe Commerce only** (exclusive feature), không có trong Magento Open Source mặc định.
- Luồng nghiệp vụ chính: customer tạo registry cho sự kiện, chia sẻ, rồi người nhận lời mời mua quà trực tiếp từ registry.
- Cần bật/cấu hình Gift Registry trong Admin trước khi dùng thực tế storefront.

---

## 2. Gift registry — danh sách queries (mục lục)

Nguồn: [Gift registry queries](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `giftRegistry` | [giftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/gift-registry/) | §3 |
| `giftRegistryTypeSearch` | [giftRegistryTypeSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/type-search/) | §4 |
| `giftRegistryTypes` | [giftRegistryTypes](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/types/) | §5 |
| `giftRegistryIdSearch` | [giftRegistryIdSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/id-search/) | §6 |
| `giftRegistryEmailSearch` | [giftRegistryEmailSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/email-search/) | §7 |

---

## 3. `giftRegistry`

Nguồn: [giftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/gift-registry/)

- Trả chi tiết một gift registry theo `uid`.
- Query này yêu cầu **customer authentication token** hợp lệ.
- Có thể lấy danh sách `uid` hợp lệ từ các query customer liên quan.
- Cú pháp guide: `giftRegistry(uid: ID!): GiftRegistry`

---

## 4. `giftRegistryTypeSearch`

Nguồn: [giftRegistryTypeSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/type-search/)

- Tìm danh sách gift registry theo tên registrant (`firstName`, `lastName`) và có thể lọc thêm theo `giftRegistryTypeUid`.
- Hữu ích cho flow search nâng cao trên storefront.
- Có thể gọi `giftRegistryTypes` trước để lấy danh sách type UIDs hợp lệ.
- Cú pháp guide: `giftRegistryTypeSearch(firstName: String!, lastName: String!, giftRegistryTypeUid: String): [GiftRegistrySearchResult]`

---

## 5. `giftRegistryTypes`

Nguồn: [giftRegistryTypes](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/types/)

- Trả danh sách loại gift registry khả dụng (Birthday, Wedding, ...).
- Trả kèm `dynamic_attributes_metadata` để dựng form theo từng loại sự kiện.
- Thường dùng làm bước bootstrap trước khi gọi search/query chi tiết.
- Cú pháp guide: `giftRegistryTypes: [GiftRegistryType]`

---

## 6. `giftRegistryIdSearch`

Nguồn: [giftRegistryIdSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/id-search/)

- Tìm gift registry theo `giftRegistryUid` (ID thường xuất hiện trong email mời).
- Trả mảng kết quả `GiftRegistrySearchResult` để hiển thị nhanh thông tin sự kiện/owner/type.
- Phù hợp cho flow người nhận nhập mã registry.
- Cú pháp guide: `giftRegistryIdSearch(giftRegistryUid: String!): [GiftRegistrySearchResult]`

---

## 7. `giftRegistryEmailSearch`

Nguồn: [giftRegistryEmailSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/email-search/)

- Tìm gift registry theo email **registrant** (không phải owner email theo ghi chú Adobe).
- Trả mảng `GiftRegistrySearchResult` cho danh sách registry khớp email.
- Phù hợp cho search form theo email trên storefront.
- Cú pháp guide: `giftRegistryEmailSearch(email: String!): [GiftRegistrySearchResult]`

---

## 8. Gift registry — danh sách mutations (mục lục)

Nguồn: [Gift registry mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/)

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `updateGiftRegistryRegistrants` | [updateGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-registrants/) | §9 |
| `updateGiftRegistryItems` | [updateGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-items/) | §10 |
| `updateGiftRegistry` | [updateGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update/) | §11 |
| `shareGiftRegistry` | [shareGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/share/) | §12 |
| `removeGiftRegistryRegistrants` | [removeGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-registrants/) | §13 |
| `removeGiftRegistryItems` | [removeGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-items/) | §14 |
| `removeGiftRegistry` | [removeGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove/) | §15 |
| `moveCartItemsToGiftRegistry` | [moveCartItemsToGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/move-cart-items/) | §16 |
| `createGiftRegistry` | [createGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/create/) | §17 |
| `addGiftRegistryRegistrants` | [addGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/add-registrants/) | §18 |

---

## 9. `updateGiftRegistryRegistrants`

Nguồn: [updateGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-registrants/)

- Cập nhật thông tin một hoặc nhiều registrant trong gift registry.
- Bắt buộc customer auth token hợp lệ.
- Thường dùng để đổi email/tên registrant mà không chạm vào items.
- Cú pháp: `updateGiftRegistryRegistrants(giftRegistryUid: ID!, registrants: [UpdateGiftRegistryRegistrantInput!]!): UpdateGiftRegistryRegistrantsOutput`

---

## 10. `updateGiftRegistryItems`

Nguồn: [updateGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-items/)

- Cập nhật số lượng (`quantity`) và ghi chú (`note`) cho item trong registry.
- Bắt buộc customer auth token hợp lệ.
- Chỉ cập nhật items, không thay đổi metadata/registrants của registry.
- Cú pháp: `updateGiftRegistryItems(giftRegistryUid: ID!, items: [UpdateGiftRegistryItemInput!]!): UpdateGiftRegistryItemsOutput`

---

## 11. `updateGiftRegistry`

Nguồn: [updateGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update/)

- Cập nhật thuộc tính registry (privacy, message, dynamic attributes, ...).
- Không cập nhật items/registrants (dùng mutation riêng cho hai nhánh này).
- Bắt buộc customer auth token hợp lệ.
- Cú pháp: `updateGiftRegistry(giftRegistryUid: ID!, giftRegistry: UpdateGiftRegistryInput!): UpdateGiftRegistryOutput`

---

## 12. `shareGiftRegistry`

Nguồn: [shareGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/share/)

- Gửi lời mời tới danh sách invitees để mua quà từ gift registry.
- Yêu cầu `sender` + danh sách `invitees` và customer token hợp lệ.
- Hữu ích cho flow chia sẻ sau khi tạo registry.
- Cú pháp: `shareGiftRegistry(giftRegistryUid: ID!, sender: ShareGiftRegistrySenderInput!, invitees: [ShareGiftRegistryInviteeInput!]!): ShareGiftRegistryOutput`

---

## 13. `removeGiftRegistryRegistrants`

Nguồn: [removeGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-registrants/)

- Xóa một hoặc nhiều registrant khỏi registry theo `registrantsUid`.
- Bắt buộc customer auth token hợp lệ.
- Chỉ tác động danh sách registrants, không xóa registry/items.
- Cú pháp: `removeGiftRegistryRegistrants(giftRegistryUid: ID!, registrantsUid: [ID!]!): RemoveGiftRegistryRegistrantsOutput`

---

## 14. `removeGiftRegistryItems`

Nguồn: [removeGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-items/)

- Xóa một hoặc nhiều item khỏi registry theo `itemsUid`.
- Bắt buộc customer auth token hợp lệ.
- Dùng để dọn danh sách quà mà không cần sửa/đóng registry.
- Cú pháp: `removeGiftRegistryItems(giftRegistryUid: ID!, itemsUid: [ID!]!): RemoveGiftRegistryItemsOutput`

---

## 15. `removeGiftRegistry`

Nguồn: [removeGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove/)

- Xóa toàn bộ gift registry khỏi danh sách của customer.
- Bắt buộc customer auth token hợp lệ.
- Output thường trả cờ thành công (`success`) trong payload output object.
- Cú pháp guide: `removeGiftRegistry(giftRegistryUid: ID!): RemoveGiftRegistryOutput`

---

## 16. `moveCartItemsToGiftRegistry`

Nguồn: [moveCartItemsToGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/move-cart-items/)

- Chuyển toàn bộ items từ cart vào gift registry chỉ định.
- Bắt buộc customer auth token hợp lệ.
- Output có `status` + `user_errors` để xử lý từng lỗi item nếu có.
- Cú pháp: `moveCartItemsToGiftRegistry(cartUid: ID!, giftRegistryUid: ID!): MoveCartItemsToGiftRegistryOutput`

---

## 17. `createGiftRegistry`

Nguồn: [createGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/create/)

- Tạo gift registry mới cho customer đang đăng nhập.
- `dynamic_attributes` dùng code-value pair; shipping address chỉ truyền một trong `address_data` hoặc `address_id`.
- Bắt buộc customer auth token hợp lệ; một số output field nhạy cảm chỉ owner thấy.
- Cú pháp: `createGiftRegistry(giftRegistry: CreateGiftRegistryInput!): CreateGiftRegistryOutput`

---

## 18. `addGiftRegistryRegistrants`

Nguồn: [addGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/add-registrants/)

- Thêm một hoặc nhiều registrant vào gift registry.
- Bắt buộc customer auth token hợp lệ.
- Hữu ích khi mở rộng danh sách người được liên kết với sự kiện.
- Cú pháp: `addGiftRegistryRegistrants(giftRegistryUid: ID!, registrants: [AddGiftRegistryRegistrantInput!]!): AddGiftRegistryRegistrantsOutput`

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Nhóm Customer: [`schema-customer.md`](./schema-customer.md)
- Nhóm Cart / Checkout: [`schema-cart.md`](./schema-cart.md), [`schema-checkout.md`](./schema-checkout.md)
