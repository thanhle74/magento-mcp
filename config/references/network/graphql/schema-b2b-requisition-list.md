# GraphQL — Schema (Guide): Requisition lists (B2B) (mutations + interfaces)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Requisition lists (B2B)**, tập trung vào thao tác quản lý danh sách mua lại và đồng bộ với cart trong luồng B2B.

---

## 1. Requisition lists (B2B) (nhóm schema)

- Đây là tính năng **Adobe Commerce B2B**.
- Requisition list gần giống wish list nhưng tối ưu cho mua lặp lại trong bối cảnh doanh nghiệp.
- Nhóm schema này tập trung vào:
  - quản lý requisition list (create/update/delete)
  - quản lý items trong list (add/update/delete/copy/move)
  - thao tác với cart từ list (`addRequisitionListItemsToCart`, `clearCustomerCart`)
  - interface mô tả item theo từng product type.
- Điều kiện chung:
  - yêu cầu customer authentication token hợp lệ
  - nên kiểm tra `storeConfig.is_requisition_list_active` trước khi hiển thị/cho phép thao tác.

---

## 2. Requisition list mutations — danh sách (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `addProductsToRequisitionList` | Thêm products vào requisition list | §3 |
| `addRequisitionListItemsToCart` | Thêm items từ requisition list vào cart | §4 |
| `clearCustomerCart` | Xóa toàn bộ cart của customer (phục vụ flow requisition list) | §5 |
| `copyItemsBetweenRequisitionLists` | Copy items từ list nguồn sang list đích | §6 |
| `createRequisitionList` | Tạo requisition list mới | §7 |
| `deleteRequisitionList` | Xóa requisition list | §8 |
| `deleteRequisitionListItems` | Xóa items khỏi requisition list | §9 |
| `moveItemsBetweenRequisitionLists` | Di chuyển items giữa các requisition lists | §10 |
| `updateRequisitionList` | Cập nhật tên/mô tả requisition list | §11 |
| `updateRequisitionListItems` | Cập nhật items trong requisition list (ví dụ quantity) | §12 |

---

## 3. `addProductsToRequisitionList`

- Mục đích: thêm sản phẩm vào requisition list chỉ định.
- Input chính:
  - `requisitionListUid`
  - `requisitionListItems` (SKU, quantity, selected options nếu có).
- Output: requisition list đã cập nhật (items, items_count).
- Dùng cho luồng: từ PDP/PLP thêm nhanh sản phẩm vào danh sách mua lại.

---

## 4. `addRequisitionListItemsToCart`

- Mục đích: thêm một phần hoặc toàn bộ items từ requisition list vào cart.
- Input chính:
  - `requisitionListUid`
  - `requisitionListItemUids` (optional để chọn subset).
- Output: trạng thái + cart hiện tại.
- Lưu ý: requisition list **không bị thay đổi** sau khi add vào cart.

---

## 5. `clearCustomerCart`

- Mục đích: xóa toàn bộ cart của customer.
- Input: `cartUid`.
- Output: trạng thái thực thi (`status`).
- Thường dùng trước khi nạp mới danh sách items từ requisition list theo workflow riêng.

---

## 6. `copyItemsBetweenRequisitionLists`

- Mục đích: copy items từ list nguồn sang list đích.
- Input chính:
  - `sourceRequisitionListUid`
  - `destinationRequisitionListUid`
  - `requisitionListItem` (item UIDs cần copy).
- Output: thông tin requisition list đích sau khi copy.

---

## 7. `createRequisitionList`

- Mục đích: tạo requisition list mới cho customer đăng nhập.
- Input chính:
  - `name`
  - `description` (optional).
- Output: requisition list mới (uid, name, description).

---

## 8. `deleteRequisitionList`

- Mục đích: xóa requisition list theo UID.
- Input: `requisitionListUid`.
- Output: trạng thái và có thể trả danh sách requisition lists còn lại.
- Dùng khi customer dọn dẹp danh mục mua lặp lại không còn dùng.

---

## 9. `deleteRequisitionListItems`

- Mục đích: xóa các item cụ thể khỏi requisition list.
- Input chính:
  - `requisitionListUid`
  - `requisitionListItemUids`.
- Output: requisition list sau khi xóa (ví dụ `items_count` mới).

---

## 10. `moveItemsBetweenRequisitionLists`

- Mục đích: di chuyển items từ list nguồn sang list đích.
- Input chính:
  - `sourceRequisitionListUid`
  - `destinationRequisitionListUid`
  - danh sách item UIDs cần move.
- Output: cả source/destination list sau thay đổi để UI đồng bộ ngay.

---

## 11. `updateRequisitionList`

- Mục đích: cập nhật metadata của list (tên, mô tả).
- Input chính:
  - `requisitionListUid`
  - `name`
  - `description` (optional).
- Output: requisition list đã cập nhật.

---

## 12. `updateRequisitionListItems`

- Mục đích: cập nhật items trong list (thường quantity).
- Input chính:
  - `requisitionListUid`
  - `requisitionListItems` với từng `item_id` và field cập nhật.
- Output: requisition list sau khi cập nhật items.

---

## 13. Requisition list interfaces

- Interface chính: `RequisitionListItemInterface`.
- Interface này biểu diễn item trong requisition list theo các product types khác nhau.
- Không có implementation riêng cho grouped product; các child items được quản lý độc lập.

---

## 14. `RequisitionListItemInterface` implementations

- `BundleRequisitionListItem`
- `ConfigurableRequisitionListItem`
- `DownloadableRequisitionListItem`
- `GiftCardRequisitionListItem`
- `SimpleRequisitionListItem`
- `VirtualRequisitionListItem`

---

## 15. Ghi chú triển khai nhanh (B2B headless)

- Feature flag:
  - kiểm tra `storeConfig.is_requisition_list_active` trước khi bật UI và action.
- Mapping hành vi:
  - **copy** giữ nguyên source, **move** giảm item ở source và tăng ở destination.
- UX cart:
  - chọn rõ flow add-merge hay clear-then-add tùy business.
- Error handling:
  - hiển thị lỗi theo mutation output để user biết item/list nào thất bại.
- Tổ chức danh sách:
  - khuyến nghị hỗ trợ nhiều lists theo team/vendor/campaign như Adobe gợi ý.
