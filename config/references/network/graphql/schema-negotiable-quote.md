# GraphQL — Schema (Guide): Negotiable quotes (B2B) (queries)

Tóm tắt nhóm **Negotiable quotes (B2B)** trên Adobe: đây là nhóm query phục vụ luồng báo giá đàm phán giữa buyer (company user) và seller (merchant). File này tổng hợp phần **queries** theo các link Adobe bạn gửi. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Negotiable quotes (B2B) (nhóm schema)

Nguồn: [Negotiable quote (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/)

- Đây là tính năng **Adobe Commerce exclusive** dành cho luồng báo giá B2B.
- GraphQL trong nhóm này chủ yếu bao phủ hành động của **buyer**; hành động phía seller có thể cần REST API theo Adobe.
- Luồng cơ bản: buyer tạo yêu cầu báo giá từ cart -> seller phản hồi/đàm phán -> buyer chốt và checkout theo điều khoản đã thống nhất.

---

## 2. Negotiable quotes (B2B) — danh sách queries (mục lục)

Nguồn: [Negotiable quote (B2B) queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `negotiableQuote` | [negotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quote/) | §3 |
| `negotiableQuotes` | [negotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quotes/) | §4 |
| `negotiableQuoteTemplates` | [negotiableQuoteTemplates](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/templates/) | §5 |

---

## 3. `negotiableQuote`

Nguồn: [negotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quote/)

- Trả chi tiết một negotiable quote theo `uid`.
- Query này yêu cầu **customer authentication token** hợp lệ.
- Adobe gợi ý lấy danh sách `uid` hợp lệ thông qua query `negotiableQuotes`.
- Cú pháp (theo doc): `negotiableQuote(uid: ID!): NegotiableQuote`

---

## 4. `negotiableQuotes`

Nguồn: [negotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quotes/)

- Trả danh sách các quote buyer được phép xem (bao gồm quote do user tạo hoặc do subordinate trong company hierarchy tạo).
- Hỗ trợ filter theo `name`/`uid` và phân trang (`pageSize`, `currentPage`).
- Query này yêu cầu **customer authentication token** hợp lệ.
- Cú pháp (theo doc): `negotiableQuotes(filter: NegotiableQuoteFilterInput, pageSize: Int = 20, currentPage: Int = 1): NegotiableQuotesOutput`
- Ghi chú: một số ví dụ attachment trong comments được đánh dấu **SaaS only**.

---

## 5. `negotiableQuoteTemplates`

Nguồn: [negotiableQuoteTemplates](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/templates/)

- Trả danh sách quote templates mà buyer được phép xem.
- Hỗ trợ filter, phân trang, và `sort` qua `NegotiableQuoteTemplateSortInput`.
- Query này yêu cầu **customer authentication token** hợp lệ.
- Cú pháp (theo doc): `negotiableQuoteTemplates(filter: NegotiableQuoteTemplateFilterInput, pageSize: Int = 20, currentPage: Int = 1, sort: NegotiableQuoteTemplateSortInput): NegotiableQuoteTemplatesOutput`

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Company (B2B): [`schema-company.md`](./schema-company.md)
- Cart: [`schema-cart.md`](./schema-cart.md)
- Checkout: [`schema-checkout.md`](./schema-checkout.md)
