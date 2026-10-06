# Tham khảo: PHP 8.x & Data-Layer Idioms trong Magento 2

Tách từ `advanced-patterns.md` — nhóm idiom ngôn ngữ (PHP 8.x trong Magento context) và
idiom truy cập dữ liệu (Builder, Null Object, Registry legacy, Collection vs Repository,
idempotent upsert).

> Pattern cấu trúc (Command pool, Strategy, Composite, Pipeline, Modifier, Validator,
> Specification, Decorator, Converter): xem [advanced-patterns.md](./advanced-patterns.md).

---

## 1. PHP 8.x features trong Magento context

### Named arguments (PHP 8.0+)

```php
// Hữu ích khi gọi function với nhiều optional params
$result = array_slice(
    array: $items,
    offset: 0,
    length: 10,
    preserve_keys: true
);

// Trong Magento: dùng khi gọi factory với nhiều params
$model = $this->modelFactory->create(data: ['name' => 'Test']);
```

### Match expression (PHP 8.0+)

```php
// Thay thế switch statement
$label = match($status) {
    'pending' => __('Pending'),
    'processing' => __('Processing'),
    'complete' => __('Complete'),
    'canceled' => __('Canceled'),
    default => __('Unknown'),
};
```

### Nullsafe operator (PHP 8.0+)

```php
// Thay vì:
$city = $customer->getDefaultShippingAddress() !== null
    ? $customer->getDefaultShippingAddress()->getCity()
    : null;

// Dùng:
$city = $customer->getDefaultShippingAddress()?->getCity();
```

### Readonly properties (PHP 8.1+)

```php
// Dùng trong DTO/Value Object
class ProductData
{
    public function __construct(
        public readonly int $id,
        public readonly string $sku,
        public readonly float $price,
    ) {}
}

// Không thể thay đổi sau khi khởi tạo
$data = new ProductData(id: 1, sku: 'TEST-001', price: 99.99);
// $data->price = 50.0; // Error: Cannot modify readonly property
```

### Enum (PHP 8.1+)

```php
// Thay thế class constants
enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Complete = 'complete';
    case Canceled = 'canceled';

    public function getLabel(): string
    {
        return match($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::Complete => 'Complete',
            self::Canceled => 'Canceled',
        };
    }
}

// Sử dụng
$status = OrderStatus::Pending;
$label = $status->getLabel();
$value = $status->value; // 'pending'
$status = OrderStatus::from('processing'); // OrderStatus::Processing
```

> **Lưu ý Magento:** Enum chưa được dùng rộng rãi trong Magento core (vẫn dùng class constants). Có thể dùng trong custom module nhưng cần đảm bảo PHP 8.1+ requirement.

### First-class callable (PHP 8.1+)

```php
// Thay vì:
$names = array_map(function ($item) { return $item->getName(); }, $items);

// Dùng:
$names = array_map($item->getName(...), $items);

// Hoặc với static method:
$names = array_map(Formatter::format(...), $items);
```

### Generator — lazy collection, memory-efficient

```php
// Xử lý large dataset mà không load hết vào memory
function getProductsInBatches(int $batchSize = 1000): \Generator
{
    $currentPage = 1;
    do {
        $collection = $this->collectionFactory->create();
        $collection->setPageSize($batchSize)->setCurPage($currentPage);
        $collection->load();

        foreach ($collection as $product) {
            yield $product;
        }

        $lastPage = $collection->getLastPageNumber();
        $currentPage++;
        $collection->clear();
    } while ($currentPage <= $lastPage);
}

// Sử dụng
foreach ($this->getProductsInBatches() as $product) {
    $this->processProduct($product);
    // Chỉ 1 batch trong memory tại một thời điểm
}
```

---

## 2. Builder pattern — SearchCriteriaBuilder, FilterBuilder deep dive

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SortOrderBuilder;

class ProductSearchService
{
    public function __construct(
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder,
        private readonly FilterBuilder $filterBuilder,
        private readonly SortOrderBuilder $sortOrderBuilder
    ) {}

