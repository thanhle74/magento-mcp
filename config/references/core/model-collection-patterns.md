# Tham khảo: AbstractModel, DataObject, Collection & ResourceModel

Nguồn:
- https://developer.adobe.com/commerce/php/development/components/object-manager — đã refactor theo constitution
- https://magento.stackexchange.com/questions/171317 — Model vs Data Model
- https://magento.stackexchange.com/questions/248180 — magic getters best practice
- https://magento.stackexchange.com/questions/74278 — collection join/group/having

---

## 1. AbstractModel vs DataObject — khi nào dùng cái nào

### Hierarchy

```
Magento\Framework\DataObject
    └── Magento\Framework\Model\AbstractModel
            └── Magento\Framework\Model\AbstractExtensibleModel
                    └── (các Model cụ thể: Product, Order, Customer...)
```

### DataObject

Class cơ bản nhất. Chỉ là container dữ liệu với magic getter/setter.

```php
use Magento\Framework\DataObject;

$obj = new DataObject(['name' => 'Test', 'price' => 100]);
$obj->getName();        // 'Test' — magic getter
$obj->setName('New');   // magic setter
$obj->getData('name');  // 'Test' — explicit getter
$obj->getData();        // ['name' => 'New', 'price' => 100] — all data
```

**Dùng khi:**
- Cần truyền dữ liệu giữa các method/class mà không cần persistence
- DTO (Data Transfer Object) đơn giản
- Kết quả tính toán tạm thời

### AbstractModel

Kế thừa DataObject, thêm khả năng persistence (save/load/delete) thông qua ResourceModel.

```php
use Magento\Framework\Model\AbstractModel;

class Employee extends AbstractModel
{
    protected function _construct(): void
    {
        // Khai báo ResourceModel tương ứng
        $this->_init(\Vendor\Module\Model\ResourceModel\Employee::class);
    }
}
```

**Dùng khi:**
- Entity cần lưu vào database
- Cần lifecycle hooks (_beforeSave, _afterSave, _beforeDelete, _afterDelete)
- Cần event dispatch tự động (model_save_before, model_save_after...)

### AbstractExtensibleModel

Kế thừa AbstractModel, thêm hỗ trợ Extension Attributes.

**Dùng khi:**
- Entity cần expose qua REST/GraphQL API
- Cần Extension Attributes để third-party module thêm data

### Quyết định nhanh

```
Cần lưu DB?
├── Không → DataObject
└── Có → AbstractModel
    ├── Cần Extension Attributes / API? → AbstractExtensibleModel
    └── Không → AbstractModel
```

---

## 2. Magic getter/setter vs getData/setData

### Magic getter/setter

```php
$product->getName();        // → getData('name')
$product->setName('Test');  // → setData('name', 'Test')
$product->getSku();         // → getData('sku')
```

**Cơ chế:** PHP `__call()` magic method chuyển `getName` → `getData('name')` bằng cách convert camelCase → snake_case.

### Khi nào dùng magic getter

```php
// OK: Khi làm việc với DataObject/AbstractModel trong internal code
$product->getName();
$order->getStatus();
```

### Khi nào dùng getData()

```php
// Khuyến nghị: Khi key có thể conflict với method thật
$product->getData('type_id');  // Tránh nhầm với getTypeId() method thật

// Khi key là dynamic
$key = 'custom_attribute_' . $suffix;
$value = $product->getData($key);

// Khi cần lấy toàn bộ data
$allData = $product->getData();
```

### Best practice (theo constitution)

- Với **Data Interface** (`Api/Data/ProductInterface`): Dùng typed getter/setter được định nghĩa trong interface (`getName()`, `setName()`)
- Với **DataObject/AbstractModel** trong internal code: `getData()` an toàn hơn magic getter vì tránh naming conflict
- **Không dùng magic getter** trong code expose qua API — dùng interface method

```php
// ❌ Không nên: magic getter trong API layer
$product->getCustomField();

// ✅ Nên: typed method từ interface
$product->getCustomAttribute('custom_field')?->getValue();
```

---

## 3. ResourceModel — _beforeSave/_afterSave, connection, table prefix

### Lifecycle hooks

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;
use Magento\Framework\Model\AbstractModel;
use Magento\Framework\Exception\LocalizedException;

class Employee extends AbstractDb
{
    protected function _construct(): void
    {
        // (table_name, primary_key)
        $this->_init('vendor_module_employee', 'entity_id');
    }

    /**
     * Chạy trước khi INSERT/UPDATE
     * Dùng để: validate, set timestamps, transform data
     */
    protected function _beforeSave(AbstractModel $object): static
    {
        // Validate
        if (!$object->getName()) {
            throw new LocalizedException(__('Employee name is required.'));
        }

        // Set timestamps
        $now = date('Y-m-d H:i:s');
        if (!$object->getId()) {
            $object->setCreatedAt($now);
        }
        $object->setUpdatedAt($now);

        return parent::_beforeSave($object);
    }

