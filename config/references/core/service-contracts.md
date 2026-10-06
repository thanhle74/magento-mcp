# Tham khảo: Service Contracts (API & Repositories)

Nguồn: https://developer.adobe.com/commerce/php/development/components/service-contracts/

---

> Từ khóa tra cứu: service contract, repository, data interface, search results, getList, CollectionProcessor, SearchCriteria, AND OR filter, preference di.xml, @api.

## 1. Service Contract là gì?

Service Contract là một bộ các PHP Interface được định nghĩa cho một module. Nó đóng vai trò là "lớp bảo vệ" bên ngoài, che giấu logic phức tạp bên trong Model và Resource Model. Mọi Interface trong Service Contract được coi là **Public API** (bắt buộc có tag `@api`).

**Cấu trúc folder bắt buộc (trong `app/code/<Vendor>/<Module>/`):**
- **`Api/`**: Chứa các **Service Interfaces** (ví dụ: Repository, Management interfaces).
- **`Api/Data/`**: Chứa các **Data Interfaces** (định nghĩa các getter/setter cho entity).

> Code mẫu trong file này tuân thủ `constitution.md` §1: `declare(strict_types=1)`, typed signature, return type, docblock đầy đủ. Copy nguyên xi là pass PHPCS.

---

## 2. Data Interfaces (Thực thể dữ liệu)

Nằm trong `Api/Data/`. Giúp định nghĩa cấu trúc dữ liệu mà không quan tâm nó lưu ở bảng nào (EAV hay Flat table).

### Ví dụ: `Api/Data/EmployeeInterface.php`

```php
<?php
/**
 * Copyright area (theo convention repo)
 */
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

/**
 * Data contract for the Employee entity.
 *
 * @api
 */
interface EmployeeInterface
{
    public const ENTITY_ID = 'entity_id';
    public const NAME = 'name';

    /**
     * Get the entity ID.
     *
     * @return int|null
     */
    public function getEntityId(): ?int;

    /**
     * Set the entity ID.
     *
     * @param int $entityId
     * @return EmployeeInterface
     */
    public function setEntityId(int $entityId): EmployeeInterface;

    /**
     * Get the employee name.
     *
     * @return string|null
     */
    public function getName(): ?string;

    /**
     * Set the employee name.
     *
     * @param string $name
     * @return EmployeeInterface
     */
    public function setName(string $name): EmployeeInterface;
}
```

> **Lưu ý Web API:** `@param`/`@return` dùng FQCN khi expose REST/SOAP (constitution §4). Getter/setter đơn giản trong `Model` implement interface có thể `@inheritdoc` (checklist §1).

---

## 3. Service Interfaces (Repository)

Nằm trong `Api/`. Thường là các Repository dùng để Lưu, Xoá, Lấy dữ liệu.

### Ví dụ: `Api/EmployeeRepositoryInterface.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api;

use Vendor\Module\Api\Data\EmployeeInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;

/**
 * Repository contract for the Employee entity.
 *
 * @api
 * @since 1.0.0
 */
interface EmployeeRepositoryInterface
{
    /**
     * Load an employee by ID.
     *
     * @param int $id
     * @return EmployeeInterface
     * @throws NoSuchEntityException
     */
    public function getById(int $id): EmployeeInterface;

    /**
     * Save an employee.
     *
     * @param EmployeeInterface $employee
     * @return EmployeeInterface
     * @throws LocalizedException
     */
    public function save(EmployeeInterface $employee): EmployeeInterface;