    public function searchActiveProducts(
        string $nameQuery,
        float $minPrice,
        int $pageSize = 20,
        int $currentPage = 1
    ): \Magento\Framework\Api\SearchCriteriaInterface {
        // Reset builder state (quan trọng khi dùng lại builder)
        $this->searchCriteriaBuilder->create(); // reset

        // Filter: status = 1 (active)
        $statusFilter = $this->filterBuilder
            ->setField('status')
            ->setValue(1)
            ->setConditionType('eq')
            ->create();

        // Filter: name LIKE %query%
        $nameFilter = $this->filterBuilder
            ->setField('name')
            ->setValue('%' . $nameQuery . '%')
            ->setConditionType('like')
            ->create();

        // Filter: price >= minPrice
        $priceFilter = $this->filterBuilder
            ->setField('price')
            ->setValue($minPrice)
            ->setConditionType('gteq')
            ->create();

        // Sort: price ASC
        $sortOrder = $this->sortOrderBuilder
            ->setField('price')
            ->setDirection('ASC')
            ->create();

        return $this->searchCriteriaBuilder
            ->addFilters([$statusFilter])   // Group 1: status=1
            ->addFilters([$nameFilter])     // Group 2: AND name LIKE
            ->addFilters([$priceFilter])    // Group 3: AND price >=
            ->addSortOrder($sortOrder)
            ->setPageSize($pageSize)
            ->setCurrentPage($currentPage)
            ->create();
    }
}
```

---

## 3. Null Object pattern — tránh null check

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\DiscountProviderInterface;

/**
 * Null Object — trả về khi không có discount provider nào phù hợp
 */
class NullDiscountProvider implements DiscountProviderInterface
{
    public function getDiscount(float $price): float
    {
        return 0.0; // Không có discount
    }

    public function isApplicable(string $customerGroup): bool
    {
        return false;
    }
}
```

```php
// Thay vì:
$provider = $this->getProvider($type);
if ($provider !== null) {
    $discount = $provider->getDiscount($price);
} else {
    $discount = 0.0;
}

// Dùng Null Object:
$provider = $this->getProvider($type) ?? $this->nullDiscountProvider;
$discount = $provider->getDiscount($price);
```

---

## 4. Registry pattern — legacy và cách thay thế

`Magento\Framework\Registry` là pattern cũ (global state), đang bị deprecated.

```php
// ❌ Legacy: dùng Registry (deprecated)
$this->registry->register('current_product', $product);
$product = $this->registry->registry('current_product');

// ✅ Thay thế: inject trực tiếp hoặc dùng context
// Trong Controller:
$this->_coreRegistry->register('current_product', $product);

// Trong Block: inject ProductRepositoryInterface và load theo ID từ request
public function getProduct(): ProductInterface
{
    $productId = (int)$this->getRequest()->getParam('id');
    return $this->productRepository->getById($productId);
}
```

---

## 5. Collection vs Repository — khi nào dùng cái nào

| Tiêu chí | Collection | Repository |
|----------|-----------|-----------|
| Abstraction | Thấp (gần DB) | Cao (domain layer) |
| Instantiation | Factory (newable, stateful) | DI injection (stateless) |
| Caching | Không | Có (ProductRepository cache) |
| Flexibility | Cao (join, group, raw SQL) | Thấp hơn |
| API exposure | Không | Có (service contract) |
| Testability | Khó mock | Dễ mock |

**Dùng Repository khi:**
- Expose qua REST/GraphQL API
- Cần caching layer
- Cần decouple từ persistence layer
- Viết unit test dễ hơn

**Dùng Collection khi:**
- Cần JOIN phức tạp
- Cần GROUP BY, aggregate queries
- Cần raw SQL performance
- Xử lý batch lớn (lazy loading)
- Admin grid DataProvider

