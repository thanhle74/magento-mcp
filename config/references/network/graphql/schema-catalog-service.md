# GraphQL — Schema (Guide): Storefront Services (Catalog Service + Live Search + Product Recommendations queries)

Tóm tắt nhóm **Catalog Service**, query **Live Search** (`attributeMetadata`, `productSearch`) và **Product Recommendations** (`recommendations`) trên Adobe. Đây là **schema dịch vụ** (services-only), khác **[core GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/)** — endpoint và header không trùng GraphQL storefront cố định của Magento. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Storefront Services & Catalog Service (tổng quan)

Nguồn: [Catalog Service for Adobe Commerce](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/)
và [Adobe Storefront Services GraphQL](https://developer.adobe.com/commerce/webapi/graphql/schema/storefront-services/)

- Extension đóng góp schema GraphQL **chuyên biệt** để lấy dữ liệu catalog (PDP, PLP, so sánh SP, …) không có đủ ở core schema.
- Storefront Services gồm Catalog Service, Live Search, Product Recommendations; đều là SaaS services và dùng endpoint riêng (không phải `<commerce>/graphql` core).
- Schema này chỉ có **queries** (read-only). Các tác vụ write (cart/checkout/customer/order mutations) vẫn đi qua core GraphQL schema.
- Có thể dùng **[API Mesh](https://developer.adobe.com/graphql-mesh-gateway/)** (App Builder) để ghép core schema, Catalog Service và API nội bộ / bên thứ ba.
- Kiến trúc & tra cứu triển khai: [Catalog Service Guide](https://experienceleague.adobe.com/docs/commerce-merchant-services/catalog-service/overview.html) (Experience League).

**Endpoint (khái niệm chung — đối chiếu từng trang query trên Adobe)**

| Môi trường | Ghi chú |
|------------|---------|
| **PaaS** | Testing: `https://catalog-service-sandbox.adobe.io/graphql` — Production: `https://catalog-service.adobe.io/graphql` |
| **SaaS** | Dạng `https://<region>-<environment>.api.commerce.adobe.com/<tenantId>/graphql` (chi tiết trên doc từng query) |

**Header thường gặp** (bảng đầy đủ + mã nhóm khách trên từng trang Nguồn): `Magento-Customer-Group`, `Magento-Environment-Id`, `Magento-Store-Code`, `Magento-Store-View-Code`, `Magento-Website-Code`, `X-Api-Key` (PaaS — theo Adobe). `Magento-Environment-Id` lấy từ Commerce Services Connector / `bin/magento config:show services_connector/services_id/environment_id`.

---

## 2. Storefront Services — danh sách queries (mục lục)

Nguồn mục lục: [Catalog Service](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/) + [Live Search queries](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/).

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `categories` | [categories](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/categories/) | §3 |
| `products` | [products](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/products/) | §4 |
| `attributeMetadata` | [attributeMetadata (Live Search)](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/attribute-metadata/) | §5 |
| `productSearch` | [productSearch (Live Search)](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/product-search/) | §6 |
| `refineProduct` | [refineProduct](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/refine-product/) | §7 |
| `variants` | [variants](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/product-variants/) | §8 |
| `recommendations` | [recommendations (Product Recommendations)](https://developer.adobe.com/commerce/webapi/graphql/schema/product-recommendations/queries/recommendations/) | §9 |

---

## 3. `categories`

Nguồn: [categories](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/categories/)

- Trả về dữ liệu **danh mục**; nếu có input **`subtree`**, trả về thêm chi tiết **cây con**.
- Cú pháp (theo doc):  
  `categories(ids: [String!], roles: [String!], subtree: Subtree): [CategoryView]`  
  `input Subtree { startLevel: Int!, depth: Int! }`
- Dùng **`subtree`**: chỉ **một** `id` trong `ids`; nên giới hạn **`depth`** (Adobe gợi ý tối đa **3**) để tránh tải cây quá lớn.

---

## 4. `products` (Catalog Service)

Nguồn: [products (Catalog Service)](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/products/)

- Cùng **tên** với [`products` trong core **Products**](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/products/) nhưng **khác schema / output** — không trộn khi đọc reference.
- Cần **một hoặc nhiều SKU** làm input; phục vụ **PDP**, **so sánh SP**, … Dùng **[`productSearch`](#5-productsearch-live-search)** cho nội dung kiểu **product listing** (Live Search).
- Cú pháp (theo doc): `products(skus: [String]): [ProductView]`
- **`ProductView`** (simple vs complex, `SimpleProductView` / `ComplexProductView`, `attributes`, `images`, `inputOptions`, …) — xem đầy đủ trên Adobe.

---

## 5. `attributeMetadata` (Live Search)

Nguồn: [attributeMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/attribute-metadata/)

- Mục đích: trả danh sách attribute có thể dùng để **sort** hoặc **filter** cho `productSearch`.
- Output chính trong `AttributeMetadataResponse`:
  - `sortable[]`
  - `filterableInSearch[]`
  - mỗi phần tử thường có `attribute`, `label`, `numeric`.
- Dùng query này để build bộ lọc/sắp xếp động trên storefront, thay vì hard-code attribute codes.
- Ghi chú thực thi:
  - theo doc trang này, `X-Api-Key` dùng giá trị `search_gql`.

---

## 6. `productSearch` (Live Search)

Nguồn: [productSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/product-search/)

- Có trong **Live Search** và **Catalog Service extension**; cấu trức giống nhau nhưng **output có khác biệt** (theo Adobe).
- **Live Search** dùng `productSearch` thay cho `products` core để tìm kiếm; **`products`** (Catalog Service) phù hợp layered navigation; **`productSearch`** trả **faceting** và tính năng đặc thù Live Search. Bản **Catalog Service** của `productSearch` dùng Live Search để trả chi tiết theo SKU đầu vào (theo doc).
- Cú pháp (theo doc):  
  `productSearch(phrase: String!, context: QueryContextInput!, current_page: Int = 1, page_size: Int = 20, sort: [ProductSearchSortInput!], filter: [SearchClauseInput!]): ProductSearchResponse!`  
  — **`phrase`** bắt buộc; có thể **chuỗi rỗng** khi chỉ lọc theo category / `categoryPath`. **`context`** (customer group, lịch sử xem, …) áp dụng kiểu **Live Search** (xem doc).
- Giới hạn / gợi ý (theo Adobe): phân trang tối đa **10.000** sản phẩm mỗi query; merchandising — sort **relevance** hoặc không sort; category merchandising — sort **`position`**, filter **`categoryPath`**, **`phrase`** rỗng. Tham chiếu *Boundaries and Limits* trong Live Search Guide.

---

## 7. `refineProduct`

Nguồn: [refineProduct](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/refine-product/)

- Thu hẹp kết quả sau khi đã chạy **`products`** với sản phẩm **phức tạp**: từ response cần có options trong fragment **`ComplexProductView`**; khi khách chọn option (size, màu, …), gọi lại với **SKU** + **`optionIds`**; có thể cần **nhiều lần** cho đến khi chọn đủ biến thể.
- Cú pháp (theo doc): `refineProduct(sku: String!, optionIds: [String!]!): ProductView`

---

## 8. `variants`

Nguồn: [variants](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/product-variants/) (slug URL: `product-variants`)

- Trả về **mọi biến thể** của một SP — hữu ích cho ảnh biến thể trên **PDP/PLP** mà không cần nhiều request.
- Cú pháp (theo doc):  
  `variants(sku: String!, optionIds: [String!], pageSize: Int, cursor: String): ProductViewVariantResults`  
  Bắt buộc **SKU**; tùy chọn **`optionIds`**, **`pageSize`**, **`cursor`** (phân trang).

---

## 9. `recommendations` (Product Recommendations)

Nguồn: [recommendations](https://developer.adobe.com/commerce/webapi/graphql/schema/product-recommendations/queries/recommendations/)

- Mục đích: trả về các **khối gợi ý sản phẩm** (recommendation units) theo ngữ cảnh như SKU hiện tại, trang hiện tại, lịch sử xem/mua, giỏ hàng.
- Cú pháp (theo doc):  
  `recommendations(currentSku: String, userPurchaseHistory: [PurchaseHistory], userViewHistory: [ViewHistory], cartSkus: [String], category: String, pageType: PageType): Recommendations`
- Output chính:
  - `totalResults`
  - `results[]` (mỗi unit có `unitId`, `unitName`, `typeId`, `storefrontLabel`, `displayOrder`, `productsView[]`...)
- Header bắt buộc theo Adobe:
  - `Magento-Customer-Group` (mã group dạng `sha1(<customer_group_id>)`, có giá trị mẫu cho group mặc định)
  - `Magento-Environment-Id`, `Magento-Store-Code`, `Magento-Store-View-Code`, `Magento-Website-Code`
  - `X-Api-Key` cho môi trường PaaS/on-prem
- Lưu ý triển khai:
  - Adobe ghi rõ query này không hỗ trợ `alternateEnvironmentId`.
  - Để dữ liệu storefront đầy đủ, merchant cần bật cả Product Recommendations và Catalog Service (theo trang query Adobe).

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Core **Products** (schema khác): [Products queries](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/) — không nhầm với `products` của Catalog Service §4
- **Cart** (storefront core): [`schema-cart.md`](./schema-cart.md)