    /**
     * Delete an employee by ID.
     *
     * @param int $id
     * @return bool
     * @throws NoSuchEntityException
     * @throws LocalizedException
     */
    public function deleteById(int $id): bool;
}
```

---

## 4. Tại sao phải tuân thủ?

1. **Auto-generated Web API:** Khi định nghĩa đúng Interface trong `Api/`, chúng ta chỉ cần khai báo trong `webapi.xml`, Magento sẽ tự tạo endpoint `/V1/employees/:id`.
2. **Decoupling:** Các module khác khi gọi đến module này sẽ gọi qua `Api/Interface`, không quan tâm logic bên trong `Model/` thay đổi thế nào.
3. **Sử dụng `@api` tag:** Luôn thêm `@api` trong docblock của Interface để đánh dấu đây là Public API ổn định; `@since` cho interface mới (constitution §4).
4. **Testability:** Repository interface cho phép mock trong unit test kể cả khi internal-only (checklist §4).

---

## 5. Quy trình làm việc đề xuất

Khi tạo một tính năng mới (Feature), chúng ta sẽ làm theo thứ tự:
1. Tạo **Data Interface** (`Api/Data/`).
2. Tạo **Service Interface** (`Api/`).
3. Tạo **Model** implement Data Interface.
4. Tạo **Repository** implement Service Interface — đặt tại `Model/EmployeeRepository.php` (ngang hàng `Model/Employee.php`, KHÔNG đặt trong `Model/Employee/` — checklist §2).
5. Cấu hình **`di.xml`** để map Interface -> Class thực tế (`<preference>`).

---

## 6. Repository Design Pattern (CRUD chuẩn)

Một Repository chuẩn cho một Entity (ví dụ: `Employee`) bắt buộc phải có các method sau:

- `save(EmployeeInterface $employee): EmployeeInterface`
- `getById(int $id): EmployeeInterface`
- `getList(SearchCriteriaInterface $searchCriteria): EmployeeSearchResultsInterface`
- `delete(EmployeeInterface $employee): bool`
- `deleteById(int $id): bool`

---

## 7. Thực thi getList() với CollectionProcessor

Đây là cách hiện đại nhất (Modern way) để viết hàm `getList`.

**1. PHP Implementation:**
```php
/**
 * @inheritDoc
 */
public function getList(
    \Magento\Framework\Api\SearchCriteriaInterface $searchCriteria
): \Vendor\Module\Api\Data\EmployeeSearchResultsInterface {
    $collection = $this->collectionFactory->create();

    // Tự động áp dụng Filter, Sort, Paging từ SearchCriteria vào Collection
    $this->collectionProcessor->process($searchCriteria, $collection);

    $searchResults = $this->searchResultsFactory->create();
    $searchResults->setSearchCriteria($searchCriteria);
    $searchResults->setItems($collection->getItems());
    $searchResults->setTotalCount($collection->getSize());

    return $searchResults;
}
```

**2. Cấu hình di.xml (Field Mapping):**
Mặc định dùng `Magento\Framework\Api\SearchCriteria\CollectionProcessor`. Nếu cần ánh xạ trường API sang DB column, hãy dùng `virtualType`:
```xml
<virtualType name="MyModuleSearchCriteriaCollectionProcessor" type="Magento\Framework\Api\SearchCriteria\CollectionProcessor">
    <arguments>
        <argument name="processors" xsi:type="array">
            <item name="filters" xsi:type="object">Magento\Framework\Api\SearchCriteria\CollectionProcessor\FilterProcessor</item>
            <item name="sorting" xsi:type="object">Magento\Framework\Api\SearchCriteria\CollectionProcessor\SortingProcessor</item>
            <item name="pagination" xsi:type="object">Magento\Framework\Api\SearchCriteria\CollectionProcessor\PaginationProcessor</item>
        </argument>
    </arguments>
</virtualType>
```

---

## 8. Search Results Interface (Kết quả tìm kiếm)

Nằm trong `Api/Data/`. Giúp type-hinting chính xác danh sách các thực thể trả về từ `getList()`.

### Ví dụ: `Api/Data/EmployeeSearchResultsInterface.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

use Magento\Framework\Api\SearchResultsInterface;

/**
 * Search results contract for the Employee entity.
 *
 * @api
 * @since 1.0.0
 */
interface EmployeeSearchResultsInterface extends SearchResultsInterface
{
    /**
     * Get matched employees.
     *
     * @return \Vendor\Module\Api\Data\EmployeeInterface[]
     */
    public function getItems(): array;

