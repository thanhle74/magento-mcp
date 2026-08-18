# Tham khảo: Quản lý Lưu trữ và Phương tiện (Storage & Media)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/storage/remote-storage/remote-storage-aws-s3

---

## 1. Lưu trữ đám mây (AWS S3 / Remote Storage)

Cho phép đẩy toàn bộ `pub/media` lên S3 để máy chủ web trở thành stateless.

**Cấu hình trong `app/etc/env.php`**:
```php
'remote_storage' => [
    'driver' => 'aws_s3',
    'config' => [
        'bucket' => 'my-magento-bucket',
        'region' => 'us-east-1',
        // 'credentials' => [ // Nếu dùng key thay vì IAM Role
        //     'key' => 'YOUR_ACCESS_KEY',
        //     'secret' => 'YOUR_SECRET_KEY'
        // ]
    ]
]
```

**Quy tắc lập trình quan trọng:**
TUYỆT ĐỐI không dùng các hàm PHP Native (`copy`, `rename`, `file_put_contents`) cho media. Luôn dùng `Magento\Framework\Filesystem\DriverInterface`.

---

## 2. Trình phân tích Database (DB Profiler)

Dùng để debug các câu lệnh SQL chạy chậm.

**Bật trong `app/etc/env.php`**:
```php
'db' => [
    'connection' => [
        'default' => [
            // ... các cấu hình khác ...
            'profiler' => [
                'class' => '\Magento\Framework\DB\Profiler',
                'enabled' => true,
            ],
        ]
    ]
]
```

**Hiển thị kết quả (Tạm thời thêm vào `pub/index.php`)**:
```php
/** @var \Magento\Framework\App\ResourceConnection $res */
$res = \Magento\Framework\App\ObjectManager::getInstance()->get('Magento\Framework\App\ResourceConnection');
$profiler = $res->getConnection('read')->getProfiler();
// Output bảng dữ liệu truy vấn ở đây...
```

---

## 3. Session Storage (Redis / Memcached)

Ưu tiên dùng Redis để chia sẻ phiên làm việc giữa nhiều máy chủ.

**Cấu hình CLI**:
`bin/magento setup:config:set --session-save=redis --session-save-redis-host=127.0.0.1 --session-save-redis-db=2`

---

## 4. Chia tách Database (Split Database - Magento Commerce)

Dành cho hệ thống High-Traffic để tách gánh nặng cho Database chính.

### Tách Database Giỏ hàng (Checkout/Quote)
Di chuyển các bảng liên quan tới giỏ hàng sang DB riêng.
- `bin/magento setup:db-schema:split-quote --host="..." --dbname="magento_quote" --username="..." --password="..."`

### Tách Database Đơn hàng (Sales/OMS)
Di chuyển các bảng đơn hàng, hóa đơn, giao hàng sang DB riêng.
- `bin/magento setup:db-schema:split-sales --host="..." --dbname="magento_sales" --username="..." --password="..."`

### Cấu hình sau khi tách (env.php)
Hệ thống sẽ tự động tạo thêm các kết nối:
- `connection > checkout`
- `connection > sales`

---

## Liên kết
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Cache Management: xem [cache-management.md](./cache-management.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
