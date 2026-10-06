# Tham khảo: Quản lý Cache (Cache Management)

Nguồn: https://developer.adobe.com/commerce/php/development/cache/partial/

---

> Từ khóa tra cứu: cache tag, clean_cache_by_tags, invalidation, ETag, 304, If-None-Match, MSI stock cache, CacheInterface clean, stale cache, block_html MISS, FPM exhaustion, CatalogWidget, cache_lifetime, FIND_IN_SET, finset.

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

### ⚠️ Hợp đồng `clean($tags)` của `App\Cache\Proxy` — bẫy runtime đã xác chứng

`Magento\Framework\App\CacheInterface` khi chạy thực tế là `Magento\Framework\App\Cache\Proxy`,
mà `Proxy::clean(array $tags)` **không nhận `$mode` kiểu Zend**. Truyền cú pháp Zend legacy
`clean(\Zend_Cache::CLEANING_MODE_MATCHING_TAG, ['my_tag'])` sẽ khiến **chuỗi mode trở thành
một tag** — lệnh chạy không lỗi nhưng là no-op im lặng (bằng chứng redis MONITOR:
`SINTER zc:ti:<prefix>MATCHINGTAG`).

```php
// ✅ ĐÚNG — hợp đồng Proxy: mảng tag thuần (semantics MATCHING_ANY_TAG; 1 tag ≡ matching)
$this->cache->clean(['my_custom_cache_tag']);

// ❌ SAI — no-op im lặng trên runtime Proxy
$this->cache->clean(\Zend_Cache::CLEANING_MODE_MATCHING_TAG, ['my_custom_cache_tag']);
```

Unit test với mock chỉ assert **call** chứ không assert hành vi backend → không bắt được
defect này. Bắt buộc chứng minh runtime khi đổi logic invalidation (xem
[../ops/unit-testing.md](../ops/unit-testing.md) §10).

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

## 9. Varnish Cache & ESI (Edge Side Includes)

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

## 10. Kiểm tra trạng thái Cache (Headers)

Luôn kiểm tra các Header sau để biết Cache có hoạt động hay không (chế độ Developer):
- **X-Magento-Cache-Control**: `max-age=...` (Thời gian cache còn lại).
- **X-Magento-Cache-Debug**: `HIT` hoặc `MISS` (Varnish/FPC có nhận hay không).
- **X-Magento-Tags**: Danh sách nhãn thực thể có trong trang (Dùng để Purge).

---

## 11. Cache tự build: invalidation phải phủ MỌI nguồn dữ liệu (bài học runtime)

Khi module tự lưu response/DTO cache, tag invalidation phải phủ **mọi nguồn dữ liệu đi vào
cache entry** — không chỉ nguồn "rõ ràng" nhất:

- Product save/delete: `catalog_product_save_commit_after` / `catalog_product_delete_commit_after`.
- **MSI stock/salability**: thay đổi tồn kho qua MSI indexer **KHÔNG phát sinh** bất kỳ
  event `catalog_product_save_*` nào. Core dùng event Magento-native `clean_cache_by_tags`
  với `CacheContext` mang identities `Magento\Catalog\Model\Product::CACHE_TAG`
  (`cat_p_<id>`) — wired qua `module-inventory-cache/etc/di.xml` cho cả source-item sync
  strategy lẫn reservation salability queue. Observer trên event này với prefix `cat_p`
  cho coverage ngang FPC của core.
- Pricing (catalog price rule), url_rewrite, config (`core_config_data` — nhớ config là
  per-scope, invalidation theo đúng scope đã lưu), CMS block/page: mỗi nguồn một event riêng.

Nếu **không thể chứng minh** phủ được một nguồn: cache lifetime phải có giới hạn (bounded
TTL, admin-tunable) — stale-correctness tradeoff phải là lựa chọn có chủ đích, không phải
mặc định ngầm.

## 12. ETag/304 ≠ tránh backend work

`ETag` tính từ body **sau khi body đã được tính xong** (vd `sha1($body)`). 304 chỉ tiết kiệm
**bandwidth**, không tiết kiệm computation của request đó. Ba tầng riêng biệt:

| Tầng | Cơ chế | Tiết kiệm gì |
|---|---|---|
| Bandwidth | ETag + If-None-Match → 304 | bytes truyền |
| Backend | application cache (load/save trong controller/service) | computation + SQL |
| Edge | CDN/Varnish theo Cache-Control | cả request không chạm origin |

Review: đừng ghi "ETag giảm tải server" — chỉ đúng khi kèm application cache hoặc edge cache.

---

## 13. block_html MISS storm → FPM exhaustion (chuỗi sự cố)

Block lưu trong `block_html` mà **cache MISS** nghĩa là **mỗi request** render lại block trong
FPM worker — kèm query nặng bên trong thì MISS × traffic cao = hết worker:

```
block MISS (lifetime=0 / key không hit)
  → render block trong request PHP
  → query nặng chạy lại mỗi request (FIND_IN_SET, join lớn, ...)
  → FPM worker pool cạn → các request khác (kể cả health check) chờ/killed
```

Chẩn đoán theo thứ tự:

1. **Hit rate `block_html`**: `bin/magento cache:status` + keyspace Redis (db `block_html`) —
   hit rate thấp bất thường khi traffic ổn định là dấu hiệu MISS storm.
2. **Slow log FPM** (`request_slowlog_timeout`) + MySQL slow log: block nào render nhiều lần
   mỗi giây, query nào lặp — victim là FPM, **culprit thường là block MISS**, đừng kết án nhầm.
3. **Widget/block với `cache_lifetime=0`** (hoặc không khai `cache_lifetime` trong `widget.xml`)
   → không bao giờ vào cache — xem mục dưới.

Fix: đặt `cache_lifetime` hợp lý cho widget/block, thêm `cache` section + identity đúng
(§3), hoặc prefetch dữ liệu qua application cache thay vì query trong render.

---

## 14. CatalogWidget — `finset` (FIND_IN_SET) + `cache_lifetime`

`catalog_products_list` (CatalogWidget) lọc SKU qua điều kiện `finset` → sinh
`FIND_IN_SET(sku, :list)` trong SQL — **không dùng index được**, chi phí tuyến tính theo
bảng sản phẩm, nặng hơn nhiều so với `in`/`eq`.

- Widget có điều kiện SKU list mà `cache_lifetime=0` (không set trong `widget.xml` hoặc
  instance widget) → **mỗi page view chạy lại FIND_IN_SET full-scan** — kết hợp với §13 là
  công thức FPM exhaustion kinh điển trên PLP có nhiều widget.
- Quy tắc: widget SKU-list **bắt buộc** khai `cache_lifetime > 0` trong `widget.xml`
  (block của CatalogWidget hỗ trợ block cache) + cache key theo tham số (SKU list, category,
  page) để không trả nhầm dữ liệu giữa các instance widget.
- Cần lọc động theo nhiều SKU? Cân nhắc `in` trên attribute index được thay vì `finset` trên
  varchar thuần.

> Di cache compiled (`GLOBAL__DICONFIG`) và chuỗi "sửa di.xml nhưng output cũ" là chủ đề
> deploy — xem [../ops/deploy-troubleshooting.md](../ops/deploy-troubleshooting.md).

---

## Liên kết

- Maintenance CLI: xem [maintenance-cli.md](../ops/maintenance-cli.md)
- Architectural Patterns: xem [architectural-patterns.md](../core/architectural-patterns.md)
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
