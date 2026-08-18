# Tham khảo: Performance Optimization

Nguồn: https://developer.adobe.com/commerce/php/best-practices/performance/

---

## 1. N+1 Query Problem

N+1 là anti-pattern phổ biến nhất trong Magento: load 1 collection (1 query), sau đó loop và load thêm data cho từng item (N queries).

### Ví dụ N+1 (BAD)

```php
// 1 query lấy orders
$orders = $this->orderRepository->getList($searchCriteria)->getItems();

foreach ($orders as $order) {
    // N queries — mỗi order 1 query lấy customer
    $customer = $this->customerRepository->getById($order->getCustomerId());
    echo $customer->getEmail();
}
```

### Giải pháp: Eager loading

```php
// Load tất cả customer IDs trước
$customerIds = array_map(fn($order) => $order->getCustomerId(), $orders);

// 1 query lấy tất cả customers
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('entity_id', $customerIds, 'in')
    ->create();
$customers = $this->customerRepository->getList($searchCriteria)->getItems();

// Index theo ID để lookup O(1)
$customerMap = [];
foreach ($customers as $customer) {
    $customerMap[$customer->getId()] = $customer;
}

foreach ($orders as $order) {
    $customer = $customerMap[$order->getCustomerId()] ?? null;
}
```

### Eager loading với Collection

```php
// Thay vì load từng attribute riêng lẻ
$collection = $this->productCollectionFactory->create();
$collection->addAttributeToSelect('*');  // Load tất cả attributes trong 1 query

// Hoặc chỉ load attributes cần thiết
$collection->addAttributeToSelect(['name', 'price', 'sku', 'status']);

// Join bảng liên quan thay vì query riêng
$collection->joinField(
    'qty',
    'cataloginventory_stock_item',
    'qty',
    'product_id=entity_id',
    '{{table}}.stock_id=1'
);
```

---

## 2. Magento Profiler

Magento có built-in profiler để đo thời gian thực thi từng phần.

### Bật Profiler

```php
// app/etc/env.php
return [
    'MAGE_PROFILER' => 'html',  // hoặc 'csvfile', 'firebug'
];
```

Hoặc qua env variable:
```bash
export MAGE_PROFILER=html
```

### Dùng Profiler trong code

```php
use Magento\Framework\Profiler;

Profiler::start('vendor_module_heavy_operation');
// ... code cần đo ...
Profiler::stop('vendor_module_heavy_operation');
```

### Đọc kết quả

Profiler hiển thị ở cuối trang (HTML mode) với:
- Timer name
- Count (số lần gọi)
- Avg time
- Sum time
- % of total

---

## 3. Database Query Optimization

### Luôn có index cho column thường query

```xml
<!-- db_schema.xml -->
<index referenceId="VENDOR_MODULE_ENTITY_STATUS_CREATED_AT" indexType="btree">
    <column name="status"/>
    <column name="created_at"/>
</index>
```

### Tránh SELECT * trong custom queries

```php
// BAD
$connection->fetchAll("SELECT * FROM sales_order WHERE status = 'pending'");

// GOOD
$connection->fetchAll(
    $connection->select()
        ->from('sales_order', ['entity_id', 'increment_id', 'customer_email'])
        ->where('status = ?', 'pending')
        ->limit(100)
);
```

### Dùng `addFieldToFilter` thay vì PHP filter

```php
// BAD — load tất cả rồi filter trong PHP
$allItems = $collection->getItems();
$filtered = array_filter($allItems, fn($item) => $item->getStatus() === 'active');

// GOOD — filter ở DB level
$collection->addFieldToFilter('status', 'active');
$filtered = $collection->getItems();
```

---

## 4. Cache Strategy

### Khi nào nên cache

- Dữ liệu tính toán phức tạp (price rules, config aggregation)
- Dữ liệu ít thay đổi nhưng đọc nhiều
- External API responses

### Khi nào KHÔNG nên cache

- Dữ liệu per-customer (giỏ hàng, wishlist) — dùng CustomerData sections
- Dữ liệu thay đổi real-time (stock qty trong flash sale)

### Cache với TTL hợp lý

```php
// Cache 1 giờ
$this->cache->save(
    $this->serializer->serialize($data),
    'vendor_module_' . $entityId,
    ['vendor_module_cache_tag'],
    3600
);

// Invalidate khi data thay đổi
$this->cacheTypeList->invalidate('vendor_module_cache_type');
```

---

## 5. Varnish / Full Page Cache

### Headers quan trọng để debug

```
X-Magento-Cache-Control: max-age=86400, public, s-maxage=86400
X-Magento-Cache-Debug: HIT    # Varnish đã serve từ cache
X-Magento-Cache-Debug: MISS   # Varnish phải fetch từ Magento
X-Magento-Tags: cat_1,cat_2,cms_b_1  # Cache tags của trang
```

### Trang không được cache (MISS liên tục)

Nguyên nhân thường gặp:
1. Session PHP được set trong request (dùng `$_SESSION` hoặc `Magento\Framework\Session`)
2. Cookie không nằm trong whitelist của Varnish
3. Block có `cacheable="false"` trong layout XML
4. Response có `Cache-Control: no-cache`

### ESI cho partial caching

```xml
<!-- Block có TTL riêng, Varnish cache độc lập -->
<block class="Vendor\Module\Block\MyBlock"
       template="Vendor_Module::my_template.phtml"
       ttl="3600" />
```

---

## 6. Redis Optimization

### Preload keys (Magento 2.4.8+ với Valkey)

```php
// app/etc/env.php
'cache' => [
    'frontend' => [
        'default' => [
            'backend_options' => [
                'preload_keys' => [
                    'EAV_ENTITY_TYPES',
                    'GLOBAL_PLUGIN_LIST',
                    'DB_IS_UP_TO_DATE',
                    'SYSTEM_DEFAULT'
                ]
            ]
        ]
    ]
]
```

### Tách database cho page_cache

```php
// Dùng database khác nhau để tránh eviction lẫn nhau
'default' => ['database' => '0'],
'page_cache' => ['database' => '1'],
```

---

## 7. PHP OPcache

Bắt buộc bật trong production:

```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=512
opcache.max_accelerated_files=60000
opcache.validate_timestamps=0  ; Production: tắt để không check file mtime
opcache.revalidate_freq=0
```

---

## 8. Checklist Performance

- [ ] Indexer mode = `Update by Schedule` (không phải `Update on Save`)
- [ ] Redis/Valkey cho cache và session
- [ ] Varnish cho Full Page Cache
- [ ] OPcache bật với `validate_timestamps=0`
- [ ] Không có N+1 query trong luồng đọc lớn
- [ ] Collection chỉ `addAttributeToSelect` những field cần thiết
- [ ] Không có `SELECT *` trong custom queries
- [ ] Index cho các column thường dùng trong WHERE/JOIN
- [ ] Không có logic nặng trong Observer (dùng Queue thay thế)
- [ ] Plugin `around` chỉ dùng khi thực sự cần — prefer `before`/`after`

---

## Liên kết

- Cache Management: xem [cache-management.md](./cache-management.md)
- Indexer/Mview: xem [indexing-mview.md](./indexing-mview.md)
- Message Queue: xem [../network/message-queues.md](../network/message-queues.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
