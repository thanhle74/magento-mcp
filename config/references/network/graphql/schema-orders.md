# GraphQL — Schema (Guide): Orders (queries + mutations + interfaces)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Orders**, tập trung vào **queries** (tra cứu đơn guest), **mutations** (hủy đơn, RMA/returns, reorder) và **interfaces** cho dữ liệu item trong lịch sử đơn hàng.

---

## 1. Orders (nhóm schema)

- Nhóm **Orders** trong GraphQL bao gồm:
  - mutations để xử lý vòng đời **return request (RMA)**: tạo request, xác nhận request guest, thêm comment, thêm/xóa tracking.
  - mutations để xử lý **hủy đơn** cho customer hoặc guest.
  - mutation **reorderItems** để thêm lại sản phẩm từ đơn cũ vào cart.
- Nhiều mutation phụ thuộc cấu hình store:
  - `returns_enabled` (bật RMA) qua `storeConfig`.
  - `order_cancellation_enabled` (bật hủy đơn) qua `storeConfig`.
  - `Allow Reorder` trong Sales config cho `reorderItems`.
- Có khác biệt giữa luồng:
  - **customer logged-in**: dùng customer token (ví dụ `requestReturn`, `cancelOrder`, `reorderItems`).
  - **guest**: dùng token/link xác thực từ đơn guest (ví dụ `requestGuestReturn`, `confirmReturn`, `requestGuestOrderCancel`).

---

## 2. Orders — danh sách mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `requestReturn` | Tạo yêu cầu trả hàng cho đơn của customer | §3 |
| `requestGuestReturn` | Tạo yêu cầu trả hàng cho đơn guest (trạng thái ban đầu `UNCONFIRMED`) | §4 |
| `requestGuestOrderCancel` | Guest gửi yêu cầu hủy đơn theo token + reason | §5 |
| `reorderItems` | Thêm lại sản phẩm từ đơn cũ vào cart customer | §6 |
| `removeReturnTracking` | Xóa tracking đã nhập trong return request | §7 |
| `confirmReturn` | Guest xác nhận yêu cầu trả hàng bằng confirmation key | §8 |
| `confirmCancelOrder` | Guest xác nhận hủy đơn bằng confirmation key | §9 |
| `cancelOrder` | Customer hủy đơn của chính mình | §10 |
| `addReturnTracking` | Thêm carrier/tracking number cho return request | §11 |
| `addReturnComment` | Thêm comment vào return request | §12 |

---

## 3. `requestReturn`

- Mục đích: customer khởi tạo RMA cho sản phẩm trong đơn đã mua.
- Điều kiện chính:
  - Đơn thuộc customer hiện tại.
  - `returns_enabled = true`.
  - Dùng `order_uid` + `order_item_uid` hợp lệ (thường lấy từ `customerOrders`).
- Input nổi bật: `order_uid`, `contact_email`, `comment_text`, danh sách `items` (`order_item_uid`, `quantity_to_return`).
- Output: `RequestReturnOutput` chứa `return` (status, items, comments, customer...).
- Thực tế flow: merchant sẽ duyệt/chấp thuận/từ chối ở bước sau.

---

## 4. `requestGuestReturn`

- Mục đích: guest tạo yêu cầu trả hàng cho đơn guest.
- Input nổi bật:
  - `token` của guest order.
  - `contact_email`, `comment_text`, `items`.
- Hành vi quan trọng:
  - Sau khi request, hệ thống gửi email xác nhận.
  - Trạng thái ban đầu thường là `UNCONFIRMED` cho tới khi guest xác nhận.
- Điều kiện:
  - `returns_enabled = true`.
  - token/order item hợp lệ của guest order.

---

## 5. `requestGuestOrderCancel`

- Mục đích: guest gửi yêu cầu hủy đơn bằng token đơn hàng guest.
- Input chính: `token`, `reason`.
- Điều kiện hủy:
  - `order_cancellation_enabled = true`.
  - Đơn có trạng thái cho phép hủy (`RECEIVED`, `PENDING`, `PROCESSING`).
- Output dạng `CancelOrderOutput`, thường gồm:
  - `order.status`
  - `error`/`errorV2` nếu không hủy được.

