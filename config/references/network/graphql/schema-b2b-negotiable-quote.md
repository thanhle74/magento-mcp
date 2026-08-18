# GraphQL — Schema (Guide): Negotiable quotes (B2B) (queries + mutations + interfaces + unions)

Tóm tắt nhóm **Negotiable quotes (B2B)** trên Adobe Commerce, gồm **queries + mutations + interfaces + unions** cho buyer-side negotiation flow. Đây là tính năng **Adobe Commerce only** (B2B). Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Negotiable quotes (B2B) (nhóm schema)

Nguồn: [Negotiable quote (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/)

- Đây là luồng đàm phán giá/điều khoản giữa buyer (company user) và seller.
- GraphQL phía Adobe tập trung vào **buyer actions**; nhiều seller actions thường tích hợp qua REST.
- Query/mutation của domain này yêu cầu module B2B và quyền tương ứng theo company role.

---

## 2. Negotiable quotes (B2B) — danh sách queries (mục lục)

Nguồn: [Negotiable quote queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `negotiableQuote` | [negotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quote/) | §3 |
| `negotiableQuotes` | [negotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quotes/) | §4 |
| `negotiableQuoteTemplates` | [negotiableQuoteTemplates](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/templates/) | §5 |

---

## 3. `negotiableQuote`

Nguồn: [negotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quote/)

- Trả chi tiết một negotiable quote theo `uid`.
- Dùng `negotiableQuotes` để lấy danh sách `uid` hợp lệ trước khi query chi tiết.
- Yêu cầu **valid customer authentication token**.
- Cú pháp guide: `negotiableQuote(uid: ID!): NegotiableQuote`

---

## 4. `negotiableQuotes`

Nguồn: [negotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quotes/)

- Trả danh sách quote mà customer hiện tại được phép xem (bao gồm quote của subordinates trong company hierarchy).
- Hỗ trợ lọc (`filter`) và phân trang (`pageSize`, `currentPage`).
- Có thể lấy kèm comments/attachments (một số ví dụ attachment là SaaS-only trong doc).
- Cú pháp guide: `negotiableQuotes(filter: NegotiableQuoteFilterInput, pageSize: Int = 20, currentPage: Int = 1): NegotiableQuotesOutput`

---

## 5. `negotiableQuoteTemplates`

Nguồn: [negotiableQuoteTemplates](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/templates/)

- Trả danh sách quote templates khả dụng cho customer hiện tại (bao gồm template của subordinates nếu có quyền).
- Hỗ trợ `filter`, `sort`, và phân trang (`page_info`, `sort_fields` trong output).
- Yêu cầu **valid customer authentication token**.
- Cú pháp guide: `negotiableQuoteTemplates(filter: NegotiableQuoteTemplateFilterInput, pageSize: Int = 20, currentPage: Int = 1, sort: NegotiableQuoteTemplateSortInput): NegotiableQuoteTemplatesOutput`

---

## 6. Negotiable quotes (B2B) — danh sách mutations (mục lục)

Nguồn: [Negotiable quote mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/)

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `updateNegotiableQuoteQuantities` | [updateNegotiableQuoteQuantities](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/update-quantities/) | §7 |
| `setQuoteTemplateExpirationDate` | [setQuoteTemplateExpirationDate](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-quote-template-expiration-date/) | §8 |
| `setNegotiableQuoteShippingMethods` | [setNegotiableQuoteShippingMethods](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-methods/) | §9 |
| `setNegotiableQuoteShippingAddress` | [setNegotiableQuoteShippingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-address/) | §10 |
| `setNegotiableQuotePaymentMethod` | [setNegotiableQuotePaymentMethod](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-payment-method/) | §11 |
| `setNegotiableQuoteBillingAddress` | [setNegotiableQuoteBillingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-billing-address/) | §12 |
| `sendNegotiableQuoteForReview` | [sendNegotiableQuoteForReview](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/send-for-review/) | §13 |
| `requestNegotiableQuote` | [requestNegotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/request/) | §14 |
| `removeNegotiableQuoteItems` | [removeNegotiableQuoteItems](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/remove-items/) | §15 |
| `placeNegotiableQuoteOrderV2` | [placeNegotiableQuoteOrderV2](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order-v2/) | §16 |
| `placeNegotiableQuoteOrder` | [placeNegotiableQuoteOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order/) | §17 |
| `deleteNegotiableQuotes` | [deleteNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/delete/) | §18 |
| `closeNegotiableQuotes` | [closeNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/close/) | §19 |

---

## 7. `updateNegotiableQuoteQuantities`

Nguồn: [updateNegotiableQuoteQuantities](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/update-quantities/)

- Cập nhật số lượng một hoặc nhiều item trong negotiable quote đang hoạt động.
- Muốn xóa hẳn sản phẩm thì dùng `removeNegotiableQuoteItems`.
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `updateNegotiableQuoteQuantities(input: UpdateNegotiableQuoteQuantitiesInput!): UpdateNegotiableQuoteItemsQuantityOutput`

---

## 8. `setQuoteTemplateExpirationDate`

Nguồn: [setQuoteTemplateExpirationDate](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-quote-template-expiration-date/)

- Đặt ngày hết hạn cho quote template (`template_id` + `expiration_date`).
- Thuộc **B2B Storefront Compatibility Package** và theo doc là **SaaS-only**.
- Dùng cho nhánh quản lý quote templates.
- Cú pháp: `setQuoteTemplateExpirationDate(input: QuoteTemplateExpirationDateInput!): NegotiableQuoteTemplate`

---

## 9. `setNegotiableQuoteShippingMethods`

Nguồn: [setNegotiableQuoteShippingMethods](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-methods/)

- Gán một hoặc nhiều shipping methods cho negotiable quote.
- Quote cần ở trạng thái `UPDATED` để set shipping thành công.
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `setNegotiableQuoteShippingMethods(input: SetNegotiableQuoteShippingMethodsInput!): SetNegotiableQuoteShippingMethodsOutput`

---

## 10. `setNegotiableQuoteShippingAddress`

Nguồn: [setNegotiableQuoteShippingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-address/)

- Gán địa chỉ giao hàng cho quote (chọn từ address book hoặc truyền địa chỉ mới).
- Quote phải ở trạng thái `UPDATED`.
- Có thể lấy danh sách address hợp lệ qua `company` query với input `user`.
- Cú pháp: `setNegotiableQuoteShippingAddress(input: SetNegotiableQuoteShippingAddressInput!): SetNegotiableQuoteShippingAddressOutput`

---

## 11. `setNegotiableQuotePaymentMethod`

Nguồn: [setNegotiableQuotePaymentMethod](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-payment-method/)

- Đặt phương thức thanh toán cho quote (online/offline methods theo cấu hình store).
- Quote phải ở trạng thái `UPDATED`.
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `setNegotiableQuotePaymentMethod(input: SetNegotiableQuotePaymentMethodInput!): SetNegotiableQuotePaymentMethodOutput`

---

## 12. `setNegotiableQuoteBillingAddress`

Nguồn: [setNegotiableQuoteBillingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-billing-address/)

- Gán địa chỉ thanh toán cho quote (address book hoặc địa chỉ mới).
- Quote phải ở trạng thái `UPDATED`.
- Có thể lấy billing addresses hợp lệ qua `company` query với input `user`.
- Cú pháp: `setNegotiableQuoteBillingAddress(input: SetNegotiableQuoteBillingAddressInput!): SetNegotiableQuoteBillingAddressOutput`

---

## 13. `sendNegotiableQuoteForReview`

Nguồn: [sendNegotiableQuoteForReview](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/send-for-review/)

- Gửi quote sang seller để review; buyer không sửa được quote cho tới khi seller phản hồi.
- Có thể gửi kèm comment trong payload.
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `sendNegotiableQuoteForReview(input: SendNegotiableQuoteForReviewInput!): SendNegotiableQuoteForReviewOutput`

---

## 14. `requestNegotiableQuote`

Nguồn: [requestNegotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/request/)

- Khởi tạo yêu cầu negotiable quote từ cart hiện có của company user.
- Sau khi submit, quote có trạng thái `SUBMITTED`; cart ID gắn với vòng đời quote đó.
- Có thể gửi attachment trong comment (SaaS flow cần upload file trước).
- Cú pháp: `requestNegotiableQuote(input: RequestNegotiableQuoteInput!): RequestNegotiableQuoteOutput`

---

## 15. `removeNegotiableQuoteItems`

Nguồn: [removeNegotiableQuoteItems](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/remove-items/)

- Xóa các sản phẩm chỉ định khỏi negotiable quote.
- Nếu xóa item cuối, quote vào terminal state: không thêm item/cập nhật quantity được nữa (chỉ close/delete).
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `removeNegotiableQuoteItems(input: RemoveNegotiableQuoteItemsInput!): RemoveNegotiableQuoteItemsOutput`

---

## 16. `placeNegotiableQuoteOrderV2`

Nguồn: [placeNegotiableQuoteOrderV2](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order-v2/)

- Convert negotiable quote thành order và trả `order` object (kèm `errors`).
- Theo doc: thuộc Storefront Compatibility Package và **SaaS-only**.
- Trạng thái quote hợp lệ để place order: `SUBMITTED`, `DECLINED`, `EXPIRED`.
- Cú pháp: `placeNegotiableQuoteOrderV2(input: PlaceNegotiableQuoteOrderInput): PlaceNegotiableQuoteOrderOutputV2`

---

## 17. `placeNegotiableQuoteOrder`

Nguồn: [placeNegotiableQuoteOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order/)

- Mutation cũ để convert quote thành order; trên Adobe Commerce Cloud Service đã deprecated.
- Adobe khuyến nghị dùng `placeNegotiableQuoteOrderV2`.
- Trạng thái hợp lệ tương tự: `SUBMITTED`, `DECLINED`, `EXPIRED`.
- Cú pháp: `placeNegotiableQuoteOrder(input: PlaceNegotiableQuoteOrderInput): PlaceNegotiableQuoteOrderOutput`

---

## 18. `deleteNegotiableQuotes`

Nguồn: [deleteNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/delete/)

- Đánh dấu quote “invisible” trên Admin/storefront (quote vẫn còn trong DB).
- Chạy được với nhiều trạng thái: `SUBMITTED`, `UPDATED`, `OPEN`, `CLOSED`, `DECLINED`, `EXPIRED`.
- Kết quả dùng union `DeleteNegotiableQuoteOperationResult` + error union `DeleteNegotiableQuoteError`.
- Cú pháp: `deleteNegotiableQuotes(input: DeleteNegotiableQuotesInput!): DeleteNegotiableQuotesOutput`

---

## 19. `closeNegotiableQuotes`

Nguồn: [closeNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/close/)

- Đóng quote đang active; quote đã đóng không mở lại được.
- Kết quả chi tiết qua union `CloseNegotiableQuoteOperationResult`; lỗi qua `CloseNegotiableQuoteError`.
- Yêu cầu customer auth token hợp lệ.
- Cú pháp: `closeNegotiableQuotes(input: CloseNegotiableQuotesInput!): CloseNegotiableQuotesOutput`

---

## 20. Negotiable quotes (B2B) — interfaces

Nguồn: [Negotiable quote interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/interfaces/)

- `NegotiableQuoteAddressInterface`: abstraction cho địa chỉ quote; implementations: `NegotiableQuoteShippingAddress`, `NegotiableQuoteBillingAddress`.
- `NegotiableQuoteUidNonFatalResultInterface`: abstraction cho operation result không fatal theo quote UID; implementation chính: `NegotiableQuoteUidOperationSuccess`.

---

## 21. Negotiable quotes (B2B) — unions

Nguồn: [Negotiable quote unions](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/unions/)

- `CloseNegotiableQuoteError`: lỗi khi close quote (ví dụ `InternalError`, `NegotiableQuoteInvalidStateError`, `NoSuchEntityUidError`).
- `CloseNegotiableQuoteOperationResult`: union kết quả close (`CloseNegotiableQuoteOperationFailure` hoặc `NegotiableQuoteUidOperationSuccess`).
- `DeleteNegotiableQuoteError`: lỗi khi delete quote (các nhóm lỗi tương tự close).
- `DeleteNegotiableQuoteOperationResult`: union kết quả delete (`DeleteNegotiableQuoteOperationFailure` hoặc `NegotiableQuoteUidOperationSuccess`).
- `CompanyStructureEntity` cũng xuất hiện trong trang unions tổng, nhưng đã được tóm tắt ở file Company B2B.

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Nhóm B2B Company: [`schema-b2b-company.md`](./schema-b2b-company.md)
- Nhóm Cart / Checkout: [`schema-cart.md`](./schema-cart.md), [`schema-checkout.md`](./schema-checkout.md)
