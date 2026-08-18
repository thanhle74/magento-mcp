# Tham khảo: Quản lý Đa website (Multi-site)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/multi-sites/ms-overview

---

## 1. Phân cấp hệ thống (Hierarchy)

- **Global:** Cấu hình mặc định cho toàn bộ hệ thống.
- **Website:** Tầng quản lý cao nhất của cửa hàng. Có thể có danh mục khách hàng riêng, tiền tệ riêng và giá sản phẩm riêng.
- **Store:** Nhóm các store view. Dùng để chỉ định Root Category khác nhau cho từng cấu trúc menu.
- **Store View:** Tầng hiển thị. Dùng để thay đổi ngôn ngữ, định dạng ngày tháng và giao diện (Theme).

---

## 2. Cấu hình máy chủ (Nginx)

Để Magento biết cần tải Website/Store View nào, máy chủ web phải truyền biến `MAGE_RUN_TYPE` và `MAGE_RUN_CODE`.

**Ví dụ Nginx Map**:
```nginx
map $http_host $MAGE_RUN_CODE {
    default '';
    vn.mysite.com vn_site;
    us.mysite.com us_site;
}

server {
    listen 80;
    server_name mysite.com vn.mysite.com us.mysite.com;
    set $MAGE_ROOT /var/www/html/magento2;
    set $MAGE_RUN_TYPE website; # Hoặc 'store'
    include /var/www/html/magento2/nginx.conf.sample;
}
```

---

## 3. Quản lý Increment ID (Mã đơn hàng)

Magento sử dụng các bảng `sequence_*` để quản lý số thứ tự cho đơn hàng, hóa đơn theo từng Store.

**Cách đổi số bắt đầu cho Store ID 1**:
```sql
-- Kiểm tra bảng sequence_order_1 (số 1 là store_id)
ALTER TABLE sequence_order_1 AUTO_INCREMENT = 200000;
```
*Kết quả: Đơn hàng tiếp theo của Store 1 sẽ bắt đầu từ #1000020000.*

---

## 4. Kiểm tra Scope trong Code

Khi lấy cấu hình từ `ScopeConfigInterface`, luôn chỉ định scope để đảm bảo độ chính xác.

```php
use Magento\Store\Model\ScopeInterface;

// Lấy config ở tầng Store View hiện tại
$value = $this->scopeConfig->getValue(
    'path/to/config',
    ScopeInterface::SCOPE_STORE
);

// Lấy config của một Website cụ thể qua ID
$value = $this->scopeConfig->getValue(
    'path/to/config',
    ScopeInterface::SCOPE_WEBSITE,
    $websiteId
);
```

---

## Liên kết
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Web API (Multi-store support): xem [web-api.md](./web-api.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
