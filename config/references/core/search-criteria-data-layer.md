# Tham khảo: SearchCriteria, Data Layer Patterns

Nguồn:
- https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches/ — SearchCriteria logic
- https://magento.stackexchange.com/questions/91023 — FilterGroup AND/OR
- https://mgt-commerce.com/blog/searchcriteria-magento-2/ — SearchCriteria deep dive

---

## 1. SearchCriteria deep dive — FilterGroup logic (AND/OR)

### Cấu trúc

```
SearchCriteria
├── filterGroups[]          ← AND giữa các groups
│   ├── filters[]           ← OR giữa các filters trong cùng group
│   │   ├── field
│   │   ├── value
│   │   └── conditionType
├── sortOrders[]
├── pageSize
└── currentPage
```

### Logic AND/OR

```
filterGroups[0] AND filterGroups[1] AND filterGroups[2]
    ↑                   ↑                   ↑
filters[0] OR       filters[0] OR       filters[0] OR
filters[1]          filters[1]          filters[1]
```

**Ví dụ: (status=1 OR status=2) AND (price > 100)**

```php
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\Search\FilterGroupBuilder;

// Group 1: status=1 OR status=2
$filter1 = $this->filterBuilder
    ->setField('status')
    ->setValue(1)
    ->setConditionType('eq')
    ->create();

$filter2 = $this->filterBuilder
    ->setField('status')
    ->setValue(2)
    ->setConditionType('eq')
    ->create();

// Group 2: price > 100
$filter3 = $this->filterBuilder
    ->setField('price')
    ->setValue(100)
    ->setConditionType('gt')
    ->create();

$searchCriteria = $this->searchCriteriaBuilder
    ->addFilters([$filter1, $filter2])  // Group 1: OR
    ->addFilters([$filter3])            // Group 2: AND với Group 1
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->addSortOrder(
        $this->sortOrderBuilder
            ->setField('created_at')
            ->setDirection('DESC')
            ->create()
    )
    ->create();
```

### Condition types đầy đủ

| Condition | SQL | Ví dụ |
|-----------|-----|-------|
| `eq` | `= ?` | `status = 1` |
| `neq` | `!= ?` | `status != 0` |
| `like` | `LIKE ?` | `name LIKE '%test%'` |
| `nlike` | `NOT LIKE ?` | `name NOT LIKE '%spam%'` |
| `in` | `IN (?)` | `id IN (1,2,3)` |
| `nin` | `NOT IN (?)` | `id NOT IN (4,5)` |
| `notnull` | `IS NOT NULL` | `deleted_at IS NOT NULL` |
| `null` | `IS NULL` | `deleted_at IS NULL` |
| `gt` | `> ?` | `price > 100` |
| `lt` | `< ?` | `price < 1000` |
| `gteq` | `>= ?` | `qty >= 0` |
| `lteq` | `<= ?` | `qty <= 100` |
| `moreq` | `>= ?` | Alias của gteq |
| `from` | `>= ?` | Dùng với `to` cho range |
| `to` | `<= ?` | Dùng với `from` cho range |
| `finset` | `FIND_IN_SET(?, field)` | Tìm trong comma-separated |
| `nfinset` | `NOT FIND_IN_SET(?, field)` | Không có trong set |

### Date range

```php
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('created_at', '2024-01-01 00:00:00', 'from')
    ->addFilter('created_at', '2024-12-31 23:59:59', 'to')
    ->create();
```

---

## 2. Custom SearchResults — SearchResultsInterface, TotalCount

### Interface

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

use Magento\Framework\Api\SearchResultsInterface;

/**
 * @api
 * @since 1.0.0
 */
interface EmployeeSearchResultsInterface extends SearchResultsInterface
{
    /**
     * @return \Vendor\Module\Api\Data\EmployeeInterface[]
     */
    public function getItems(): array;

    /**
     * @param \Vendor\Module\Api\Data\EmployeeInterface[] $items
     * @return $this
     */
    public function setItems(array $items): static;
}
```

### di.xml

```xml
<preference for="Vendor\Module\Api\Data\EmployeeSearchResultsInterface"
            type="Magento\Framework\Api\SearchResults" />
```

### Repository implementation

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\EmployeeRepositoryInterface;
use Vendor\Module\Api\Data\EmployeeInterface;
use Vendor\Module\Api\Data\EmployeeSearchResultsInterface;
use Vendor\Module\Api\Data\EmployeeSearchResultsInterfaceFactory;
use Vendor\Module\Model\ResourceModel\Employee\CollectionFactory;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;
use Magento\Framework\Exception\NoSuchEntityException;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function __construct(
        private readonly EmployeeFactory $employeeFactory,
        private readonly ResourceModel\Employee $resource,
        private readonly CollectionFactory $collectionFactory,
        private readonly EmployeeSearchResultsInterfaceFactory $searchResultsFactory,
        private readonly CollectionProcessorInterface $collectionProcessor
    ) {}

    public function getById(int $id): EmployeeInterface
    {
        $employee = $this->employeeFactory->create();
        $this->resource->load($employee, $id);

        if (!$employee->getId()) {
            throw new NoSuchEntityException(
                __('Employee with id "%1" does not exist.', $id)
            );
        }

        return $employee;
    }

    public function getList(SearchCriteriaInterface $searchCriteria): EmployeeSearchResultsInterface
    {
        $collection = $this->collectionFactory->create();

        // CollectionProcessor tự động apply filters, sort, pagination từ SearchCriteria
        $this->collectionProcessor->process($searchCriteria, $collection);

        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);
        $searchResults->setItems($collection->getItems());
        $searchResults->setTotalCount($collection->getSize());

        return $searchResults;
    }

    public function save(EmployeeInterface $employee): EmployeeInterface
    {
        $this->resource->save($employee);
        return $employee;
    }

    public function delete(EmployeeInterface $employee): bool
    {
        $this->resource->delete($employee);
        return true;
    }

    public function deleteById(int $id): bool
    {
        return $this->delete($this->getById($id));
    }
}
```

