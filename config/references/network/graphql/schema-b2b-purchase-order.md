# GraphQL — Schema (Guide): Purchase orders (B2B) (queries + mutations)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Purchase orders (B2B)**, tập trung vào các mutation xử lý vòng đời duyệt đơn mua doanh nghiệp.

---

## 1. Purchase orders (B2B) (nhóm schema)

- Đây là nhóm tính năng **Adobe Commerce B2B** (không có trên Magento Open Source mặc định).
- Nhóm Purchase Orders trong schema hiện hành gồm:
  - query lồng trong `customer` để đọc danh sách/chi tiết purchase orders
  - các **mutations** để xử lý vòng đời purchase order
- Mutations chính:
  - tạo/yêu cầu purchase order
  - approve/reject/cancel purchase orders
  - chuyển purchase order thành sales order
  - thêm item của purchase order vào cart
  - thêm comment phục vụ audit/collaboration
- Query (qua `customer`) chính:
  - `purchase_orders` (list + pagination/filter)
  - `purchase_order(uid: ...)` (chi tiết một purchase order)
  - `purchase_orders_enabled` (flag bật/tắt capability).
- Các mutation thường yêu cầu customer token hợp lệ với quyền/role phù hợp trong company structure.

---

## 2. Purchase orders — queries qua `customer`

- Không có top-level query riêng chỉ cho purchase orders.
- Dùng `customer` query để đọc dữ liệu PO:
  - `purchase_orders(currentPage, pageSize, filter)` để lấy danh sách
  - `purchase_order(uid)` để lấy chi tiết
  - `purchase_orders_enabled` để kiểm tra customer hiện tại có bật PO flow không.
- Thông tin thường đọc:
  - `status`, `available_actions`, `comments`, `history_log`, `quote`, `order`.

---

## 3. Purchase orders — danh sách mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `addPurchaseOrderComment` | Thêm comment vào purchase order | §4 |
| `addPurchaseOrderItemsToCart` | Thêm item từ purchase order vào cart hiện tại | §5 |
| `approvePurchaseOrders` | Approve một hoặc nhiều purchase orders | §6 |
| `cancelPurchaseOrders` | Hủy một hoặc nhiều purchase orders | §7 |
| `placeOrderForPurchaseOrder` | Chuyển purchase order đã duyệt thành order | §8 |
| `placePurchaseOrder` | Đặt purchase order bằng `cart_id` | §9 |
| `rejectPurchaseOrders` | Từ chối một hoặc nhiều purchase orders | §10 |
| `validatePurchaseOrders` | Validate purchase orders theo approval rules | §11 |

---

## 4. `addPurchaseOrderComment`

- Mục đích: thêm comment vào purchase order để ghi chú luồng duyệt/trao đổi nội bộ.
- Input: `AddPurchaseOrderCommentInput` (thường gồm `purchase_order_uid` và nội dung comment).
- Output: thông tin comment vừa tạo và/hoặc purchase order liên quan theo schema.
- Dùng cho:
  - history/audit trail
  - giao tiếp giữa requester/approver trong company account.

---

## 5. `addPurchaseOrderItemsToCart`

- Mục đích: copy item từ purchase order sang cart để chỉnh sửa hoặc reorder.
- Input: `AddPurchaseOrderItemsToCartInput` (thường gồm `purchase_order_uid`, `cart_id`, `replace_existing_cart_items`).
- Output: `AddProductsToCartOutput` (`cart` đã cập nhật + `user_errors`).
- Use case:
  - biến purchase order cũ thành cart mới để điều chỉnh số lượng/sản phẩm trước khi gửi lại.

---

## 6. `approvePurchaseOrders`

- Mục đích: approve một hoặc nhiều purchase orders (thường yêu cầu trạng thái `PENDING`).
- Input: `PurchaseOrdersActionInput` (danh sách PO UIDs/action context).
- Output: `PurchaseOrdersActionOutput` gồm danh sách purchase orders đã xử lý và lỗi theo từng phần tử.
- Điều kiện nghiệp vụ phổ biến:
  - PO cần ở trạng thái phù hợp (thường là trạng thái chờ duyệt như `PENDING`).
  - user cần có quyền approver tương ứng theo company role/rule.

---

## 7. `cancelPurchaseOrders`

- Mục đích: hủy một hoặc nhiều purchase orders; khi thành công trạng thái thường thành `CANCELED`.
- Input: `PurchaseOrdersActionInput`.
- Output: `PurchaseOrdersActionOutput` gồm kết quả và lỗi theo từng purchase order.
- Dùng khi:
  - requester hoặc approver muốn dừng quy trình mua trước khi finalize.

---

## 8. `placeOrderForPurchaseOrder`

- Mục đích: chuyển purchase order đã được phê duyệt thành sales order; PO chuyển sang `ORDER_PLACED`.
- Input: `PlaceOrderForPurchaseOrderInput`.
- Output: object order tạo ra (thường chứa thông tin order number/trạng thái theo schema).
- Lưu ý:
  - đây là bước "execute" sau approval, khác với mutation tạo purchase order ban đầu.

---

## 9. `placePurchaseOrder`

- Mục đích: đặt purchase order bằng `cart_id`; khi thành công PO có trạng thái `ORDER_PLACED`.
- Input: `PlacePurchaseOrderInput`.
- Output: purchase order vừa tạo (`PlacePurchaseOrderOutput`).
- Dùng khi company workflow yêu cầu tạo PO từ cart trước khi tiếp tục các bước approval/order.

---

## 10. `rejectPurchaseOrders`

- Mục đích: từ chối một hoặc nhiều purchase orders (thường yêu cầu trạng thái `PENDING`).
- Input: `PurchaseOrdersActionInput`.
- Output: `PurchaseOrdersActionOutput` (purchase orders + errors).
- Khác với cancel:
  - `reject` thể hiện quyết định từ phía approver theo policy duyệt
  - `cancel` thường là thao tác hủy theo nhu cầu nghiệp vụ.

---

## 11. `validatePurchaseOrders`

- Mục đích: validate purchase orders theo approval rules trước khi approve/place.
- Mutation này thuộc nhóm **Purchase order rules (B2B)**, nhưng Adobe cũng liệt kê trong trang Purchase order mutations tổng hợp.
- Input/Output: theo `validatePurchaseOrders` schema ở nhóm purchase-order-rule.
- Dùng khi cần pre-check rõ lý do không hợp lệ trước khi chạy action chính (approve/place/cancel flow).

---

## 12. Ghi chú triển khai nhanh (B2B headless)

- Phân quyền:
  - luôn map company role/rule vào UI action (approve/reject/cancel/place order).
- Trạng thái:
  - render CTA theo state machine của PO (pending/approved/rejected/canceled/...).
- Error handling:
  - dùng danh sách `errors`/`user_errors` để hiển thị theo từng PO thay vì fail toàn cục.
- Tách luồng rõ:
  - `placePurchaseOrder` = tạo PO để duyệt.
  - `placeOrderForPurchaseOrder` = chuyển PO đã duyệt thành order.
