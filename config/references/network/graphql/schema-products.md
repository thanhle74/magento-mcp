# GraphQL — Schema (Guide): Products (queries + mutations)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Products**, tập trung vào các query catalog, URL routing, compare list, product alerts, metadata review và product-related mutations.

---

## 1. Products (nhóm schema)

- Nhóm **Products** bao gồm cả query và mutation phục vụ storefront browse/search/product detail và tương tác customer.
- Trong batch này tập trung vào:
  - 10 query phổ biến
  - 11 mutation liên quan product alerts, compare list, product review
- Query chính:
  - Catalog/category: `products`, `categories`, `category`, `categoryList`
  - Routing URL: `route`, `urlResolver`
  - Compare & review metadata: `compareList`, `productReviewRatingsMetadata`
  - Product alert subscription state: `isSubscribedProductAlertPrice`, `isSubscribedProductAlertStock`
- Mutation chính:
  - Product alerts: subscribe/unsubscribe price + stock (single/all)
  - Compare list: tạo list, thêm sản phẩm, gỡ sản phẩm, xóa list
  - Product review: `createProductReview`
- Lưu ý môi trường:
  - Một số query chỉ phù hợp **PaaS/on-prem** (`products`, `categories`, `category`, `categoryList`, `route`, `urlResolver`, `productReviewRatingsMetadata`).
  - Nhóm product alerts mutations trong tài liệu này chủ yếu áp dụng cho **SaaS**.
  - `createProductReview` là luồng thường dùng trên **PaaS/on-prem**.
  - Trên **SaaS**, Adobe khuyến nghị dùng Catalog Service thay cho một số query catalog truyền thống.

---

## 2. Products — danh sách queries (mục lục)

| Query | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `products` | Tìm kiếm/lọc/sắp xếp sản phẩm catalog | §3 |
| `compareList` | Lấy danh sách sản phẩm trong compare list theo `uid` | §4 |
| `categoryList` | Truy vấn category tree theo filter (không pagination) | §5 |
| `category` | Truy vấn category theo ID (**deprecated**) | §6 |
| `categories` | Truy vấn category có pagination | §7 |
| `route` | Resolve URL thành thực thể routable | §8 |
| `urlResolver` | Resolve URL cũ (**deprecated**, dùng `route`) | §9 |
| `productReviewRatingsMetadata` | Lấy metadata thang điểm đánh giá sản phẩm | §10 |
| `isSubscribedProductAlertStock` | Kiểm tra customer đã subscribe stock alert chưa | §11 |
| `isSubscribedProductAlertPrice` | Kiểm tra customer đã subscribe price alert chưa | §12 |

---

## 3. `products`

- Mục đích: query catalog products với `search`, `filter`, `sort`, `pageSize`, `currentPage`.
- Dùng cho:
  - PLP/search result
  - layered navigation
  - listing theo category/filter
- Input quan trọng:
  - `search` (full-text)
  - `filter` (`ProductAttributeFilterInput`)
  - `sort` (`ProductAttributeSortInput`)
  - pagination (`pageSize`, `currentPage`)
- Output: `Products` (items + aggregations + page_info + total_count).
- Ghi chú:
  - Cần có `search` hoặc `filter` (hoặc cả hai).
  - Trên SaaS, Adobe không hỗ trợ query này; nên dùng Catalog Service products query.

---

## 4. `compareList`

- Mục đích: lấy thông tin compare list theo `uid`.
- Input: `uid: ID!`.
- Output thường gồm:
  - `uid`, `item_count`
  - `attributes` dùng để compare
  - `items.product` (sku, name, description...)
- Dùng khi render màn compare sản phẩm của khách.

---

## 5. `categoryList`

- Mục đích: tìm category tree theo `filters` (`CategoryFilterInput`).
- Filter hỗ trợ: category ID, name, parent ID, url key, url path.
- Đặc điểm:
  - **Không hỗ trợ pagination**.
  - Không truyền filter thì trả root category.
  - Dùng `breadcrumbs` để lấy parent path.
- Khuyến nghị:
  - Nếu số node lớn hoặc cần phân trang, ưu tiên `categories`.
- Trạng thái: là lựa chọn thay cho `category` (deprecated).

---

## 6. `category` (**deprecated**)

- Mục đích cũ: lấy một category (hoặc subtree) theo `id`.
- Trạng thái: **deprecated**, Adobe khuyến nghị dùng `categories`.
- Vẫn hữu ích khi đọc legacy codebase cũ.
- Cần chú ý query depth limit khi truy vấn cây category sâu.

