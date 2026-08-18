# Blueprint: Custom REST API với Pagination + Filtering

> Nguồn: developer.adobe.com/commerce/webapi/rest — đã refactor theo constitution
> Dùng khi: Tạo REST endpoint mới với SearchCriteria, pagination, filtering chuẩn Magento

---

## Mục tiêu

Tạo REST API endpoint `/V1/vendor-module/employees` với:
- GET list với SearchCriteria (filter, sort, pagination)
- GET by ID
- POST create
- PUT update
- DELETE

---

## Cấu trúc file

```
app/code/Vendor/Module/
├── Api/
│   ├── EmployeeRepositoryInterface.php
│   └── Data/
│       ├── EmployeeInterface.php
│       └── EmployeeSearchResultsInterface.php
├── Model/
│   ├── Employee.php
│   ├── EmployeeRepository.php
│   ├── ResourceModel/
│   │   ├── Employee.php
│   │   └── Employee/
│   │       └── Collection.php
│   └── Data/
│       └── Employee.php  (Data Object)
├── etc/
│   ├── di.xml
│   └── webapi.xml
└── registration.php
```

---

## 1. Data Interface

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

/**
 * @api
 * @since 1.0.0
 */
interface EmployeeInterface
{
    public const ENTITY_ID = 'entity_id';
    public const NAME = 'name';
    public const EMAIL = 'email';
    public const STATUS = 'status';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    /**
     * @return int|null
     */
    public function getId(): ?int;

    /**
     * @return string
     */
    public function getName(): string;

    /**
     * @param string $name
     * @return $this
     */
    public function setName(string $name): static;

    /**
     * @return string
     */
    public function getEmail(): string;

    /**
     * @param string $email
     * @return $this
     */
    public function setEmail(string $email): static;

    /**
     * @return int
     */
    public function getStatus(): int;

    /**
     * @param int $status
     * @return $this
     */
    public function setStatus(int $status): static;

    /**
     * @return string|null
     */
    public function getCreatedAt(): ?string;

    /**
     * @return string|null
     */
    public function getUpdatedAt(): ?string;
}
```

---

## 2. SearchResults Interface

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

---

## 3. Repository Interface

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api;

use Vendor\Module\Api\Data\EmployeeInterface;
use Vendor\Module\Api\Data\EmployeeSearchResultsInterface;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;

/**
 * @api
 * @since 1.0.0
 */
interface EmployeeRepositoryInterface
{
    /**
     * @param int $id
     * @return \Vendor\Module\Api\Data\EmployeeInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getById(int $id): EmployeeInterface;

    /**
     * @param \Magento\Framework\Api\SearchCriteriaInterface $searchCriteria
     * @return \Vendor\Module\Api\Data\EmployeeSearchResultsInterface
     */
    public function getList(SearchCriteriaInterface $searchCriteria): EmployeeSearchResultsInterface;

    /**
     * @param \Vendor\Module\Api\Data\EmployeeInterface $employee
     * @return \Vendor\Module\Api\Data\EmployeeInterface
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function save(EmployeeInterface $employee): EmployeeInterface;

    /**
     * @param \Vendor\Module\Api\Data\EmployeeInterface $employee
     * @return bool
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function delete(EmployeeInterface $employee): bool;

    /**
     * @param int $id
     * @return bool
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function deleteById(int $id): bool;
}
```

---

## 4. Data Object (Model/Data/Employee.php)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Data;

use Magento\Framework\Api\AbstractExtensibleObject;
use Vendor\Module\Api\Data\EmployeeInterface;

class Employee extends AbstractExtensibleObject implements EmployeeInterface
{
    public function getId(): ?int
    {
        return $this->_get(self::ENTITY_ID) !== null
            ? (int)$this->_get(self::ENTITY_ID)
            : null;
    }

    public function getName(): string
    {
        return (string)$this->_get(self::NAME);
    }

    public function setName(string $name): static
    {
        return $this->setData(self::NAME, $name);
    }

    public function getEmail(): string
    {
        return (string)$this->_get(self::EMAIL);
    }

    public function setEmail(string $email): static
    {
        return $this->setData(self::EMAIL, $email);
    }

    public function getStatus(): int
    {
        return (int)$this->_get(self::STATUS);
    }

    public function setStatus(int $status): static
    {
        return $this->setData(self::STATUS, $status);
    }

    public function getCreatedAt(): ?string
    {
        return $this->_get(self::CREATED_AT);
    }

    public function getUpdatedAt(): ?string
    {
        return $this->_get(self::UPDATED_AT);
    }
}
```

---

## 5. Repository Implementation

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\EmployeeRepositoryInterface;
use Vendor\Module\Api\Data\EmployeeInterface;
use Vendor\Module\Api\Data\EmployeeSearchResultsInterface;
use Vendor\Module\Api\Data\EmployeeSearchResultsInterfaceFactory;
use Vendor\Module\Model\ResourceModel\Employee as EmployeeResource;
use Vendor\Module\Model\ResourceModel\Employee\CollectionFactory;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;
use Magento\Framework\Exception\CouldNotDeleteException;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\NoSuchEntityException;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function __construct(
        private readonly EmployeeResource $resource,
        private readonly EmployeeFactory $employeeFactory,
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
        $this->collectionProcessor->process($searchCriteria, $collection);

        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);
        $searchResults->setItems($collection->getItems());
        $searchResults->setTotalCount($collection->getSize());

        return $searchResults;
    }

    public function save(EmployeeInterface $employee): EmployeeInterface
    {
        try {
            $this->resource->save($employee);
        } catch (\Exception $e) {
            throw new CouldNotSaveException(
                __('Could not save employee: %1', $e->getMessage()),
                $e
            );
        }
        return $employee;
    }

    public function delete(EmployeeInterface $employee): bool
    {
        try {
            $this->resource->delete($employee);
        } catch (\Exception $e) {
            throw new CouldNotDeleteException(
                __('Could not delete employee: %1', $e->getMessage()),
                $e
            );
        }
        return true;
    }

    public function deleteById(int $id): bool
    {
        return $this->delete($this->getById($id));
    }
}
```

