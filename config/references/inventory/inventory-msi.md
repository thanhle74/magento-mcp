# Tham khảo: Quản lý Kho hàng (Inventory MSI)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-admin/inventory/introduction

---

## 1. Khái niệm Cốt lõi (MSI Core)

MSI (Multi-Source Inventory) là hệ thống quản lý kho đa nguồn, thay thế cho cơ chế CatalogInventory cũ.

- **Source (Nguồn):** Vị trí vật lý lưu kho (Kho hàng, Cửa hàng, Kho drop-ship). 
  - **Code:** Mã định danh duy nhất (không thể thay đổi sau khi tạo).
  - **GPS (Lat/Long):** Tọa độ để thuật toán Distance SSA hoạt động.
  - **Pickup Location:** Tải trọng cho phép khách hàng đến lấy hàng (Store Pickup).
- **Stock (Kho ảo):** Gom nhóm các Source để gán cho Sales Channels (hiện tại là Website).
  - **Quan hệ:** 1 Website chỉ được gán cho 1 Stock. 1 Stock có thể gán cho N Website.
  - **Thứ tự Ưu tiên (Priority):** Tại Stock level, có thể kéo thả các Source để quy định kho nào được trừ hàng (SSA Priority) trước.
  - **Lưu ý:** `Default Stock` (mã: `default`) không bao giờ được phép xóa.
- **Salable Quantity:** Số lượng thực sự có thể bán. Tính bằng: `Sum(Qty in Sources) - Reservations`.
- **Reservations (Đặt chỗ):** Cơ chế trừ kho tạm thời khi khách đặt hàng. Giúp tránh lock database và ngăn chặn overselling.
- **Lưu ý:** `Default Source` (mã: `default`) không bao giờ được phép tắt hoặc xóa.

---

## 2. Quy tắc lập trình với MSI

### Lấy số lượng Salable Qty (Get Salable Quantity)
Không dùng `CatalogInventory\Api\StockRegistryInterface` (đã deprecated). 
Dùng Service Contract mới:
- `Magento\InventorySalesApi\Api\GetProductSalableQtyInterface`

---

## 3. Vòng đời Reservation theo Trạng thái Đơn hàng

MSI tự động quản lý `Salable Quantity` thông qua các bản ghi Reservation:

| Trạng thái Đơn hàng | Tác động lên Reservation | Giải thích |
|---------------------|--------------------------|------------|
| **Mới (Pending)** | Tạo bản ghi `-Qty` | Trữ hàng ngay để tránh người khác mua mất. |
| **Hủy (Canceled)** | Tạo bản ghi `+Qty` | Giải phóng hàng, cộng lại vào Salable Qty. |
| **Hoàn tiền (Refund)** | Tạo bản ghi `+Qty` | Tùy chọn cộng lại vào kho nếu hàng còn tốt. |
| **Giao hàng (Shipped)** | Xóa Reservation & Trừ Qty Source | Chốt hạ việc trừ kho vật lý thực tế. |

---

## 4. MSI với các loại Sản phẩm (Product Types)

- **Configurable Product:** Salable Qty là tổng của tất cả các sản phẩm con (Simple) được gán trong Stock.
- **Bundle Product:** **RÀNG BUỘC QUAN TRỌNG:** Chỉ có thể gán cho **Default Source** và **Default Stock** trong Adobe Commerce hiện tại.
- **Grouped Product:** Hiển thị số lượng riêng lẻ của từng sản phẩm con.
- **Virtual / Downloadable:** Thường chỉ gán cho **Default Source** vì không cần vận chuyển vật lý.

---

## 5. Thuật toán chọn nguồn (SSA) & Giao hàng (Shipment)

### Thuật toán (Algorithms)
- **Priority (Ưu tiên):** Chọn kho theo thứ tự ưu tiên gán trong Stock.
- **Distance (Khoảng cách):** Chọn kho gần địa chỉ khách hàng nhất (Google Maps API hoặc Offline).

### Tạo Shipment đa nguồn (Multi-source Shipment)
- **SSA Recommendation:** Hệ thống tự động gợi ý nguồn hàng (`Source`) tối ưu khi tạo Shipment.
- **Manual Override:** Admin có thể thay đổi nguồn hàng thủ công cho từng sản phẩm trong đơn.
- **Split Shipment:** Một đơn hàng có thể giao từ nhiều kho khác nhau.

---

## 6. Chiến lược Triển khai (Planning)

- **Single Source:** Dùng `Default Source` & `Default Stock`. Tương thích tốt nhất với Module cũ.
- **Multi Source:** Tạo Source tùy chỉnh -> Tạo Stock -> Liên kết Website.

---

## 7. Thao tác Kho hàng loạt (Inventory Mass Actions)

Thực hiện tại **Catalog > Products** bằng cách chọn sản phẩm và dùng menu **Actions**:
- **Assign Sources:** Gán nhanh nhiều sản phẩm vào kho mới.
- **Transfer Inventory:** Di chuyển toàn bộ hàng từ kho nguồn sang kho đích.

---

## 8. Quản lý qua CLI (Maintenance)

- `bin/magento inventory:aggregate:all`: Tính toán lại toàn bộ `Salable Quantity`.
- `bin/magento inventory:reservation:list-inconsistencies`: Phát hiện lỗi lệch kho/đơn.
- `bin/magento inventory:reservation:cleanup`: Dọn dẹp reservation cũ.
- `bin/magento inventory-geocoordinates:import [country]`: Nạp tọa độ cho Distance SSA.
- `bin/magento queue:consumers:start product_alert`: Chạy tiến trình gửi email thông báo kho.

---

## 9. Hệ thống Thông báo & Kích cầu (Stock Alerts & UX)

- **Product Alerts:** Đăng ký nhận tin khi có hàng (`In-stock`) hoặc khi giảm giá (`Price drop`).
- **Scarcity Messages:** Hiện thông điệp "Chỉ còn X món" khi tồn kho chạm ngưỡng.

---

## 10. Vô hiệu hóa MSI (Disable MSI)

Tắt các module `Magento_Inventory*` trong `app/etc/config.php` để quay về cơ chế `CatalogInventory` cũ.

---

## Liên kết
- Catalog & Search: xem [search-navigation.md](./search-navigation.md)
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