---

## 7. `categories`

- Mục đích: trả danh sách category theo filter với pagination.
- Input: `filters`, `pageSize`, `currentPage`.
- Output: `CategoryResult`:
  - `items` (mỗi item là `CategoryTree`)
  - `page_info`
  - `total_count`
- Trên SaaS: Adobe không hỗ trợ query này theo schema Products truyền thống; dùng Catalog Service categories query.

---

## 8. `route`

- Mục đích: resolve URL storefront thành thực thể routable (product/category/CMS page).
- Input: `url: String!`.
- Output: `RoutableInterface` (có thể dùng inline fragment theo `__typename`).
- Use case:
  - headless router
  - xử lý redirect/canonical URL
  - render trang mà không cần biết trước loại thực thể.

---

## 9. `urlResolver` (**deprecated**)

- Mục đích cũ: resolve URL thành `EntityUrl`.
- Trạng thái: **deprecated**, Adobe yêu cầu chuyển sang `route`.
- Với code mới: dùng `route` để tương thích schema hiện tại.

---

## 10. `productReviewRatingsMetadata`

- Mục đích: lấy rating attributes đang active và các giá trị rating (vd 1-5 sao).
- Dùng cho UI viết review:
  - render các tiêu chí như Overall/Quality/Value
  - map `value_id` cho mutation tạo review.
- Output chính: danh sách `items` với `id`, `name`, `values`.

---

## 11. `isSubscribedProductAlertStock`

- Mục đích: kiểm tra customer hiện tại đã subscribe stock alert cho SKU chưa.
- Input: `ProductAlertStockInput` (thường cần `sku`).
- Output: `IsProductAlertSubscriptionResult` (`isSubscribed`, `message`).
- Yêu cầu:
  - cần customer auth token hợp lệ.
- Thực tế dùng để quyết định hiển thị nút subscribe/unsubscribe stock alert.

---

## 12. `isSubscribedProductAlertPrice`

- Mục đích: kiểm tra customer hiện tại đã subscribe price-drop alert cho SKU chưa.
- Input: `ProductAlertPriceInput` (thường cần `sku`).
- Output: `IsProductAlertSubscriptionResult` (`isSubscribed`, `message`).
- Yêu cầu:
  - cần customer auth token hợp lệ.
- Thực tế dùng để điều khiển UI subscribe/unsubscribe price alert.

---

## 13. Products — danh sách mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `unsubscribeProductAlertStockAll` | Hủy toàn bộ stock alerts của customer hiện tại | §14 |
| `unsubscribeProductAlertStock` | Hủy stock alert cho một sản phẩm cụ thể | §15 |
| `unsubscribeProductAlertPriceAll` | Hủy toàn bộ price alerts của customer hiện tại | §16 |
| `unsubscribeProductAlertPrice` | Hủy price alert cho một sản phẩm cụ thể | §17 |
| `subscribeProductAlertStock` | Subscribe stock alert cho sản phẩm cụ thể | §18 |
| `subscribeProductAlertPrice` | Subscribe price alert cho sản phẩm cụ thể | §19 |
| `removeProductsFromCompareList` | Xóa một/nhiều sản phẩm khỏi compare list | §20 |
| `deleteCompareList` | Xóa hẳn compare list theo `uid` | §21 |
| `createProductReview` | Tạo review mới cho sản phẩm | §22 |
| `createCompareList` | Tạo compare list mới (có thể kèm sản phẩm ban đầu) | §23 |
| `addProductsToCompareList` | Thêm sản phẩm vào compare list hiện có | §24 |

---

## 14. `unsubscribeProductAlertStockAll`

- Mục đích: hủy tất cả đăng ký stock alert của customer hiện tại.
- Input: không cần payload business đáng kể (chủ yếu dựa trên token customer).
- Output: payload trạng thái thành công/thất bại theo schema mutation.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Dùng khi customer chọn "unsubscribe all stock alerts" trong account center.

---

## 15. `unsubscribeProductAlertStock`

- Mục đích: hủy đăng ký stock alert cho một sản phẩm cụ thể.
- Input: `ProductAlertStockInput` (thường cần `sku`).
- Output: trạng thái xử lý subscribe/unsubscribe.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Dùng cho nút "Notify me" dạng toggle ở PDP/listing.

---

## 16. `unsubscribeProductAlertPriceAll`

- Mục đích: hủy toàn bộ đăng ký price alert của customer hiện tại.
- Input: không cần chỉ định SKU cụ thể.
- Output: trạng thái xử lý hủy hàng loạt.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Dùng trong trang quản lý subscriptions của customer.