---

## 6. `reorderItems`

- Mục đích: customer đã đăng nhập thêm lại toàn bộ sản phẩm từ đơn cũ vào cart hiện tại.
- Yêu cầu:
  - Có customer token.
  - Customer trong token phải trùng customer đặt đơn.
  - Config `Allow Reorder = Yes`.
- Input: `orderNumber`.
- Output: `ReorderItemsOutput` gồm:
  - `cart` sau khi thêm item.
  - `userInputErrors` cho từng sản phẩm không thêm được.
- Error code thường gặp: `INSUFFICIENT_STOCK`, `NOT_SALABLE`, `REORDER_NOT_AVAILABLE`, `PRODUCT_NOT_FOUND`, `UNDEFINED`.
- Lưu ý: nếu gặp `REORDER_NOT_AVAILABLE` thì mutation không thêm sản phẩm nào.

---

## 7. `removeReturnTracking`

- Mục đích: xóa một dòng tracking đã nhập trong return request.
- Input chính: `return_shipping_tracking_uid`.
- Output: return object sau cập nhật; danh sách `shipping.tracking` có thể rỗng sau khi xóa.
- Dùng khi customer/guest đã nhập sai carrier hoặc tracking number.

---

## 8. `confirmReturn`

- Mục đích: guest xác nhận return request đã tạo trước đó.
- Input chính:
  - `order_id` (encoded)
  - `confirmation_key` (từ email xác nhận).
- Output: `RequestReturnOutput` với return status sau xác nhận (thường chuyển từ `UNCONFIRMED` sang trạng thái xử lý tiếp theo).
- Đây là bước bắt buộc trong flow guest return trước khi merchant xử lý.

---

## 9. `confirmCancelOrder`

- Mục đích: guest xác nhận hủy đơn bằng `order_id` + `confirmation_key`.
- Điều kiện tương tự luồng cancel guest:
  - `order_cancellation_enabled = true`.
  - Trạng thái đơn cho phép hủy.
- Kết quả:
  - Nếu đã capture thanh toán, đơn có thể về `CLOSED` và xử lý refund.
  - Nếu chưa capture, đơn thường chuyển `CANCELED`.
- Output: `CancelOrderOutput` với `order.status` và thông tin lỗi nếu có.

---

## 10. `cancelOrder`

- Mục đích: customer logged-in hủy đơn của chính mình.
- Input chính: `order_id`, `reason`.
- Điều kiện:
  - Đơn thuộc customer hiện tại.
  - `order_cancellation_enabled = true`.
  - Trạng thái đơn cho phép hủy.
- Kết quả business:
  - Đã thu tiền: thường đóng đơn (`CLOSED`) và đi kèm refund.
  - Chưa thu tiền: đơn về `CANCELED`.

---

## 11. `addReturnTracking`

- Mục đích: thêm thông tin vận chuyển trả hàng (carrier + tracking number) vào return request.
- Input chính: `return_uid`, `carrier_uid`, `tracking_number`.
- `carrier_uid` hợp lệ có thể lấy từ dữ liệu shipping carrier trong customer context.
- Output: `return_shipping_tracking` vừa tạo (uid, carrier, tracking number).

---

## 12. `addReturnComment`

- Mục đích: thêm comment vào return request đang tồn tại.
- Input chính: `return_uid`, `comment_text`.
- Output: return object với danh sách `comments` đã cập nhật.
- Dùng cho hội thoại customer/merchant trong tiến trình xử lý RMA.

---

## 13. Orders — interfaces

| Interface | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `ShipmentItemInterface` | Item đã giao trong shipment của order | §14 |
| `OrderItemInterface` | Item gốc trong order history | §15 |
| `InvoiceItemInterface` | Item đã được invoice | §16 |
| `CreditMemoItemInterface` | Item đã refund qua credit memo | §17 |

---

## 14. `ShipmentItemInterface`

- Dùng để biểu diễn item trong `shipments.items` của order.
- Mục đích: theo dõi những item thực sự đã gửi đi (khác với downloadable thường không có shipment).
- Implementations thường gặp:
  - `ShipmentItem`
  - `BundleShipmentItem`
  - `GiftCardShipmentItem`
