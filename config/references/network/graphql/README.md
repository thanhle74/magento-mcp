# GraphQL — Web API (Adobe Commerce)

Tài liệu gốc nằm trên **Adobe Developer — Commerce Web APIs → GraphQL**. Trong spec này, toàn bộ mục **Usage** (endpoint, token, cache, filter, response, headers, introspection, protected mutations, security, staging) gom tại [`usage.md`](./usage.md); **Reference** schema theo phiên bản tại [`reference.md`](./reference.md); **Release Notes** tại `release-notes.md`; nhóm **Tutorial** (checkout 10 bước) tại [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md). Nhánh **Schema (guide)** — mục lục query/mutation theo domain trên Adobe — định tuyến đầy đủ theo **bảng bên dưới**: mỗi nhóm một file `schema-*.md`, bên trong là bảng mục lục + chi tiết từng query/mutation.

Nhánh **Development** (định nghĩa `schema.graphqls`, resolver/batch resolver, mở rộng schema, Identity/cache tag, urlResolver tùy chỉnh, debug, exception, functional test): [`development.md`](./development.md).  
**App Server / resolver stateless** (ràng buộc khi chạy long-lived PHP): [`../graphql-app-server.md`](../graphql-app-server.md) — bổ sung cho doc Adobe, không thay thế.

---

## Phiên bản (align với project)

- Constitution: **Magento 2.4.8** → khi tra **GraphQL API reference**, chọn bản **2.4.8** (PaaS / Magento Open Source / Adobe Commerce on-prem), không nhầm với chỉ **SaaS** nếu bạn không dùng stack đó.

---

## Định tuyến nhóm (Schema guide + Development + Tutorial)

> Các bảng per-mutation/per-query từng nằm ở đây đã dời hết về đúng file nhóm bên trong (mỗi mutation một mục với mục đích, input, output, lưu ý). Bảng này chỉ giữ định tuyến cấp nhóm.

| Nhóm | File trong `.spec` | Phạm vi mục lục | Adobe (chính thức) |
|---|---|---|---|
| Reference schema (queries/mutations theo bản) | [`reference.md`](./reference.md) | toàn file | [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) |
| Usage (endpoint, token, cache, filter, response, headers, introspection, protected mutations, security, staging) | [`usage.md`](./usage.md) | §1–§10 | [GraphQL — Usage](https://developer.adobe.com/commerce/webapi/graphql/usage/) |
| Attributes — queries EAV / custom metadata | [`schema-attributes.md`](./schema-attributes.md) | §1–§8 | [Attributes](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/) |
| Attributes — mutations `setCustomAttributesOn*` | [`schema-attributes.md`](./schema-attributes.md) | §9–§18 | [Custom attribute mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/) |
| Cart — queries + mutations + interfaces | [`schema-cart.md`](./schema-cart.md) | §1–§40 | [Cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/) |
| Catalog Service, Live Search & Product Recommendations | [`schema-catalog-service.md`](./schema-catalog-service.md) | §1–§9 | [Catalog Service](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/) |
| Checkout — queries + mutations | [`schema-checkout.md`](./schema-checkout.md) | §1–§13 | [Checkout](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/) |
| Core payment methods | [`schema-payment-methods.md`](./schema-payment-methods.md) | §1–§13 | [Core payment methods](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/) |
| Payment Services extension | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) | §1–§22 | [Payment Services extension](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/) |
| Company (B2B) — queries + mutations | [`schema-b2b-company.md`](./schema-b2b-company.md) | §1–§21 | [Company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/) |
| Negotiable quotes (B2B) — queries + mutations + interfaces + unions | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) | §1–§21 | [Negotiable quotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/) |
| Purchase orders (B2B) — queries + mutations | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) | §1–§12 | [Purchase orders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/) |
| Purchase order rules (B2B) — queries + mutations + interfaces | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) | §1–§11 | [Purchase order rules](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/) |
| Requisition lists (B2B) — mutations + interfaces | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) | §1–§15 | [Requisition lists](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/) |
| Customer — queries + mutations | [`schema-customer.md`](./schema-customer.md) | §1–§34 | [Customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/) |
| Gift registry — queries + mutations | [`schema-gift-registry.md`](./schema-gift-registry.md) | §1–§18 | [Gift registry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/) |
| Orders — queries + mutations + interfaces | [`schema-orders.md`](./schema-orders.md) | §1–§21 | [Orders](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/) |
| Products — queries + mutations + interfaces | [`schema-products.md`](./schema-products.md) | §1–§41 | [Products](https://developer.adobe.com/commerce/webapi/graphql/schema/products/) |
| Store — queries + mutations | [`schema-store.md`](./schema-store.md) | §1–§16 | [Store](https://developer.adobe.com/commerce/webapi/graphql/schema/store/) |
| Uploads — mutations | [`schema-uploads.md`](./schema-uploads.md) | §1–§6 | [Uploads](https://developer.adobe.com/commerce/webapi/graphql/schema/uploads/) |
| Wish list — queries + mutations + interfaces | [`schema-wishlist.md`](./schema-wishlist.md) | §1–§17 | [Wish list](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/) |
| Development (schema, resolver, mở rộng) | [`development.md`](./development.md) | §1–§8 | [Develop](https://developer.adobe.com/commerce/webapi/graphql/develop/) |
| Tutorial — Checkout (10 bước) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) | §1–§13 | [GraphQL tutorials](https://developer.adobe.com/commerce/webapi/graphql/tutorials/) |

---

## Liên kết

- [GraphQL Guide (Adobe)](https://developer.adobe.com/commerce/webapi/graphql/) — cổng tổng
- Schema guide — 19 nhóm domain: xem **bảng định tuyến** ở trên (mỗi nhóm một file `schema-*.md`).
- Release notes (GraphQL): `release-notes.md`
- Development (tóm tắt Adobe): [`development.md`](./development.md)
- App Server & resolver stateless: [`../graphql-app-server.md`](../graphql-app-server.md)