---

## 17. `unsubscribeProductAlertPrice`

- Mục đích: hủy đăng ký price alert cho một SKU cụ thể.
- Input: `ProductAlertPriceInput` (thường cần `sku`).
- Output: trạng thái xử lý hủy subscription.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Luồng thường đi kèm query `isSubscribedProductAlertPrice`.

---

## 18. `subscribeProductAlertStock`

- Mục đích: đăng ký stock alert cho sản phẩm out-of-stock.
- Input: `ProductAlertStockInput` (SKU mục tiêu).
- Output: trạng thái subscribe + message phản hồi.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Dùng khi storefront cần thu hồi nhu cầu khi hàng quay lại kho.

---

## 19. `subscribeProductAlertPrice`

- Mục đích: đăng ký nhận thông báo khi giá sản phẩm thay đổi/giảm.
- Input: `ProductAlertPriceInput` (SKU mục tiêu).
- Output: trạng thái subscribe + thông điệp phản hồi.
- Yêu cầu:
  - bắt buộc customer auth token.
  - thường áp dụng cho luồng **SaaS**.
- Luồng UI thường là toggle cùng query trạng thái subscribe.

---

## 20. `removeProductsFromCompareList`

- Mục đích: xóa một hoặc nhiều sản phẩm khỏi compare list hiện có.
- Input chính:
  - `uid`: ID compare list.
  - `products`: danh sách product IDs cần remove.
- Output: `CompareList` đã cập nhật (`uid`, `item_count`, `attributes`, `items`).
- Khả dụng trên cả PaaS/on-prem và SaaS.
- Dùng khi user thao tác remove item trong trang compare.

---

## 21. `deleteCompareList`

- Mục đích: xóa hoàn toàn một compare list theo `uid`.
- Input: `uid` compare list cần xóa.
- Output: trạng thái thực thi theo schema mutation (thường gồm `result`/message).
- Khả dụng trên cả PaaS/on-prem và SaaS.
- Dùng trong luồng cleanup compare list cũ hoặc reset so sánh.

---

## 22. `createProductReview`

- Mục đích: tạo review mới cho sản phẩm.
- Input thường gồm:
  - SKU sản phẩm.
  - nickname, summary, text review.
  - ratings theo `value_id` từ `productReviewRatingsMetadata`.
- Output: thông tin review vừa tạo/theo payload mutation.
- Lưu ý môi trường:
  - luồng này thường dùng trên **PaaS/on-prem**.
- Thực tế cần kiểm tra cấu hình moderation để biết review hiển thị ngay hay chờ duyệt.

---

## 23. `createCompareList`

- Mục đích: tạo compare list mới; có thể truyền trước danh sách SKU để add ngay.
- Input:
  - `products` là optional (danh sách SKU ban đầu).
- Output: `CompareList` mới (`uid`, `item_count`, `attributes`, `items`).
- Khả dụng trên cả PaaS/on-prem và SaaS.
- Ghi chú storefront: chỉ các thuộc tính được cấu hình "Comparable on Storefront" mới hiển thị trong widget compare.

---

## 24. `addProductsToCompareList`

- Mục đích: thêm sản phẩm vào compare list đã tồn tại.
- Input chính:
  - `uid`: compare list target.
  - `products`: danh sách product IDs thêm vào list.
- Output: `CompareList` đã cập nhật (`uid`, `item_count`, `attributes`, `items`).
- Khả dụng trên cả PaaS/on-prem và SaaS.
- Dùng khi user bấm "Add to compare" từ PDP/PLP trên headless storefront.

---

## 25. Ghi chú triển khai nhanh (headless)

- Router storefront:
  - ưu tiên `route`; không build mới trên `urlResolver`.
- Category navigation:
  - cần pagination dùng `categories`
  - cần tree nhanh theo filter dùng `categoryList`
  - tránh dùng `category` cho code mới.
- Product listing/search:
  - PaaS/on-prem dùng `products`.
  - SaaS ưu tiên Catalog Service products/categories query.
- Customer product alerts:
  - đọc trạng thái bằng `isSubscribedProductAlertPrice/Stock`.
  - thao tác subscribe/unsubscribe bằng nhóm mutation product alert.
  - bắt buộc xử lý tình huống chưa đăng nhập (token thiếu/invalid) và thông báo rõ lỗi auth.
- Compare list:
  - dùng `createCompareList` để khởi tạo list từ guest flow.
  - dùng `addProductsToCompareList` và `removeProductsFromCompareList` để đồng bộ UI compare.
  - dùng `deleteCompareList` cho reset list hoàn toàn.
