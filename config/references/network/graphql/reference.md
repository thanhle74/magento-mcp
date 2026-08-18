# GraphQL API — Reference (schema theo phiên bản)

Nguồn: [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/)

**Bổ sung:** [GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/) (guide theo domain — Attributes, Cart, Catalog Service, Checkout, B2B, Customer, Gift registry, Orders, Products, …) khác với trang **reference theo phiên bản**; tóm tắt nhóm **Attributes** trong [`schema-attributes.md`](./schema-attributes.md), nhóm **Cart** trong [`schema-cart.md`](./schema-cart.md), **Storefront Services / Catalog Service** cùng các query **Live Search** (`attributeMetadata`, `productSearch`) và **Product Recommendations** (`recommendations`) trong [`schema-catalog-service.md`](./schema-catalog-service.md), **Checkout** (queries + mutations) trong [`schema-checkout.md`](./schema-checkout.md), **Core payment methods** trong [`schema-payment-methods.md`](./schema-payment-methods.md), **Payment Services extension** (workflows + queries + mutations) trong [`schema-payment-services-extension.md`](./schema-payment-services-extension.md), **Company (B2B) queries + mutations** trong [`schema-b2b-company.md`](./schema-b2b-company.md), **Negotiable quotes (B2B) queries + mutations + interfaces + unions** trong [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md), **Purchase orders (B2B) queries + mutations** trong [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md), **Purchase order rules (B2B) queries + mutations + interfaces** trong [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md), **Requisition lists (B2B) mutations + interfaces** trong [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md), **Customer queries + mutations** trong [`schema-customer.md`](./schema-customer.md), **Gift registry queries + mutations** trong [`schema-gift-registry.md`](./schema-gift-registry.md), **Orders queries + mutations + interfaces** trong [`schema-orders.md`](./schema-orders.md), **Products queries + mutations + interfaces** trong [`schema-products.md`](./schema-products.md), **Store queries + mutations** trong [`schema-store.md`](./schema-store.md), **Uploads mutations** trong [`schema-uploads.md`](./schema-uploads.md), **Wish list queries + mutations + interfaces** trong [`schema-wishlist.md`](./schema-wishlist.md), nhóm **GraphQL tutorials (checkout 10 bước)** trong [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md), và **GraphQL release notes** trong [`release-notes.md`](./release-notes.md).

## Cách dùng trang reference

- Một endpoint GraphQL, toàn bộ **queries / mutations / types** được mô tả theo **phiên bản** (vd. **2.4.8** cho stack PaaS/on-prem trùng `constitution.md`).
- Có bản **SaaS only** — chỉ áp dụng nếu kiến trúc Commerce của bạn là SaaS; không trộn nhầm schema với on-prem.

## Gợi ý tra cứu

- **Cart / checkout / customer / products** — đúng nhóm trong sidebar Schema trên Adobe.
- **B2B** (Company, Negotiable quotes, Requisition lists, …) — chỉ khi bật module B2B.
- **Catalog Service / Live Search** — tích hợp dịch vụ Adobe; đọc điều kiện license & stack.

Chi tiết từng field và đối số: luôn đối chiếu đúng **bản reference** đã chọn.
