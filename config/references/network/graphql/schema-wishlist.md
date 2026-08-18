# GraphQL — Schema (Guide): Wish list (queries + mutations + interfaces)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Wish list**, gồm query legacy, các mutation quản lý nhiều wishlist, và interface item theo từng product type.

---

## 1. Wish list (nhóm schema)

- Nhóm schema này phục vụ quản lý wishlist và item trong wishlist.
- Adobe Commerce hỗ trợ nhiều wishlist cho một customer; Magento Open Source có giới hạn hơn (thường một wishlist).
- Tài liệu Adobe nêu rõ query `wishlist` đã deprecated; thông tin wishlist nên lấy qua `customer` query.
- Hầu hết mutation yêu cầu customer authentication token hợp lệ.

---

## 2. Wish list — queries (mục lục)

| Query | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `wishlist` | Query legacy lấy dữ liệu wishlist (đã deprecated) | §3 |

---

## 3. `wishlist` (deprecated)

- Trạng thái: **deprecated**.
- Adobe khuyến nghị chuyển sang đọc dữ liệu wishlist từ `customer` query.
- Dùng để lấy dữ liệu wishlist như:
  - `items_count`, `name`, `sharing_code`, `updated_at`, danh sách items.

---

## 4. Wish list — mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `addProductsToWishlist` | Thêm một/nhiều sản phẩm vào wishlist | §5 |
| `addWishlistItemsToCart` | Chuyển item từ wishlist vào cart | §6 |
| `copyProductsBetweenWishlists` | Copy item giữa các wishlist | §7 |
| `clearWishlist` | Xóa toàn bộ item trong wishlist | §8 |
| `createWishlist` | Tạo wishlist mới | §9 |
| `deleteWishlist` | Xóa một wishlist (không xóa default list) | §10 |
| `moveProductsBetweenWishlists` | Move item giữa các wishlist | §11 |
| `removeProductsFromWishlist` | Xóa item chỉ định khỏi wishlist | §12 |
| `updateProductsInWishlist` | Cập nhật qty/description/options của item | §13 |
| `updateWishlist` | Cập nhật metadata wishlist (name/visibility) | §14 |

---

## 5. `addProductsToWishlist`

- Mục đích: thêm sản phẩm (hỗ trợ nhiều product types) vào wishlist chỉ định.
- Input chính:
  - `wishlistId`
  - `wishlistItems` (`sku`, `quantity`, có thể gồm `parent_sku`, `selected_options`).
- Kết quả:
  - dữ liệu wishlist cập nhật
  - `user_errors` cho item không hợp lệ (ví dụ SKU không tồn tại).
- Lưu ý:
  - trong Magento Open Source, lần thêm đầu có thể dùng `wishlistId: 0` để tạo default wishlist (theo doc Adobe cho luồng tạo customer).

---

## 6. `addWishlistItemsToCart`

- Mục đích: chuyển item từ wishlist sang cart.
- Input chính:
  - `wishlistId`
  - `wishlistItemIds` (optional; nếu truyền thì chỉ chuyển các item cụ thể).
- Output thường gồm:
  - `status`
  - danh sách lỗi theo item (`add_wishlist_items_to_cart_user_errors`)
  - dữ liệu wishlist sau khi chuyển.

---

## 7. `copyProductsBetweenWishlists`

- Mục đích: copy item từ source sang destination wishlist; source không đổi.
- Input chính:
  - `sourceWishlistUid`
  - `destinationWishlistUid`
  - `wishlistItems`.
- Output:
  - `destination_wishlist`
  - `user_errors`.

---

## 8. `clearWishlist`

- Mục đích: xóa toàn bộ item trong wishlist của customer đang đăng nhập.
- Input: `wishlistId` (theo syntax Adobe mới).
- Output thường gồm:
  - `wishlist` sau khi clear (`items_count` về 0 khi thành công)
  - `user_errors`.
- Ghi chú Adobe: mutation này thuộc Storefront Compatibility Package và sẽ vào Adobe Commerce 2.4.9.

---

## 9. `createWishlist`

- Mục đích: tạo wishlist mới cho customer.
- Input chính trong `CreateWishlistInput`:
  - `name`
  - `visibility` (`PUBLIC`/`PRIVATE` tùy enum).
- Có thể dùng `storeConfig` để kiểm tra capability:
  - `enable_multiple_wishlists`
  - `magento_wishlist_general_is_enabled`
  - `maximum_number_of_wishlists`.

---

## 10. `deleteWishlist`

- Mục đích: xóa wishlist chỉ định.
- Ràng buộc quan trọng:
  - không xóa được default (wishlist đầu tiên) của customer.
  - không có trong Magento Open Source (theo mô tả Adobe).
- Output thường gồm:
  - `status`
  - danh sách wishlist còn lại.

---

## 11. `moveProductsBetweenWishlists`

- Mục đích: move item giữa hai wishlist.
- Input chính:
  - `sourceWishlistUid`
  - `destinationWishlistUid`
  - `wishlistItems` (có thể kèm `quantity`; nếu không truyền quantity thì move toàn bộ quantity của item đó).
- Output:
  - `source_wishlist`
  - `destination_wishlist`
  - `user_errors`.

---

## 12. `removeProductsFromWishlist`

- Mục đích: xóa hẳn các item được chỉ định khỏi wishlist.
- Input chính:
  - `wishlistId`
  - `wishlistItemsIds`.
- Output:
  - dữ liệu wishlist sau khi remove
  - `user_errors`.

---

## 13. `updateProductsInWishlist`

- Mục đích: cập nhật item trong wishlist (quantity, description, options).
- Input chính:
  - `wishlistId`
  - `wishlistItems` (`WishlistItemUpdateInput`).
- Lưu ý từ Adobe:
  - không set quantity = 0 để xóa item; dùng `removeProductsFromWishlist` cho tác vụ xóa.
- Output:
  - wishlist đã cập nhật
  - `user_errors`.

---

## 14. `updateWishlist`

- Mục đích: cập nhật thuộc tính wishlist (ví dụ tên và visibility).
- Input chính:
  - `wishlistUid`
  - `name`
  - `visibility`.
- Thường dùng khi người dùng đổi tên list hoặc đổi public/private.

---

## 15. Wish list interfaces

- Interface chính: `WishlistItemInterface`.
- Interface này mô tả thông tin item trong wishlist theo từng loại sản phẩm.

---

## 16. `WishlistItemInterface` implementations

Các implementation tiêu biểu:

- `BundleWishlistItem`
- `ConfigurableWishlistItem`
- `DownloadableWishlistItem`
- `GiftCardWishlistItem`
- `GroupedProductWishlistItem`
- `SimpleWishlistItem`
- `VirtualWishlistItem`

---

## 17. Ghi chú triển khai nhanh (headless)

- Data source migration:
  - ưu tiên `customer` query cho wishlist data thay vì query `wishlist` legacy.
- Permission:
  - tất cả thao tác write wishlist cần customer token; cần xử lý flow re-auth khi token hết hạn.
- Multi-list UX:
  - trên Adobe Commerce, cho phép copy/move giữa nhiều list; cần hiển thị rõ source/destination.
- Error handling:
  - luôn render `user_errors` theo từng item để tránh fail cứng toàn thao tác.
- Cart transfer:
  - khi dùng `addWishlistItemsToCart`, cần đồng bộ trạng thái wishlist và mini-cart ngay sau mutation.