- Product reviews:
  - tải metadata bằng `productReviewRatingsMetadata`, sau đó map `value_id` vào `createProductReview`.

---

## 26. Products — danh sách interfaces (mục lục)

| Interface / Type | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `Product interfaces` (tổng quan) | Điểm vào để hiểu ProductInterface và các implementation | §27 |
| `ProductInterface` attributes | Trường nền tảng cho hầu hết product types | §28 |
| `CategoryInterface` attributes | Trường category dùng trong `categoryList/categories/products` | §29 |
| `CustomizableOptionInterface` | Mô hình customizable options cho product | §30 |
| `RoutableInterface` attributes | Mô hình entity có thể resolve qua `route` | §31 |
| `AttributeMetadataInterface` | Interface metadata cũ (PWA metapackage, deprecated) | §32 |
| `PWA implementations` | Nhóm interface/type PWA cũ, đã deprecated | §33 |
| `Product interface implementations` | Bảng map product type -> interfaces implement | §34 |
| `SimpleProduct` data types | Product type đơn giản, phổ biến nhất | §35 |
| `VirtualProduct` data types | Product type không cần vận chuyển vật lý | §36 |
| `GroupedProduct` data types | Product gom nhiều simple items | §37 |
| `GiftCardProduct` data types | Product gift card với amount/redeem settings | §38 |
| `DownloadableProduct` data types | Product tải xuống (links/samples) | §39 |
| `ConfigurableProduct` data types | Product có biến thể + swatch/options selection | §40 |
| `BundleProduct` data types | Product bundle với bundle options/items | §41 |

---

## 27. `Product interfaces` (tổng quan)

- Đây là cụm tài liệu mô tả các interface/type liên quan nhóm Products.
- Trọng tâm:
  - interface nền tảng: `ProductInterface`, `CategoryInterface`, `CustomizableOptionInterface`, `RoutableInterface`
  - metadata/interface cũ liên quan PWA metapackage (deprecated)
  - các implementation theo từng product type (`SimpleProduct`, `ConfigurableProduct`, `BundleProduct`, ...)
- Khi viết `products` query nâng cao, thường dùng inline fragment theo `__typename` để lấy field đặc thù của từng type.

---

## 28. `ProductInterface` attributes

- Mục đích: định nghĩa bộ field nền cho product model dùng ở storefront.
- Bất kỳ type nào implement `ProductInterface` đều có cùng lớp field cơ bản (SKU, name, pricing, media, stock, ... tùy schema version).
- `items` trong `products` có thể trả thêm custom/extension attributes tùy attribute set và module đang bật.
- Nhóm types chính implement `ProductInterface`:
  - `SimpleProduct`, `BundleProduct`, `ConfigurableProduct`, `DownloadableProduct`, `GiftCardProduct`, `GroupedProduct`, `VirtualProduct`.

---

## 29. `CategoryInterface` attributes

- `CategoryInterface` là contract category dùng xuyên suốt:
  - `categoryList`
  - `categories`
  - và category nodes trong `products`.
- Hữu ích khi cần thống nhất model category giữa PLP, menu, breadcrumbs, route/category landing.
- Nên coi đây là "shape chung" cho category thay vì phụ thuộc implementation cụ thể.

---

## 30. `CustomizableOptionInterface`

- Mục đích: mô tả customizable options của product (text/select/date/radio/checkbox...).
- Dùng trực tiếp trong `products` query qua fragment trên `CustomizableProductInterface`.
- Use case:
  - render dynamic custom options ở PDP
  - đọc metadata option (`title`, `required`, `sort_order`, option values/price type tùy subtype).
- Lưu ý Adobe: một số option object chưa được hỗ trợ đầy đủ qua GraphQL (ví dụ file option trong một số version/schema).

---

## 31. `RoutableInterface` attributes

- Mục đích: biểu diễn các entity có URL và có thể resolve qua `route`.
- Implementations tiêu biểu:
  - product types (`SimpleProduct`, `ConfigurableProduct`, `BundleProduct`, ...)
  - `CategoryTree`, `CmsPage`
  - `RoutableUrl` (fallback khi URL không map vào entity cụ thể).
- `RoutableUrl` thường dùng để xử lý redirect external/internal, khi đó `type` có thể trả `null`.
- Đây là nền tảng cho headless router không hardcode loại trang trước.

---

## 32. `AttributeMetadataInterface` (deprecated scope)

