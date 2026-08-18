# GraphQL — Schema (Guide): Purchase order rules (B2B) (queries + mutations + interfaces)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Purchase order rules (B2B)**, tập trung vào truy vấn và quản trị approval rules cho purchase order trong môi trường doanh nghiệp.

---

## 1. Purchase order rules (B2B) (nhóm schema)

- Đây là tính năng **Adobe Commerce B2B** (không có sẵn trong Magento Open Source mặc định).
- Nhóm schema này phục vụ cấu hình quy tắc duyệt purchase order:
  - query qua `customer` để đọc rule/rule metadata
  - mutations để create/update/delete/validate rule hoặc purchase orders liên quan rule
  - interface cho phần `condition` (amount/quantity).
- Tất cả ví dụ và thao tác thực tế yêu cầu customer authentication token hợp lệ.

---

## 2. Purchase order rules — queries qua `customer`

- Không có top-level query riêng cho approval rules.
- Truy vấn đi qua `customer`:
  - `purchase_order_approval_rules` lấy danh sách rules (items + pagination).
  - `purchase_order_approval_rule(uid)` lấy chi tiết một rule.
  - `purchase_order_approval_rule_metadata` lấy metadata để render form tạo/sửa rule.
- Các query này giúp frontend dựng màn hình:
  - danh sách rules
  - màn hình detail rule
  - dropdown metadata (roles, currencies, approvers).

---

## 3. Purchase order rule queries — mục lục nhanh

| Query qua `customer` | Mô tả ngắn |
|---|---|
| `purchase_order_approval_rules` | Danh sách approval rules theo customer/company context |
| `purchase_order_approval_rule(uid)` | Chi tiết một approval rule theo UID |
| `purchase_order_approval_rule_metadata` | Metadata cho form tạo/cập nhật rule |

---

## 4. Purchase order rules — danh sách mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `createPurchaseOrderApprovalRule` | Tạo mới approval rule | §5 |
| `deletePurchaseOrderApprovalRule` | Xóa một hoặc nhiều approval rules | §6 |
| `updatePurchaseOrderApprovalRule` | Cập nhật approval rule theo `uid` | §7 |
| `validatePurchaseOrders` | Validate thủ công purchase orders khi auto-validation gặp sự cố | §8 |

---

## 5. `createPurchaseOrderApprovalRule`

- Mục đích: tạo approval rule mới cho company purchase order flow.
- Input chính:
  - `name`
  - `condition`
  - `approvers`
- Quy tắc `condition`:
  - bắt buộc `attribute` + `operator`
  - dùng `amount` hoặc `quantity` tùy loại điều kiện
  - `attribute` thường gồm `GRAND_TOTAL`, `NUMBER_OF_SKUS`, `SHIPPING_INCL_TAX`.
- `applies_to` có thể là danh sách role IDs; mảng rỗng nghĩa là áp dụng toàn bộ roles.
- `status` mặc định là `ENABLED`.

---

## 6. `deletePurchaseOrderApprovalRule`

- Mục đích: xóa một hoặc nhiều approval rules theo danh sách UID.
- Input: `approval_rule_uids`.
- Output: thường trả `errors` (rỗng nếu thành công).
- Lưu ý vận hành:
  - nếu xóa rule đang dùng trong policy, cần xử lý trạng thái UI để tránh rule references cũ.

---

## 7. `updatePurchaseOrderApprovalRule`

- Mục đích: cập nhật rule hiện có dựa trên `uid`.
- Có thể cập nhật các trường như:
  - `name`, `description`, `status`, `applies_to`, `condition`, `approvers`.
- Điều kiện `condition` tuân thủ cùng format như mutation create.
- Thường dùng sau khi load chi tiết rule bằng query `purchase_order_approval_rule(uid)`.

---

## 8. `validatePurchaseOrders`

- Mục đích: chạy validate thủ công cho purchase orders khi quy trình tự động bị kẹt (ví dụ message queue gặp sự cố).
- Input: một hoặc nhiều `purchase_order_uids`.
- Output:
  - danh sách purchase orders sau khi validate (ví dụ trạng thái chuyển về `APPROVAL_REQUIRED`)
  - danh sách `errors`.
- Dùng như thao tác vận hành/phục hồi để giải phóng các PO đang treo ở trạng thái chờ.

---

## 9. Purchase order rule interfaces

- Interface chính: `PurchaseOrderApprovalRuleConditionInterface`.
- Interface này mô tả điều kiện trigger rule với các field nền tảng:
  - `attribute`
  - `operator`.
- Khi query chi tiết `condition`, cần dùng inline fragments để đọc field cụ thể theo implementation.

---

## 10. `PurchaseOrderApprovalRuleConditionInterface` implementations

- `PurchaseOrderApprovalRuleConditionAmount`:
  - dùng khi điều kiện dựa trên amount/currency.
- `PurchaseOrderApprovalRuleConditionQuantity`:
  - dùng khi điều kiện dựa trên quantity.
- Ví dụ query:
  - fragment `... on PurchaseOrderApprovalRuleConditionAmount { amount { value currency } }`
  - fragment `... on PurchaseOrderApprovalRuleConditionQuantity { quantity }`.

---

## 11. Ghi chú triển khai nhanh (B2B headless)

- Quyền truy cập:
  - map đúng company role cho màn hình quản trị approval rules.
- Form create/update:
  - luôn lấy metadata từ `purchase_order_approval_rule_metadata` thay vì hardcode options.
- Đồng bộ UI:
  - sau create/update/delete nên refresh danh sách `purchase_order_approval_rules`.
- Error handling:
  - render `errors` theo từng mutation để phân biệt lỗi validation input và lỗi quyền.
- Tương quan flow:
  - rule quyết định route duyệt cho purchase orders, nên hiển thị rõ impact khi chỉnh rule.
