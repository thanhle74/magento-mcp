# Tham khảo: Quản lý Cache (Cache Management)

Nguồn: https://developer.adobe.com/commerce/php/development/cache/partial/

---

## 1. Khai báo Cache Type mới

Nếu module của bạn có dữ liệu tính toán phức tạp (vd: bảng giá riêng), hãy tạo Cache Type riêng.

**`etc/cache.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Cache/etc/cache.xsd">
    <type name="my_custom_cache" translate="label,description">
        <label>My Custom Cache</label>
        <description>Dùng để lưu dữ liệu tính toán riêng của MyModule.</description>
    </type>
</config>
```

---

## 2. Thao tác với Cache (PHP)

Luôn dùng `Magento\Framework\App\CacheInterface` để thực hiện.

```php
// Inject CacheInterface và SerializerInterface
public function __construct(CacheInterface $cache, SerializerInterface $serializer) {
    $this->cache = $cache;
    $this->serializer = $serializer;
}

// LƯU DỮ LIỆU
$this->cache->save(
    $this->serializer->serialize($data),
    'unique_cache_id',
    ['my_custom_cache_tag'], // Tag để xóa hàng loạt
    3600 // Thời gian sống (giây)
);

// LẤY DỮ LIỆU
$data = $this->serializer->unserialize($this->cache->load('unique_cache_id'));
```

---

## 3. Tự động xóa Cache (IdentityInterface)

Dùng cho Models hoặc Blocks để tự động xóa cache khi thực thể thay đổi.

```php
use Magento\Framework\DataObject\IdentityInterface;

class MyBlock extends Template implements IdentityInterface {
    public function getIdentities() {
        return [\Vendor\Module\Model\MyModel::CACHE_TAG . '_' . $this->getId()];
    }
}
```

---

## 4. Vô hiệu hóa Cache (Invalidation)

Khi dữ liệu gốc thay đổi, hãy báo cho hệ thống cần làm mới cache.

```php
// Inject TypeListInterface
$this->cacheTypeList->invalidate('my_custom_cache');
```

---

## 5. Phân tách Nội dung Public & Private

Để tối ưu Full Page Cache (FPC/Varnish), phải phân tách dữ liệu:

- **Public Content (Server-side):** Thông tin chung (Mô tả SP, Layout). Lưu trong FPC. KHÔNG dùng Session PHP ở đây.
- **Private Content (Client-side):** Thông tin cá nhân (Giỏ hàng, Wishlist). KHÔNG lưu trong FPC. Load qua AJAX từ trình duyệt.

---

## 6. Xử lý dữ liệu Private (CustomerData)

### Bước 1: Tạo Section Source (PHP)
Class trả về mảng dữ liệu riêng tư.
```php
class MySection implements \Magento\Customer\CustomerData\SectionSourceInterface {
    public function getSectionData() {
        return ['custom_message' => 'Chào mừng bạn quay lại!'];
    }
}
```

### Bước 2: Đăng ký Section (di.xml)
```xml
<type name="Magento\Customer\CustomerData\SectionPoolInterface">
    <arguments>
        <argument name="sectionSourceMap" xsi:type="array">
            <item name="my-custom-data" xsi:type="string">Vendor\Module\CustomerData\MySection</item>
        </argument>
    </arguments>
</type>
```

### Bước 3: Cấu hình Invalidation (sections.xml)
Tự động làm mới dữ liệu khi có hành động POST.

**`etc/frontend/sections.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Customer:etc/sections.xsd">
    <action name="mymodule/action/post">
        <section name="my-custom-data"/>
    </action>
</config>
```

### Bước 4: Hiển thị ở Frontend (JS/HTML)
Dùng Knockout.js để lấy dữ liệu từ `customerData`.
```javascript
this.myData = customerData.get('my-custom-data');
```

---

## 7. Cấu hình Redis & Valkey (Backends)

Dùng cho môi trường Production để đạt hiệu suất tối đa.