- Khi query nên dùng inline fragment theo `__typename` để lấy field đặc thù (ví dụ bundle options).

---

## 15. `OrderItemInterface`

- Dùng cho `orders.items.items` trong lịch sử đơn hàng customer.
- Là interface nền tảng cho item cấp order, chứa field chung như:
  - thông tin sản phẩm (`product_name`, `product_sku`, `product_type`)
  - số lượng theo lifecycle (`quantity_ordered`, `quantity_invoiced`, `quantity_shipped`, `quantity_refunded`).
- Implementations thường gặp:
  - `OrderItem`
  - `BundleOrderItem`
  - `DownloadableOrderItem`
  - `GiftCardOrderItem`
- Headless UI nên render field chung trước, rồi mở rộng theo fragment cho từng product type.

---

## 16. `InvoiceItemInterface`

- Dùng trong `orders.items.invoices.items` để biểu diễn item đã được invoiced.
- Hữu ích cho màn hình finance/accounting và timeline thanh toán đơn.
- Implementations thường gặp:
  - `InvoiceItem`
  - `BundleInvoiceItem`
  - `DownloadableInvoiceItem`
  - `GiftCardInvoiceItem`
- Có thể kết hợp với `OrderItemInterface` để đối chiếu ordered vs invoiced vs shipped vs refunded.

---

## 17. `CreditMemoItemInterface`

- Dùng trong `orders.items.credit_memos.items` để biểu diễn item đã refund.
- Phục vụ các use case hậu mãi/hoàn tiền (refund history).
- Implementations thường gặp:
  - `CreditMemoItem`
  - `BundleCreditMemoItem`
  - `DownloadableCreditMemoItem`
  - `GiftCardCreditMemoItem`
- Thường dùng cùng `quantity_refunded` và dữ liệu credit memo để hiển thị mức refund theo item.

---

## 18. Ghi chú triển khai nhanh (headless)

- Với flow **returns**:
  - customer: `requestReturn` → (tuỳ case) `addReturnComment` / `addReturnTracking` / `removeReturnTracking`.
  - guest: `requestGuestReturn` → `confirmReturn` → các bước cập nhật return.
- Với flow **order cancellation**:
  - customer: `cancelOrder`.
  - guest: `requestGuestOrderCancel` (nếu tích hợp luồng xác nhận) → `confirmCancelOrder`.
- Với flow **reorder**:
  - gọi `reorderItems` rồi đọc `userInputErrors` để thông báo partial success trên UI.
- Với flow **order-history item detail**:
  - query item qua các interface `OrderItemInterface` / `InvoiceItemInterface` / `ShipmentItemInterface` / `CreditMemoItemInterface`.
  - luôn thêm `__typename` + inline fragments để lấy field đặc thù cho bundle, downloadable, gift card.

---

## 19. Orders — queries

| Query | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `guestOrder` | Tra cứu đơn guest bằng `number + email + lastname` | §20 |
| `guestOrderByToken` | Tra cứu đơn guest bằng `token` | §21 |

---

## 20. `guestOrder`

- Mục đích: lấy thông tin đơn cho khách chưa đăng nhập (hoặc không đăng nhập lúc mua).
- Input: `GuestOrderInformationInput` gồm:
  - `number` (order number)
  - `email`
  - `lastname`
- Output: `CustomerOrder` (status, order date, number, billing address, items...) và thường trả cả `token` để dùng cho các bước guest flow sau đó.
- Use case phổ biến:
  - trang “Track my order” theo thông tin checkout guest.
  - bootstrap dữ liệu để gọi `guestOrderByToken` ở các request tiếp theo.

---

## 21. `guestOrderByToken`

- Mục đích: lấy thông tin đơn guest trực tiếp theo token, không cần nhập lại number/email/lastname.
- Input: `OrderTokenInput` với `token` (thường lấy từ `guestOrder` hoặc từ response `placeOrder` dạng guest).
- Output: `CustomerOrder`.
- Use case phổ biến:
  - deep-link từ email guest.
  - session guest đã lưu token và cần refresh trạng thái đơn.