---

## 6. webapi.xml

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- GET list với SearchCriteria -->
    <route url="/V1/vendor-module/employees" method="GET">
        <service class="Vendor\Module\Api\EmployeeRepositoryInterface" method="getList"/>
        <resources>
            <resource ref="Vendor_Module::employees_view"/>
        </resources>
    </route>

    <!-- GET by ID -->
    <route url="/V1/vendor-module/employees/:id" method="GET">
        <service class="Vendor\Module\Api\EmployeeRepositoryInterface" method="getById"/>
        <resources>
            <resource ref="Vendor_Module::employees_view"/>
        </resources>
    </route>

    <!-- POST create -->
    <route url="/V1/vendor-module/employees" method="POST">
        <service class="Vendor\Module\Api\EmployeeRepositoryInterface" method="save"/>
        <resources>
            <resource ref="Vendor_Module::employees_manage"/>
        </resources>
    </route>

    <!-- PUT update -->
    <route url="/V1/vendor-module/employees/:id" method="PUT">
        <service class="Vendor\Module\Api\EmployeeRepositoryInterface" method="save"/>
        <resources>
            <resource ref="Vendor_Module::employees_manage"/>
        </resources>
    </route>

    <!-- DELETE -->
    <route url="/V1/vendor-module/employees/:id" method="DELETE">
        <service class="Vendor\Module\Api\EmployeeRepositoryInterface" method="deleteById"/>
        <resources>
            <resource ref="Vendor_Module::employees_manage"/>
        </resources>
    </route>
</routes>
```

---

## 7. di.xml

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Preferences -->
    <preference for="Vendor\Module\Api\EmployeeRepositoryInterface"
                type="Vendor\Module\Model\EmployeeRepository"/>
    <preference for="Vendor\Module\Api\Data\EmployeeInterface"
                type="Vendor\Module\Model\Data\Employee"/>
    <preference for="Vendor\Module\Api\Data\EmployeeSearchResultsInterface"
                type="Magento\Framework\Api\SearchResults"/>

    <!-- CollectionProcessor với custom filters -->
    <type name="Vendor\Module\Model\EmployeeRepository">
        <arguments>
            <argument name="collectionProcessor" xsi:type="object">
                Vendor\Module\Model\Api\SearchCriteria\EmployeeCollectionProcessor
            </argument>
        </arguments>
    </type>

    <!-- Custom CollectionProcessor -->
    <virtualType name="Vendor\Module\Model\Api\SearchCriteria\EmployeeCollectionProcessor"
                 type="Magento\Framework\Api\SearchCriteria\CollectionProcessor">
        <arguments>
            <argument name="processors" xsi:type="array">
                <item name="filters" xsi:type="object">
                    Magento\Framework\Api\SearchCriteria\CollectionProcessor\FilterProcessor
                </item>
                <item name="sorting" xsi:type="object">
                    Magento\Framework\Api\SearchCriteria\CollectionProcessor\SortingProcessor
                </item>
                <item name="pagination" xsi:type="object">
                    Magento\Framework\Api\SearchCriteria\CollectionProcessor\PaginationProcessor
                </item>
            </argument>
        </arguments>
    </virtualType>
</config>
```

---

## 8. Sử dụng API

### GET list với filter và pagination

```bash
# Lấy employees active, page 1, 10 items/page, sort by name ASC
GET /rest/V1/vendor-module/employees?
  searchCriteria[filter_groups][0][filters][0][field]=status&
  searchCriteria[filter_groups][0][filters][0][value]=1&
  searchCriteria[filter_groups][0][filters][0][condition_type]=eq&
  searchCriteria[sortOrders][0][field]=name&
  searchCriteria[sortOrders][0][direction]=ASC&
  searchCriteria[pageSize]=10&
  searchCriteria[currentPage]=1

Authorization: Bearer <admin_token>
```

### Response

```json
{
    "items": [
        {
            "entity_id": 1,
            "name": "Alice",
            "email": "alice@example.com",
            "status": 1,
            "created_at": "2024-01-01 00:00:00"
        }
    ],
    "search_criteria": {
        "filter_groups": [...],
        "page_size": 10,
        "current_page": 1
    },
    "total_count": 50
}
```

### POST create

```bash
POST /rest/V1/vendor-module/employees
Content-Type: application/json
Authorization: Bearer <admin_token>

{
    "employee": {
        "name": "Bob",
        "email": "bob@example.com",
        "status": 1
    }
}
```

---

## Verify steps

```bash
# 1. Compile
bin/magento setup:di:compile

# 2. Upgrade
bin/magento setup:upgrade

# 3. Test GET list
curl -X GET "http://magento.local/rest/V1/vendor-module/employees?searchCriteria[pageSize]=5" \
  -H "Authorization: Bearer <token>"

# 4. Test POST
curl -X POST "http://magento.local/rest/V1/vendor-module/employees" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"employee": {"name": "Test", "email": "test@example.com", "status": 1}}'
```
