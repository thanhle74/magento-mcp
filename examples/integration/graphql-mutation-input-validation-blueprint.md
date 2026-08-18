# Blueprint: Custom GraphQL Mutation với Input Validation

> Nguồn: developer.adobe.com/commerce/webapi/graphql — đã refactor theo constitution
> Dùng khi: Tạo GraphQL mutation mới với input validation, auth check, error handling chuẩn

---

## Mục tiêu

Tạo GraphQL mutation `createEmployee` với:
- Input type validation
- Customer authentication check
- Custom error handling
- Return type với extension attributes

---

## Cấu trúc file

```
app/code/Vendor/Module/
├── Model/
│   └── Resolver/
│       └── CreateEmployee.php
├── etc/
│   └── schema.graphqls
└── registration.php
```

---

## 1. schema.graphqls

```graphql
type Mutation {
    createEmployee(input: CreateEmployeeInput!): CreateEmployeeOutput @resolver(class: "Vendor\\Module\\Model\\Resolver\\CreateEmployee") @doc(description: "Create a new employee")
    updateEmployee(id: Int!, input: UpdateEmployeeInput!): CreateEmployeeOutput @resolver(class: "Vendor\\Module\\Model\\Resolver\\UpdateEmployee") @doc(description: "Update an existing employee")
    deleteEmployee(id: Int!): Boolean @resolver(class: "Vendor\\Module\\Model\\Resolver\\DeleteEmployee") @doc(description: "Delete an employee")
}

type Query {
    employee(id: Int!): EmployeeOutput @resolver(class: "Vendor\\Module\\Model\\Resolver\\Employee") @doc(description: "Get employee by ID") @cache(cacheIdentity: "Vendor\\Module\\Model\\Resolver\\Employee\\Identity")
    employees(
        filter: EmployeeFilterInput
        pageSize: Int = 20
        currentPage: Int = 1
    ): EmployeeSearchResult @resolver(class: "Vendor\\Module\\Model\\Resolver\\Employees") @doc(description: "Get list of employees")
}

input CreateEmployeeInput {
    name: String! @doc(description: "Employee name")
    email: String! @doc(description: "Employee email")
    department: String @doc(description: "Department name")
    status: Int = 1 @doc(description: "Status: 1=active, 0=inactive")
}

input UpdateEmployeeInput {
    name: String @doc(description: "Employee name")
    email: String @doc(description: "Employee email")
    department: String @doc(description: "Department name")
    status: Int @doc(description: "Status: 1=active, 0=inactive")
}

input EmployeeFilterInput {
    name: FilterEqualTypeInput @doc(description: "Filter by name")
    email: FilterEqualTypeInput @doc(description: "Filter by email")
    status: FilterEqualTypeInput @doc(description: "Filter by status")
}

type CreateEmployeeOutput {
    employee: EmployeeOutput! @doc(description: "Created/updated employee")
}

type EmployeeOutput {
    id: Int! @doc(description: "Employee ID")
    name: String! @doc(description: "Employee name")
    email: String! @doc(description: "Employee email")
    department: String @doc(description: "Department name")
    status: Int! @doc(description: "Status")
    created_at: String @doc(description: "Created at")
}

type EmployeeSearchResult {
    items: [EmployeeOutput]! @doc(description: "List of employees")
    page_info: SearchResultPageInfo! @doc(description: "Pagination info")
    total_count: Int! @doc(description: "Total count")
}
```

---

## 2. CreateEmployee Resolver

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Vendor\Module\Api\EmployeeRepositoryInterface;
use Vendor\Module\Api\Data\EmployeeInterfaceFactory;
use Vendor\Module\Model\Validator\EmployeeInputValidator;

class CreateEmployee implements ResolverInterface
{
    public function __construct(
        private readonly EmployeeRepositoryInterface $employeeRepository,
        private readonly EmployeeInterfaceFactory $employeeFactory,
        private readonly EmployeeInputValidator $validator
    ) {}