```php
// Repository: inject, stateless, cacheable
class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository
    ) {}

    public function getProduct(int $id): ProductInterface
    {
        return $this->productRepository->getById($id); // cached
    }
}

// Collection: factory, stateful, flexible
class ProductBatchProcessor
{
    public function __construct(
        private readonly CollectionFactory $collectionFactory
    ) {}

    public function processInBatches(int $batchSize = 500): void
    {
        $page = 1;
        do {
            $collection = $this->collectionFactory->create();
            $collection
                ->addAttributeToSelect(['sku', 'name', 'price'])
                ->addFieldToFilter('status', 1)
                ->setPageSize($batchSize)
                ->setCurPage($page);

            foreach ($collection as $product) {
                $this->process($product);
            }

            $lastPage = $collection->getLastPageNumber();
            $collection->clear(); // free memory
            $page++;
        } while ($page <= $lastPage);
    }
}
```

---

## 6. Idempotent upsert: UNIQUE key + `insertOnDuplicate` (pattern "where-used" registry)

Áp dụng cho bảng tracking/registry kiểu "đâu đang dùng" (placement, assignment, sync-state) —
cần **một row duy nhất per natural key**, lặp lại thao tác chỉ refresh timestamp.

### Quy tắc

1. **Chuẩn hóa natural key thành UNIQUE constraint** trong `db_schema.xml`:

```xml
<table name="vendor_entity_usage" resource="default" engine="innodb" comment="Placement registry">
    <column xsi:type="int" name="entity_id" unsigned="true" nullable="false" identity="true"/>
    <column xsi:type="int" name="source_id" unsigned="true" nullable="false" comment="FK source"/>
    <column xsi:type="varchar" name="placement_type" nullable="false" length="64"/>
    <column xsi:type="varchar" name="placement_identifier" nullable="false" length="255"/>
    <column xsi:type="timestamp" name="created_at" on_update="false" nullable="false" default="CURRENT_TIMESTAMP" comment="First seen"/>
    <column xsi:type="timestamp" name="last_seen_at" on_update="false" nullable="false" default="CURRENT_TIMESTAMP" comment="Last seen"/>
    <constraint xsi:type="primary" referenceId="PRIMARY">
        <column name="entity_id"/>
    </constraint>
    <constraint xsi:type="unique" referenceId="VENDOR_ENTITY_USAGE_PLACEMENT_UNIQUE">
        <column name="source_id"/>
        <column name="placement_type"/>
        <column name="placement_identifier"/>
    </constraint>
</table>
```

2. **Upsert chỉ refresh cột "last seen"** — tham số thứ 3 của `insertOnDuplicate` là danh sách cột
   được UPDATE khi trùng key; truyền tối thiểu:

```php
$connection->insertOnDuplicate(
    $this->resourceConnection->getTableName('vendor_entity_usage'),
    [
        'source_id'            => $sourceId,
        'placement_type'       => $type,
        'placement_identifier' => $identifier,
        'created_at'           => $now,   // ignored on duplicate
        'last_seen_at'         => $now,   // the ONLY column refreshed
    ],
    ['last_seen_at']
);
```

3. **Không** dùng `insertOnDuplicate` cho bảng chưa có UNIQUE trên natural key — không có key thì
   semantics trở thành "update mọi row trùng giá trị" và bảng vẫn tăng vô hạn theo render/request.
4. Tracking nằm trên render path → **fail-safe**: bọc try/catch, log qua `Psr\Log\LoggerInterface`
   (`$logger->error('... failed: {message}', ['message' => $e->getMessage(), ...])`) — không nuốt
   im lặng, không làm hỏng page render.
5. Dedupe input trước khi ghi (`array_unique(array_map('intval', $ids))`, skip id <= 0).

### Test chuẩn

- Gọi track 2 lần cùng placement → **1 row**, `created_at` giữ nguyên, `last_seen_at` tăng.
- Exception từ adapter → `logger->error` được gọi đúng 1 lần với context; method không throw.
- Input rỗng/toàn id không hợp lệ → không có query ghi nào.


## Liên kết

- Pattern cấu trúc (Command/Strategy/Validator/...): [advanced-patterns.md](./advanced-patterns.md)
- SearchCriteria & Data Layer: [search-criteria-data-layer.md](./search-criteria-data-layer.md)
- Model & Collection patterns: [model-collection-patterns.md](./model-collection-patterns.md)