- Interface này chủ yếu xuất hiện trong ngữ cảnh PWA metapackage cũ (đã deprecated).
- Dùng để mô tả metadata của custom attribute:
  - code, label, data type, entity type, sort order, ui input metadata...
- Nếu project không phụ thuộc PWA metapackage legacy, coi đây là reference tương thích ngược hơn là API mục tiêu cho code mới.

---

## 33. `PWA implementations` (deprecated)

- Trang này được Adobe đánh dấu deprecated; hướng mới là dùng `ProductInterface` attributes.
- Có giá trị khi bảo trì storefront legacy từng dựa vào các interfaces/types:
  - `AttributeOptionsInterface`
  - `SelectableInputTypeInterface`
  - `UiInputTypeInterface`
  - cùng các type `CustomAttribute`, `ProductAttributeMetadata`, `SelectedAttributeOption`, `StoreLabels`.
- Khuyến nghị: với code mới, ưu tiên schema hiện tại trên `ProductInterface` + custom attributes APIs mới.

---

## 34. `Product interface implementations`

- Đây là bảng map product type -> interface mà type đó implement.
- Quy tắc thực chiến:
  - query field base từ `ProductInterface`
  - query field chuyên biệt bằng inline fragment theo type cụ thể.
- Nhóm thường có field đặc thù rõ rệt:
  - `BundleProduct`, `ConfigurableProduct`, `DownloadableProduct`, `GiftCardProduct`, `GroupedProduct`.
- `SimpleProduct` và `VirtualProduct` thường ít field đặc thù hơn, chủ yếu dùng fields nền + custom attributes.

---

## 35. `SimpleProduct` data types

- Implements: `ProductInterface`, `PhysicalProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Vai trò: product type cơ bản cho inventory/shipping truyền thống.
- Thường dùng làm child của grouped/configurable/bundle options trong nhiều catalog.
- Query pattern phổ biến:
  - lấy field base (`sku`, `name`, `price_range`, `stock_status`)
  - thêm custom attributes hoặc options nếu được cấu hình.

---

## 36. `VirtualProduct` data types

- Implements: `ProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Đặc trưng: không có khái niệm physical shipping.
- Dùng cho dịch vụ/digital entitlement/non-shippable goods.
- Query pattern giống simple product, nhưng flow checkout/shipping phía business logic sẽ khác.

---

## 37. `GroupedProduct` data types

- Implements: `ProductInterface`, `PhysicalProductInterface`, `RoutableInterface`.
- Field đặc trưng:
  - `items` chứa danh sách child products kèm `qty`, `position`, và product info.
- Use case:
  - render grouped PDP (nhiều sản phẩm con mua chung màn hình).
- Thường cần fragment `... on GroupedProduct` để lấy list con đầy đủ.

---

## 38. `GiftCardProduct` data types

- Implements: `ProductInterface`, `PhysicalProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Field đặc trưng liên quan gift card:
  - amount config (`allow_open_amount`, `open_amount_min/max`, `giftcard_amounts`)
  - behavior flags (`allow_message`, `is_redeemable`, `is_returnable`, `giftcard_type`).
- Đây là capability thuộc Adobe Commerce edition (không phải mọi deployment đều có).

---

## 39. `DownloadableProduct` data types

- Implements: `ProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Field đặc trưng:
  - `links_title`, `links_purchased_separately`
  - `downloadable_product_links`
  - `downloadable_product_samples`.
- Dùng cho catalog sản phẩm tải xuống (ebooks/media/file-based product).

---

## 40. `ConfigurableProduct` data types

- Implements: `ProductInterface`, `PhysicalProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Field đặc trưng:
  - `configurable_options`, `variants`
  - `configurable_product_options_selection` để tối ưu media/options theo lựa chọn shopper.
- Swatch support:
  - `swatch_data` qua `SwatchDataInterface` (`ColorSwatchData`, `ImageSwatchData`, `TextSwatchData`).
- Đây là type quan trọng nhất cho PDP biến thể trong storefront hiện đại.

---

## 41. `BundleProduct` data types

- Implements: `ProductInterface`, `PhysicalProductInterface`, `CustomizableProductInterface`, `RoutableInterface`.
- Field đặc trưng:
  - bundle behavior flags (`dynamic_sku`, `dynamic_price`, `dynamic_weight`, `price_view`, `ship_bundle_items`)
  - `items/options` mô tả cấu phần bundle và lựa chọn mặc định/quantity/price type.
- Dùng cho PDP cho phép khách tự cấu hình tổ hợp sản phẩm.