    /**
     * Chạy sau khi INSERT/UPDATE thành công
     * Dùng để: save related data, trigger reindex, send notification
     */
    protected function _afterSave(AbstractModel $object): static
    {
        // Save related data (ví dụ: save tags)
        $this->saveRelatedData($object);

        return parent::_afterSave($object);
    }

    /**
     * Chạy trước khi DELETE
     */
    protected function _beforeDelete(AbstractModel $object): static
    {
        // Check dependencies trước khi xóa
        if ($this->hasRelatedOrders($object->getId())) {
            throw new LocalizedException(__('Cannot delete employee with existing orders.'));
        }
        return parent::_beforeDelete($object);
    }

    /**
     * Chạy sau khi DELETE
     */
    protected function _afterDelete(AbstractModel $object): static
    {
        // Cleanup related data
        return parent::_afterDelete($object);
    }

    private function saveRelatedData(AbstractModel $object): void
    {
        // Implementation
    }

    private function hasRelatedOrders(int $employeeId): bool
    {
        return false; // Implementation
    }
}
```

### Connection và table prefix

```php
// Lấy connection (read/write)
$connection = $this->getConnection();

// Lấy tên bảng với prefix (nếu có)
$tableName = $this->getMainTable();                    // main table
$tableName = $this->getTable('sales_order');           // table khác với prefix
$tableName = $this->getTable('vendor_module_employee'); // custom table

// Raw query với connection
$select = $connection->select()
    ->from($this->getMainTable(), ['entity_id', 'name'])
    ->where('status = ?', 1)
    ->order('name ASC')
    ->limit(100);

$rows = $connection->fetchAll($select);
```

### Database transaction trong ResourceModel

```php
protected function _beforeSave(AbstractModel $object): static
{
    $connection = $this->getConnection();
    $connection->beginTransaction();
    try {
        // Operations...
        $connection->commit();
    } catch (\Exception $e) {
        $connection->rollBack();
        throw $e;
    }
    return parent::_beforeSave($object);
}
```

> **Lưu ý:** AbstractDb::save() đã có transaction wrapper. Chỉ cần thêm transaction thủ công khi cần wrap nhiều operations phức tạp.

---

## 4. Collection — addFieldToFilter, join, group, having

### addFieldToFilter — filter conditions

```php
// Equals
$collection->addFieldToFilter('status', 1);
$collection->addFieldToFilter('status', ['eq' => 1]);

// Not equals
$collection->addFieldToFilter('status', ['neq' => 0]);

// Like
$collection->addFieldToFilter('name', ['like' => '%test%']);

// In array
$collection->addFieldToFilter('status', ['in' => [1, 2, 3]]);

// Not in
$collection->addFieldToFilter('status', ['nin' => [0, 4]]);

// Greater than / Less than
$collection->addFieldToFilter('price', ['gt' => 100]);
$collection->addFieldToFilter('price', ['lt' => 1000]);
$collection->addFieldToFilter('price', ['gteq' => 100]);
$collection->addFieldToFilter('price', ['lteq' => 1000]);

// Null / Not null
$collection->addFieldToFilter('deleted_at', ['null' => true]);
$collection->addFieldToFilter('deleted_at', ['notnull' => true]);

// Date range
$collection->addFieldToFilter('created_at', ['from' => '2024-01-01', 'to' => '2024-12-31']);
```

### AND vs OR conditions

```php
// AND: gọi addFieldToFilter nhiều lần
$collection
    ->addFieldToFilter('status', 1)        // AND
    ->addFieldToFilter('store_id', 1);     // AND

// OR: truyền array vào một lần gọi
$collection->addFieldToFilter(
    ['status', 'type'],                    // fields
    [['eq' => 1], ['eq' => 'simple']]     // conditions — OR giữa chúng
);

// OR phức tạp hơn: dùng getSelect()
$collection->getSelect()->where(
    'status = 1 OR (type = ? AND price > 100)',
    'configurable'
);
```

### Join

```php
// joinLeft — giữ record dù không có match
$collection->getSelect()->joinLeft(
    ['order_table' => $this->getTable('sales_order')],
    'main_table.order_id = order_table.entity_id',
    ['order_status' => 'order_table.status', 'order_total' => 'order_table.grand_total']
);

// joinInner — chỉ lấy record có match
$collection->getSelect()->join(
    ['cat' => $this->getTable('catalog_category_entity')],
    'main_table.category_id = cat.entity_id',
    ['category_name' => 'cat.value']
);
```

### Group và Having

```php
// Group by
$collection->getSelect()
    ->group('main_table.customer_id');

// Having (dùng sau group)
$collection->getSelect()
    ->group('main_table.customer_id')
    ->having('COUNT(*) > ?', 5);

// Aggregate functions
$collection->getSelect()
    ->columns([
        'total_orders' => new \Magento\Framework\DB\Sql\Expression('COUNT(*)'),
        'total_revenue' => new \Magento\Framework\DB\Sql\Expression('SUM(grand_total)'),
        'avg_order' => new \Magento\Framework\DB\Sql\Expression('AVG(grand_total)'),
    ])
    ->group('customer_id')
    ->having('SUM(grand_total) > ?', 1000);
