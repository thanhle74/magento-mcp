# Tham khảo: Danh mục Đường dẫn Cấu hình (Config Paths)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/paths/config-reference-general

---

## 1. Nhóm Web & SEO (web/*)

Dùng để cấu hình URL và các thiết lập trình duyệt.

- `web/unsecure/base_url`: URL mặc định (HTTP).
- `web/secure/base_url`: URL bảo mật (HTTPS).
- `web/seo/use_rewrites`: Bật/tắt URL Rewrite (thân thiện SEO).
- `web/cookie/cookie_lifetime`: Thời gian sống của Cookie.
- `web/secure/use_in_frontend`: Ép buộc dùng HTTPS ở Storefront.
- `web/secure/use_in_adminhtml`: Ép buộc dùng HTTPS ở Admin.

---

## 2. Nhóm Tổng quát (general/*)

- `general/country/default`: Quốc gia mặc định.
- `general/locale/code`: Ngôn ngữ hệ thống (vd: `en_US`, `vi_VN`).
- `general/locale/timezone`: Múi giờ.
- `general/store_information/name`: Tên cửa hàng.
- `general/single_store_mode/enabled`: Bật chế độ 1 cửa hàng duy nhất.

---

## 3. Nhóm Tiền tệ (currency/*)

- `currency/options/base`: Tiền tệ gốc (Dùng để tính toán trong DB).
- `currency/options/default`: Tiền tệ hiển thị mặc định.
- `currency/options/allow`: Các tiền tệ được phép sử dụng.

---

## 4. Nhóm An ninh (admin/security/*)

- `admin/security/session_lifetime`: Thời gian phiên làm việc Admin.
- `admin/security/use_form_key`: Bật Form Key chống tấn công CSRF.
- `admin/security/admin_account_sharing`: Cho phép/Chặn dùng chung tài khoản Admin.
- `admin/security/lockout_threshold`: Số lần đăng nhập sai tối đa trước khi khóa.

---

## 5. Nhóm Hệ thống (system/*)

- `system/full_page_cache/caching_application`: Loại cache (Built-in hoặc Varnish).
- `system/full_page_cache/ttl`: Thời gian sống của Page Cache.
- `system/smtp/host`: Máy chủ gửi thư.
- `system/media_storage_configuration/media_storage`: Loại lưu trữ media (File system hoặc Database/S3).
- `system/cron/default/schedule_generate_every`: Tần suất tạo lịch chạy Cron.

---

## 6. Nhóm Developer (dev/*)

- `dev/debug/template_hints_storefront`: Bật gợi ý Template (.phtml) ở Storefront.
- `dev/js/minify_files`: Bật nén file JS.
- `dev/css/minify_files`: Bật nén file CSS.
- `dev/static/sign`: Bật chữ ký phiên bản cho file tĩnh (Tránh kẹt cache trình duyệt).

---

## 7. Nhóm Catalog (catalog/*)

- `catalog/frontend/list_mode`: Chế độ hiển thị (Grid/List).
- `catalog/search/engine`: Bộ máy tìm kiếm (opensearch/elasticsearch7).
- `catalog/search/min_query_length`: Độ dài từ khóa tối thiểu.
- `cataloginventory/options/show_out_of_stock`: Hiện sản phẩm hết hàng.
- `catalog/seo/product_url_suffix`: Đuôi link sản phẩm (vd: `.html`).

---

## 8. Nhóm Customer (customer/*)

- `customer/create_account/confirm`: Bắt buộc xác nhận email.
- `customer/password/minimum_password_length`: Độ dài mật khẩu tối thiểu.
- `newsletter/subscription/allow_guest_subscribe`: Khách vãng lai đăng ký tin.
- `wishlist/general/active`: Bật tính năng danh sách yêu thích.

---

## 9. Nhóm Sales & Checkout (sales/* & checkout/*)

- `checkout/options/guest_checkout`: Cho phép mua hàng khách (Guest).
- `tax/display/type`: Hiển thị giá (Có thuế/Không thuế).
- `sales/identity/email`: Email gửi thông báo đơn hàng.
- `shipping/shipping_policy/enable_shipping_policy`: Chính sách giao hàng.

---

## 10. Kỹ thuật Ghi đè (Overrides)

Sử dụng biến môi trường hoặc `env.php` để ghi đè cấu hình Admin.

- **Định dạng biến môi trường:** `CONFIG__<SCOPE>__<PATH>`
  - Thay dấu `/` bằng `__`.
  - Ví dụ: `CONFIG__DEFAULT__CATALOG__SEARCH__ENGINE=opensearch`
- **Thứ tự ưu tiên:** 
  1. Biến môi trường (`Environment Variables`) - Cao nhất.
  2. File `app/etc/env.php`.
  3. File `app/etc/config.php`.
  4. Cơ sở dữ liệu (`core_config_data`).

---

## Liên kết
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