---

## 3. Database transaction trong ResourceModel

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;
use Magento\Framework\Exception\CouldNotSaveException;

class Employee extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('vendor_module_employee', 'entity_id');
    }

    /**
     * Save employee với related data trong một transaction
     */
    public function saveWithRelatedData(\Vendor\Module\Model\Employee $employee, array $relatedData): void
    {
        $connection = $this->getConnection();
        $connection->beginTransaction();

        try {
            $this->save($employee);
            $this->saveRelatedData($employee->getId(), $relatedData);
            $connection->commit();
        } catch (\Exception $e) {
            $connection->rollBack();
            throw new CouldNotSaveException(
                __('Could not save employee: %1', $e->getMessage()),
                $e
            );
        }
    }

    private function saveRelatedData(int $employeeId, array $data): void
    {
        $connection = $this->getConnection();
        $table = $this->getTable('vendor_module_employee_tag');

        // Delete existing
        $connection->delete($table, ['employee_id = ?' => $employeeId]);

        // Insert new
        if (!empty($data)) {
            $rows = array_map(fn($tagId) => [
                'employee_id' => $employeeId,
                'tag_id' => $tagId,
            ], $data);

            $connection->insertMultiple($table, $rows);
        }
    }
}
```

---

## 4. Bulk operations — insertMultiple, insertOnDuplicate, deleteByIds

```php
$connection = $this->resource->getConnection();
$table = $this->resource->getTableName('vendor_module_employee');

// insertMultiple — INSERT nhiều rows một lần
$rows = [
    ['name' => 'Alice', 'email' => 'alice@example.com', 'status' => 1],
    ['name' => 'Bob', 'email' => 'bob@example.com', 'status' => 1],
];
$connection->insertMultiple($table, $rows);

// insertOnDuplicate — INSERT ... ON DUPLICATE KEY UPDATE
$connection->insertOnDuplicate(
    $table,
    $rows,
    ['name', 'status']  // columns to update on duplicate
);

// deleteByIds — DELETE WHERE id IN (...)
$connection->delete($table, ['entity_id IN (?)' => [1, 2, 3]]);

// Bulk update
$connection->update(
    $table,
    ['status' => 0],                    // data
    ['entity_id IN (?)' => [1, 2, 3]]  // where
);
```

---

## 5. Soft delete — is_active flag, filter trong collection

```php
// Model
class Employee extends AbstractModel
{
    public function disable(): static
    {
        $this->setIsActive(0);
        return $this;
    }

    public function isActive(): bool
    {
        return (bool)$this->getData('is_active');
    }
}

// Collection — tự động filter is_active=1
class Collection extends AbstractCollection
{
    protected function _initSelect(): static
    {
        parent::_initSelect();
        // Mặc định chỉ lấy active records
        $this->addFieldToFilter('is_active', 1);
        return $this;
    }

    // Method để lấy cả inactive
    public function includeInactive(): static
    {
        $this->getSelect()->reset(\Zend_Db_Select::WHERE);
        return $this;
    }
}
```

---

## 6. Database connection — read/write split

```php
// Read connection (slave) — dùng cho SELECT
$readConnection = $this->resource->getConnection('read');
// Hoặc
$readConnection = $this->resource->getConnection(\Magento\Framework\App\ResourceConnection::DEFAULT_READ_RESOURCE);

// Write connection (master) — dùng cho INSERT/UPDATE/DELETE
$writeConnection = $this->resource->getConnection('write');
// Hoặc (mặc định)
$writeConnection = $this->resource->getConnection();

// Trong ResourceModel
$connection = $this->getConnection(); // write connection
```

> **Lưu ý:** Trong hầu hết Magento setup, read và write là cùng một connection. Read/write split chỉ có ý nghĩa khi cấu hình MySQL replication.

---

## 7. Schema migration — alter column safely

```xml
<!-- db_schema.xml — thêm column mới (safe) -->
<table name="vendor_module_employee">
    <column xsi:type="varchar" name="phone" nullable="true" length="20" comment="Phone Number"/>
</table>

<!-- Thay đổi column type (cần cẩn thận với data loss) -->
<!-- Từ varchar(50) → varchar(255): safe -->
<column xsi:type="varchar" name="name" nullable="false" length="255" comment="Name"/>

<!-- Thêm index -->
<index referenceId="VENDOR_MODULE_EMPLOYEE_STATUS" indexType="btree">
    <column name="status"/>
</index>
```

```bash
# Sau khi sửa db_schema.xml
bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module
bin/magento setup:upgrade
```

> **Zero-downtime migration:** Thêm column nullable trước, migrate data, rồi mới set NOT NULL. Không drop column trong cùng một deployment.

---

## Liên kết

- Service Contracts: xem [service-contracts.md](./service-contracts.md)
- Collection patterns: xem [model-collection-patterns.md](./model-collection-patterns.md)
- Declarative Schema: xem [declarative-schema.md](./declarative-schema.md)
- REST API: xem [../network/rest/overview.md](../network/rest/overview.md)