    /**
     * Set matched employees.
     *
     * @param \Vendor\Module\Api\Data\EmployeeInterface[] $items
     * @return EmployeeSearchResultsInterface
     */
    public function setItems(array $items): EmployeeSearchResultsInterface;
}
```

---

## 9. Management & Metadata Interfaces

- **Management Interface:** Dùng cho logic nghiệp vụ KHÔNG liên quan đến CRUD entity.
    - Ví dụ: `AccountManagementInterface::changePassword()`, `ShippingManagementInterface::estimateRate()`.
- **Metadata Interface:** Dùng để lấy thông tin mô tả về entity (attributes, phiên bản...).
    - Ví dụ: `ProductMetadataInterface::getVersion()`.

---

## 10. SearchCriteria — AND/OR logic (dễ nhầm nhất)

Nguồn: https://developer.adobe.com/commerce/php/development/components/searching-with-repositories

**Quy tắc:**
- Filters trong **cùng 1 FilterGroup** → kết hợp bằng **OR**
- Các **FilterGroup khác nhau** → kết hợp bằng **AND**

Ví dụ: `(url LIKE %magento.com OR store_id = 1) AND (url_type = 1)`

```php
// Dùng SearchCriteriaBuilder (khuyến nghị — tránh shared instance)
$filter1 = $this->filterBuilder
    ->setField('url')->setValue('%magento.com')->setConditionType('like')->create();
$filter2 = $this->filterBuilder
    ->setField('store_id')->setValue('1')->setConditionType('eq')->create();

// filter1 OR filter2 → cùng 1 FilterGroup (addFilters nhận array)
$this->searchCriteriaBuilder->addFilters([$filter1, $filter2]);

$filter3 = $this->filterBuilder
    ->setField('url_type')->setValue(1)->setConditionType('eq')->create();

// filter3 → FilterGroup riêng → AND với group trên
$this->searchCriteriaBuilder->addFilters([$filter3]);

$searchCriteria = $this->searchCriteriaBuilder->create();
```

> Chi tiết sâu hơn (bulk ops, soft delete, transaction): xem [search-criteria-data-layer.md](search-criteria-data-layer.md)

### Condition types phổ biến

| Condition | Ý nghĩa |
|-----------|---------|
| `eq` | Bằng (=) |
| `neq` | Khác (!=) |
| `like` | LIKE (dùng `%` wildcard) |
| `nlike` | NOT LIKE |
| `in` | IN (value là array hoặc chuỗi phân cách bởi `,`) |
| `nin` | NOT IN |
| `gt` | Lớn hơn (>) |
| `lt` | Nhỏ hơn (<) |
| `gteq` | Lớn hơn hoặc bằng (>=) |
| `lteq` | Nhỏ hơn hoặc bằng (<=) |
| `null` | IS NULL |
| `notnull` | IS NOT NULL |

### Sorting + Pagination

```php
use Magento\Framework\Api\SortOrderBuilder;

$sortOrder = $this->sortOrderBuilder
    ->setField('created_at')
    ->setDirection(\Magento\Framework\Api\SortOrder::SORT_DESC)
    ->create();

$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 'active')
    ->setSortOrders([$sortOrder])
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->create();
```

### EAV Model — lưu ý quan trọng

Khi Repository dùng EAV collection (ví dụ: Customer, Product), phải dùng `Magento\Eav\Model\Api\SearchCriteria\CollectionProcessor` thay vì processor mặc định — nếu không custom filters sẽ không được áp dụng đúng.

```xml
<!-- di.xml -->
<type name="Vendor\Module\Model\CustomerRepository">
    <arguments>
        <argument name="collectionProcessor" xsi:type="object">
            Magento\Eav\Model\Api\SearchCriteria\CollectionProcessor
        </argument>
    </arguments>
</type>
```

---

## Liên kết

- DI & Code Generation: xem [object-manager-generated.md](object-manager-generated.md)
- SearchCriteria deep dive: xem [search-criteria-data-layer.md](search-criteria-data-layer.md)
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
- Các pattern: xem [../magento-patterns.md](../../magento-patterns.md)
