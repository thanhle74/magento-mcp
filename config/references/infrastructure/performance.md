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

### Bounded keyset batching cho job xóa/xử lý lớn

Fetch-all-then-chunk (`fetchCol` mọi id về PHP rồi `array_chunk`) vẫn là O(N)
memory — backlog lớn sẽ phình RAM tiến trình cron. Dùng vòng lặp keyset: mỗi
vòng SELECT tối đa `CHUNK_SIZE` id **lớn hơn id đã xử lý** (ORDER BY PK), xử
lý, lặp tới khi select rỗng.

```php
$lastId = 0;
while (true) {
    $chunk = $connection->fetchCol(
        $connection->select()
            ->from($table, ['entity_id'])
            ->where('entity_id > ?', $lastId)
            ->where(/* điều kiện nghiệp vụ */)
            ->order('entity_id ASC')
            ->limit(self::CHUNK_SIZE) // ví dụ 500
    );
    if ($chunk === []) {
        break;
    }
    $lastId = max($chunk); // cursor tiến cả khi chunk fail → không loop vô hạn
    // ... xử lý chunk (DELETE hàng loạt, log lỗi rồi tiếp chunk kế)
}
```

Đặc điểm: memory O(chunk) bất kể backlog; cursor keyset đảm bảo tiến triển
kể cả khi một chunk lỗi (chunk lỗi được chạy lại ở lần schedule kế tiếp).

### Join đúng 1 row quan hệ mỗi entity (chống row multiplication)

`joinLeft` bảng con (vd: ảnh, address) theo khóa nghiệp vụ sẽ nhân số row
theo số bản ghi con. Hai hệ quả: fetch N×K rows thừa, và `limit()` áp dụng
trên row đã nhân — entity có nhiều bản ghi con sẽ làm số entity trả về
**thiếu** so với limit sau khi dedup ở PHP. Ghim đúng 1 row con bằng subselect
theo PK:

```php
// BAD — 1 entity có 3 ảnh → 3 rows; LIMIT 6 có thể chỉ còn 2 entity
$select->joinLeft(['img' => $imageTable], 'main.entity_id = img.entity_id', [...]);

// GOOD — đúng 1 row con mỗi entity (ảnh đầu theo PK)
$select->joinLeft(
    ['img' => $imageTable],
    'img.image_id = (SELECT MIN(image_id) FROM ' . $imageTable
        . ' WHERE entity_id = main.entity_id)',
    ['card_path', 'detail_path']
);
```

### Multi-row upsert trên render path

Ghi telemetry/usage N entity lúc render đừng loop từng entity một statement —
`insertOnDuplicate` nhận **mảng nhiều row**, gom hết thành 1 statement:

```php
$rows = [];
foreach ($entityIds as $id) {
    $rows[] = [
        'entity_id' => $id,
        'placement' => $placement,
        'last_seen_at' => $now,
    ];
}
// 1 statement cho N entity; UNIQUE key + cột update ['last_seen_at'] giữ
// idempotent (re-render refresh, không insert row mới)
$connection->insertOnDuplicate($tableName, $rows, ['last_seen_at']);
```

### Bulk/observer theo entity: tách phần "đúng theo entity" khỏi phần batchable

Xử lý N entity (GDPR erase, reindex...) thường KHÔNG batch được 100%: media
file, audit row, event payload là per-entity về ngữ nghĩa. Nguyên tắc:

1. **Load danh sách id** 1 query, chọn cột tối thiểu (`addFieldToSelect('entity_id')`).
2. **Dữ liệu quan hệ dùng chung**: gom hết về PHP bằng 1-2 query batch
   (IN + group mảng), không query/EAV trong loop.
3. **Việc thật sự per-entity** (filesystem, event, audit row) giữ nguyên loop —
   đây là chi phí nghiệp vụ hợp lệ, không phải N+1; đánh dấu như vậy trong
   review thay vì ép batch phá ngữ nghĩa (transaction/retry/idempotency).

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
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