```

### Performance pitfalls

| Pitfall | Vấn đề | Giải pháp |
|---------|--------|----------|
| Load toàn bộ collection không có limit | Memory exhaustion | `setPageSize()` + `setCurPage()` |
| Join trên column không có index | Slow query | Thêm index vào db_schema.xml |
| `addFieldToFilter` trên EAV attribute | N+1 query | Dùng `addAttributeToFilter` + `addAttributeToSelect` |
| `count()` sau khi load | Double query | Dùng `getSize()` trước khi load |
| Load collection trong loop | N+1 | Load một lần, index theo ID |

```php
// ❌ Không nên: load trong loop
foreach ($orderIds as $orderId) {
    $order = $this->orderCollectionFactory->create()
        ->addFieldToFilter('entity_id', $orderId)
        ->getFirstItem();
}

// ✅ Nên: load một lần
$orders = $this->orderCollectionFactory->create()
    ->addFieldToFilter('entity_id', ['in' => $orderIds]);
$orderMap = [];
foreach ($orders as $order) {
    $orderMap[$order->getId()] = $order;
}
```

### Batch processing — load collection in chunks

```php
// Xử lý collection lớn theo batch để tránh memory exhaustion
$pageSize = 1000;
$currentPage = 1;

do {
    $collection = $this->collectionFactory->create();
    $collection->setPageSize($pageSize)->setCurPage($currentPage);
    $collection->load();

    foreach ($collection as $item) {
        $this->processItem($item);
    }

    $lastPage = $collection->getLastPageNumber();
    $currentPage++;

    // Clear collection để giải phóng memory
    $collection->clear();
    unset($collection);

} while ($currentPage <= $lastPage);
```

---

## 5. Collection vs Repository — khi nào dùng cái nào

| Tiêu chí | Collection | Repository |
|---------|-----------|-----------|
| **API layer** | ❌ Không expose | ✅ Expose qua REST/GraphQL |
| **Performance** | Tốt hơn cho bulk operations | Overhead từ Data Object mapping |
| **Flexibility** | Cao (raw SQL, join, group) | Giới hạn bởi SearchCriteria |
| **Type safety** | Thấp (DataObject) | Cao (typed interface) |
| **Extension Attributes** | Không tự động | Tự động load |
| **Caching** | Không | Có thể cache |

**Quy tắc:**
- **Repository:** Khi cần expose qua API, cần Extension Attributes, cần type safety
- **Collection:** Khi cần performance cao, bulk operations, complex query (join/group/having), internal processing

---

## 6. Gotchas ORM: `_init()` lazy resolve và `setData(array)` hydration

### 6.1 `_init()` resolve resource qua ObjectManager trong constructor (2.4.8)

Override `_construct()` + `_init(ResourceModel::class)` vẫn hoạt động, nhưng nhớ rằng
`_init()` resolve resource model **qua ObjectManager ngay trong constructor**. Khởi tạo
model bằng reflection/empty-ctor trong test hoặc scaffolding sẽ **không chạy
`_construct()`** → `_resourceName`/`_idFieldName` rỗng → `getId()` trả `null` ngầm.

Fix khi dựng model thủ công (test, hydration helper): set thẳng

```php
$model->setResourceName(\Vendor\Module\Model\ResourceModel\Entity::class);
// property protected: $_resourceName / $_idFieldName — khai trong constructor class thật
```

Đơn vị unit test mock collection không chứng minh được SQL shape — xem
[search-criteria-data-layer.md](./search-criteria-data-layer.md) §8.

### 6.2 `setData(array)` hydration không populate `_storedData` → `updated_at` đứng yên

`AbstractModel::save()` chỉ ghi **dirty fields** so với `getStoredData()`. Nhưng
`_storedData` chỉ được populate qua `afterLoad()`/`afterSave()`. Model hydrate thủ công
bằng `setData($row)` (vd pattern `lockByAppTransId`) có `_storedData` **rỗng** → UPDATE
ghi **toàn bộ cột**, kể cả giá trị `updated_at` cũ vừa hydrate → chặn
`ON UPDATE CURRENT_TIMESTAMP` của MySQL → mất vết thời gian trên row (kiểm chứng thực
nghiệm: save thành công, `updated_at` đứng yên).

Fix — một trong hai:

```php
// (a) Unset updated_at khỏi data trước hydrate → core bỏ cột khỏi UPDATE
unset($row['updated_at']);
$model->setData($row);

// (b) Populate storedData đúng quy trình: load qua collection/repository
//     (afterLoad() set _storedData từ DB) thay vì setData tay
```

Quy tắc: model cần `updated_at` bump khi save → load bằng collection/repository rồi mới
mutate, đừng hydrate mảng thô.

---

## Liên kết

- Service Contracts & Repository: xem [service-contracts.md](./service-contracts.md)
- Extension Attributes: xem [extension-attributes.md](./extension-attributes.md)
- Declarative Schema: xem [declarative-schema.md](./declarative-schema.md)