### Redis (Mặc định)
- Backend: `Magento\Framework\Cache\Backend\Redis`
- Thông số quan trọng: `compress_data => 1`, `maxmemory-policy => volatile-lru`.

### Valkey (Khuyên dùng từ 2.4.8+)
- Backend: `Magento\Framework\Cache\Backend\Valkey`
- **Tính năng Preload:** Giúp tải trước các key cấu hình quan trọng.

**Cấu hình trong `env.php`**:
```php
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\Framework\Cache\Backend\Valkey',
            'backend_options' => [
                'server' => '127.0.0.1', 'database' => '0', 'port' => '6379',
                'compress_data' => '1',
                'preload_keys' => [
                    'EAV_ENTITY_TYPES', 'GLOBAL_PLUGIN_LIST', 'DB_IS_UP_TO_DATE', 'SYSTEM_DEFAULT'
                ]
            ]
        ],
        'page_cache' => [
            'backend' => 'Magento\Framework\Cache\Backend\Valkey',
            'backend_options' => [
                'server' => '127.0.0.1', 'database' => '1', 'port' => '6379',
                'compress_data' => '1'
            ]
        ]
    ]
]
```

---

## 8. Level 2 Cache (L2) & Stale Cache

Dùng cho môi trường Multi-node hoặc website có lưu lượng truy cập cực lớn để tránh hiện tượng "Cache Stampede".

### Level 2 Cache (L2)
Sử dụng `RemoteSynchronizedCache` để làm "kho tổng" dùng chung cho toàn máy chủ, giảm tải cho Database chính.

### Stale Cache (Dữ liệu cũ)
Cho phép trả về dữ liệu hết hạn (`stale`) trong lúc tiến trình khác đang tạo lại cache mới. Khuyên dùng cho: `block_html`, `full_page`, `layout`, `translate`.

**Cấu hình trong `app/etc/env.php`**:
```php
'cache' => [
    'frontend' => [
        'stale_cache_enabled' => [
            'backend' => '\Magento\Framework\Cache\Backend\RemoteSynchronizedCache',
            'backend_options' => [
                'remote_backend' => '\Magento\Framework\Cache\Backend\Redis',
                'remote_backend_options' => [
                    'server' => 'localhost',
                    'database' => '1',
                    'port' => '6379'
                ],
                'use_stale_cache' => true // Bật cơ chế Stale
            ],
        ]
    ],
    'type' => [
        'block_html' => ['frontend' => 'stale_cache_enabled'],
        'full_page' => ['frontend' => 'stale_cache_enabled']
    ]
]
```

---

## 8. Varnish Cache & ESI (Edge Side Includes)

Varnish là giải pháp Page Cache khuyên dùng cho môi trường Production.

### Cơ chế ESI
Cho phép cache từng phần (partial caching) của một trang. Những thành phần có `ttl` riêng sẽ được Varnish xử lý độc lập.

**Cách dùng trong Layout XML**:
```xml
<referenceContainer name="content">
    <!-- Block này sẽ được Varnish cache độc lập trong 1 giờ (3600s) -->
    <block class="Vendor\Module\Block\MyBlock" template="Vendor_Module::test.phtml" ttl="3600"/>
</referenceContainer>
```

### Static Content Signing
Tự động thêm version vào URL file tĩnh (JS, CSS) để Varnish có thể cache vô thời hạn. 
- Bật trong Admin: `Stores > Configuration > Advanced > Developer > Static Files Settings`.

---

## 9. Kiểm tra trạng thái Cache (Headers)

Luôn kiểm tra các Header sau để biết Cache có hoạt động hay không (chế độ Developer):
- **X-Magento-Cache-Control**: `max-age=...` (Thời gian cache còn lại).
- **X-Magento-Cache-Debug**: `HIT` hoặc `MISS` (Varnish/FPC có nhận hay không).
- **X-Magento-Tags**: Danh sách nhãn thực thể có trong trang (Dùng để Purge).

---

## Liên kết

- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Architectural Patterns: xem [architectural-patterns.md](./architectural-patterns.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
