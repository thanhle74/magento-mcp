# Tham khảo: Quy trình Triển khai (Deployment Pipeline)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/deployment/overview

---

## 1. Mô hình 3 Hệ thống (Pipeline)

Để đạt hiệu suất tối đa và zero downtime, quy trình triển khai cần tách biệt:

1. **Development System:** Viết code, cài đặt module, cấu hình Shared Settings (`config.php`).
2. **Build System:**
   - Chạy `bin/magento setup:di:compile`
   - Chạy `bin/magento setup:static-content:deploy`
   - Đóng gói (Zip/Artifact) các thư mục: `generated/`, `pub/static/`, `var/view_preprocessed/`.
3. **Production System:** 
   - Giải nén Artifact.
   - Chạy `bin/magento setup:upgrade --keep-generated`.
   - KHÔNG chạy lệnh biên dịch trên Production để tránh treo máy chủ.

---

## 2. Quản lý Cấu hình (Config vs Env)

- **`app/etc/config.php`:** Lưu các thiết lập cố định (Danh sách module, Localized settings). **PHẢI** đưa vào Git.
- **`app/etc/env.php`:** Lưu thông tin môi trường (DB, Redis, S3, Sensitive data). **KHÔNG** đưa vào Git.

**Lệnh quan trọng:**
- `bin/magento app:config:dump`: Xuất các cấu hình hiện tại ra file `config.php`.
- `bin/magento app:config:import`: Nhập cấu hình từ file vào hệ thống.

---

## 3. Phân quyền (File Permissions)

### Môi trường Phát triển (1 User)
Dùng chung 1 user cho cả CLI và Web server.
- File: `664`, Folder: `775`.

### Môi trường Production (2 Users - Khuyên dùng)
- **Magento Owner:** Cầm quyền sở hữu file, chạy các lệnh CLI.
- **Web User (nginx/apache):** Chỉ có quyền đọc và ghi vào các thư mục cần thiết (`var`, `pub/static`, `pub/media`).

---

## 4. Biến môi trường (MAGE_*)

Sử dụng biến môi trường để ghi đè cấu hình mà không cần sửa file:
- `MAGE_MODE`: `developer` hoặc `production`.
- `MAGE_RUN_TYPE`, `MAGE_RUN_CODE`: Cho Multi-site.
- Định dạng ghi đè config: `CONFIG__DEFAULT__WEB__SECURE__BASE_URL`.

---

## Liên kết
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