    /**
     * @inheritdoc
     */
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): array {
        // 1. Authentication check
        if (!$context->getUserId()) {
            throw new GraphQlAuthorizationException(
                __('The current customer is not authorized to create employees.')
            );
        }

        // 2. Input validation
        $input = $args['input'] ?? [];
        $this->validateInput($input);

        // 3. Business logic
        $employee = $this->employeeFactory->create();
        $employee->setName($input['name']);
        $employee->setEmail($input['email']);
        $employee->setStatus($input['status'] ?? 1);

        if (isset($input['department'])) {
            $employee->setData('department', $input['department']);
        }

        // 4. Save
        $savedEmployee = $this->employeeRepository->save($employee);

        // 5. Return formatted data
        return [
            'employee' => $this->formatEmployee($savedEmployee),
        ];
    }

    private function validateInput(array $input): void
    {
        if (empty($input['name'])) {
            throw new GraphQlInputException(__('Employee name is required.'));
        }

        if (strlen($input['name']) > 255) {
            throw new GraphQlInputException(__('Employee name cannot exceed 255 characters.'));
        }

        if (empty($input['email'])) {
            throw new GraphQlInputException(__('Employee email is required.'));
        }

        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            throw new GraphQlInputException(__('Invalid email format.'));
        }

        if (isset($input['status']) && !in_array($input['status'], [0, 1], true)) {
            throw new GraphQlInputException(__('Status must be 0 or 1.'));
        }
    }

    private function formatEmployee(\Vendor\Module\Api\Data\EmployeeInterface $employee): array
    {
        return [
            'id' => (int)$employee->getId(),
            'name' => $employee->getName(),
            'email' => $employee->getEmail(),
            'department' => $employee->getData('department'),
            'status' => (int)$employee->getStatus(),
            'created_at' => $employee->getCreatedAt(),
        ];
    }
}
```

---

## 3. Employee Query Resolver (với cache)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Vendor\Module\Api\EmployeeRepositoryInterface;

class Employee implements ResolverInterface
{
    public function __construct(
        private readonly EmployeeRepositoryInterface $employeeRepository
    ) {}

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): array {
        $id = (int)($args['id'] ?? 0);

        if ($id <= 0) {
            throw new \Magento\Framework\GraphQl\Exception\GraphQlInputException(
                __('Employee ID must be a positive integer.')
            );
        }

        try {
            $employee = $this->employeeRepository->getById($id);
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            throw new GraphQlNoSuchEntityException(
                __('Employee with id "%1" does not exist.', $id),
                $e
            );
        }

        return [
            'id' => (int)$employee->getId(),
            'name' => $employee->getName(),
            'email' => $employee->getEmail(),
            'status' => (int)$employee->getStatus(),
            'created_at' => $employee->getCreatedAt(),
            'model' => $employee, // Dùng cho cache identity
        ];
    }
}
```

---

## 4. Cache Identity

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver\Employee;

use Magento\Framework\GraphQl\Query\Resolver\IdentityInterface;

class Identity implements IdentityInterface
{
    private string $cacheTag = 'vendor_module_employee';

    public function getIdentities(array $resolvedData): array
    {
        $ids = [];

        if (isset($resolvedData['id'])) {
            $ids[] = $this->cacheTag . '_' . $resolvedData['id'];
        }

        return $ids;
    }
}
```

---

## 5. Employees List Resolver (với pagination)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\FilterBuilder;
use Vendor\Module\Api\EmployeeRepositoryInterface;

class Employees implements ResolverInterface
{
    public function __construct(
        private readonly EmployeeRepositoryInterface $employeeRepository,
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder,
        private readonly FilterBuilder $filterBuilder
    ) {}

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): array {
        $pageSize = (int)($args['pageSize'] ?? 20);
        $currentPage = (int)($args['currentPage'] ?? 1);
        $filter = $args['filter'] ?? [];

        // Build filters
        foreach ($filter as $field => $condition) {
            if (isset($condition['eq'])) {
                $this->searchCriteriaBuilder->addFilter($field, $condition['eq']);
            }
        }

        $searchCriteria = $this->searchCriteriaBuilder
            ->setPageSize($pageSize)
            ->setCurrentPage($currentPage)
            ->create();

        $result = $this->employeeRepository->getList($searchCriteria);

        $items = [];
        foreach ($result->getItems() as $employee) {
            $items[] = [
                'id' => (int)$employee->getId(),
                'name' => $employee->getName(),
                'email' => $employee->getEmail(),
                'status' => (int)$employee->getStatus(),
                'created_at' => $employee->getCreatedAt(),
            ];
        }

        $totalCount = $result->getTotalCount();
        $totalPages = $pageSize > 0 ? (int)ceil($totalCount / $pageSize) : 1;

        return [
            'items' => $items,
            'total_count' => $totalCount,
            'page_info' => [
                'page_size' => $pageSize,
                'current_page' => $currentPage,
                'total_pages' => $totalPages,
            ],
        ];
    }
}
```

---

## 6. Exception types

| Exception | Khi nào dùng | HTTP Status |
|-----------|-------------|-------------|
| `GraphQlInputException` | Input không hợp lệ | 400 |
| `GraphQlAuthorizationException` | Không có quyền | 401 |
| `GraphQlNoSuchEntityException` | Entity không tồn tại | 404 |
| `GraphQlAlreadyExistsException` | Entity đã tồn tại | 409 |

---

## 7. Test GraphQL

```graphql
# Mutation: Create employee
mutation {
    createEmployee(input: {
        name: "Alice"
        email: "alice@example.com"
        department: "Engineering"
        status: 1
    }) {
        employee {
            id
            name
            email
            department
            status
        }
    }
}

# Query: Get employee
query {
    employee(id: 1) {
        id
        name
        email
        status
    }
}

# Query: List with filter
query {
    employees(
        filter: { status: { eq: "1" } }
        pageSize: 10
        currentPage: 1
    ) {
        items {
            id
            name
            email
        }
        total_count
        page_info {
            current_page
            total_pages
        }
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

# 3. Test mutation
curl -X POST "http://magento.local/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer_token>" \
  -d '{"query": "mutation { createEmployee(input: {name: \"Test\", email: \"test@example.com\"}) { employee { id name } } }"}'

# 4. Test query
curl -X GET "http://magento.local/graphql?query={employee(id:1){id name email}}"
```
