# Tham khảo: Service Contracts (API & Repositories)

Nguồn: https://developer.adobe.com/commerce/php/development/components/service-contracts/

---

## 1. Service Contract là gì?

Service Contract là một bộ các PHP Interface được định nghĩa cho một module. Nó đóng vai trò là "lớp bảo vệ" bên ngoài, che giấu logic phức tạp bên trong Model và Resource Model. Mọi Interface trong Service Contract được coi là **Public API** (bắt buộc có tag `@api`).

**Cấu trúc folder bắt buộc (trong `app/code/<Vendor>/<Module>/`):**
- **`Api/`**: Chứa các **Service Interfaces** (ví dụ: Repository, Management interfaces).
- **`Api/Data/`**: Chứa các **Data Interfaces** (định nghĩa các getter/setter cho entity).

---

## 2. Data Interfaces (Thực thể dữ liệu)

Nằm trong `Api/Data/`. Giúp định nghĩa cấu trúc dữ liệu mà không quan tâm nó lưu ở bảng nào (EAV hay Flat table).

### Ví dụ: `EmployeeInterface.php`

```php
namespace <Vendor>\<Module>\Api\Data;

interface EmployeeInterface
{
    const ENTITY_ID = 'entity_id';
    const NAME = 'name';

    /** @return int|null */
    public function getEntityId();

    /** @param int $entityId @return $this */
    public function setEntityId($entityId);

    /** @return string|null */
    public function getName();

    /** @param string $name @return $this */
    public function setName($name);
}
```

---

## 3. Service Interfaces (Repository)

Nằm trong `Api/`. Thường là các Repository dùng để Lưu, Xoá, Lấy dữ liệu.

### Ví dụ: `EmployeeRepositoryInterface.php`

```php
namespace <Vendor>\<Module>\Api;

use <Vendor>\<Module>\Api\Data\EmployeeInterface;

interface EmployeeRepositoryInterface
{
    /** @param int $id @return EmployeeInterface */
    public function getById($id);

    /** @param EmployeeInterface $employee @return EmployeeInterface */
    public function save(EmployeeInterface $employee);

    /** @param int $id @return bool */
    public function deleteById($id);
}
```

---

## 4. Tại sao AI phải tuân thủ?

1. **Auto-generated Web API:** Khi định nghĩa đúng Interface trong `Api/`, chúng ta chỉ cần khai báo trong `webapi.xml`, Magento sẽ tự tạo endpoint `/V1/employees/:id`.
2. **Decoupling:** Các module khác khi gọi đến module này sẽ gọi qua `Api/Interface`, không quan tâm logic bên trong `Model/` thay đổi thế nào.
3. **Sử dụng `@api` tag:** Luôn thêm `@api` trong docblock của Interface để đánh dấu đây là Public API ổn định.

---

## 5. Quy trình làm việc đề xuất:

Khi tạo một tính năng mới (Feature), chúng ta sẽ làm theo thứ tự:
1. Tạo **Data Interface** (`Api/Data/`).
2. Tạo **Service Interface** (`Api/`).
3. Tạo **Model** implement Data Interface.
4. Tạo **Repository** implement Service Interface.
5. Cấu hình **`di.xml`** để map Interface -> Class thực tế (Preference).

---

## 6. Repository Design Pattern (CRUD chuẩn)

Một Repository chuẩn cho một Entity (ví dụ: `Employee`) bắt buộc phải có các method sau:

- `save(EmployeeInterface $employee)`
- `getById($id)`
- `getList(SearchCriteriaInterface $searchCriteria)`: Trả về `EmployeeSearchResultsInterface`
- `delete(EmployeeInterface $employee)`
- `deleteById($id)`

---

## 7. Thực thi getList() với CollectionProcessor

Đây là cách hiện đại nhất (Modern way) để viết hàm `getList`.

**1. PHP Implementation:**
```php
public function getList(SearchCriteriaInterface $searchCriteria)
{
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

### Ví dụ: `EmployeeSearchResultsInterface.php`

```php
namespace <Vendor>\<Module>\Api\Data;

use Magento\Framework\Api\SearchResultsInterface;

interface EmployeeSearchResultsInterface extends SearchResultsInterface
{
    /** @return \ <Vendor>\<Module>\Api\Data\EmployeeInterface[] */
    public function getItems();

    /** @param \ <Vendor>\<Module>\Api\Data\EmployeeInterface[] $items @return $this */
    public function setItems(array $items);
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

- DI & Code Generation: xem [di-codegen.md](./di-codegen.md)
- Series nền tảng PHP MVC Developers: xem [php-mvc-developer-series.md](./php-mvc-developer-series.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Các pattern: xem [../magento-patterns.md](../magento-patterns.md)
