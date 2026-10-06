# Blueprint: GraphQL Trigger + `insertOnDuplicate` (upsert) — Magento 2.4.8-p5 / PHP 8.3

> Chuẩn: constitution — `declare(strict_types=1)`, DI qua constructor, `Magento\Framework\DB\Adapter\AdapterInterface::insertOnDuplicate`.
> Nguồn tham khảo gốc: `app/code/NullTraceX/InsertOnDuplicate` (đã generalize sang `Vendor\Module`).
> Module gốc upsert vào bảng của `NullTraceX_Employee` — blueprint này tự chứa schema demo để chạy được độc lập.

---

## Mục tiêu

Expose 1 GraphQL query nội bộ dùng để **seed/sync dữ liệu hàng loạt** bằng 1 câu
`INSERT ... ON DUPLICATE KEY UPDATE` duy nhất thay vì N câu `SELECT` + `INSERT/UPDATE`.

Điều kiện bắt buộc: bảng đích phải có **UNIQUE constraint trên natural key** — không có key
thì semantics trở thành "update mọi row trùng giá trị" và bảng tăng vô hạn
(xem `php8-data-idioms.md` §6).

---

## Cấu trúc file

```text
app/code/Vendor/Module/
├── registration.php
├── etc/
│   ├── module.xml
│   ├── db_schema.xml                  # bảng demo + UNIQUE key
│   └── schema.graphqls
├── Model/
│   └── Resolver/TestInsert.php        # GraphQL resolver — validate + gọi service
└── Service/
    └── AddDemoEmployeeData.php        # nghiệp vụ — build batch + insertOnDuplicate
```

---

## 1. `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module:etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0"/>
</config>
```

---

## 2. `etc/db_schema.xml`

UNIQUE trên `email` là điều kiện để `ON DUPLICATE KEY UPDATE` hoạt động đúng.

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="vendor_module_demo_employee" resource="default" engine="innodb"
           comment="Demo employee table for batch upsert">
        <column xsi:type="int" name="entity_id" unsigned="true" nullable="false" identity="true"/>
        <column xsi:type="varchar" name="name" nullable="false" length="255"/>
        <column xsi:type="varchar" name="email" nullable="false" length="255"/>
        <column xsi:type="timestamp" name="created_at" nullable="false" default="CURRENT_TIMESTAMP"
                on_update="false" comment="First inserted"/>
        <column xsi:type="timestamp" name="updated_at" nullable="false" default="CURRENT_TIMESTAMP"
                on_update="true" comment="Refreshed on each upsert"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>
        <constraint xsi:type="unique" referenceId="VENDOR_MODULE_DEMO_EMPLOYEE_EMAIL">
            <column name="email"/>
        </constraint>
    </table>
</schema>
```

Sau khi tạo/sửa schema, generate whitelist:

```bash
bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module
bin/magento setup:upgrade
```

> Upsert vào bảng của **module khác**? Bỏ `db_schema.xml` + whitelist, giữ nguyên cột
> và đảm bảo bảng đó có UNIQUE key. Không được thêm constraint vào bảng module khác.

---

## 3. `etc/schema.graphqls`

```graphql
type Query {
    testInsert(count: Int = 5): TestInsertOutput
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\TestInsert")
        @doc(description: "Seed demo employees using a single batch upsert")
}

type TestInsertOutput @doc(description: "Batch upsert result") {
    total: Int! @doc(description: "Number of rows requested")
    affected: Int! @doc(description: "Rows inserted or updated by MySQL")
}
```

> Tên query `testInsert` giữ theo module gốc (`test_insert`): đây là endpoint nội bộ để
> test/seed — khi triển khai thật, đặt tên nghiệp vụ (vd `syncEmployees`).

---

## 4. `Service/AddDemoEmployeeData.php`

Toàn bộ logic DB nằm ở service layer — resolver chỉ validate và gọi.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Phrase;

/**
 * Seeds demo employees using one INSERT ... ON DUPLICATE KEY UPDATE statement.
 *
 * The batch is a single atomic statement — no explicit transaction is needed;
 * wrap multiple statements in a transaction instead if you add them.
 */
class AddDemoEmployeeData
{
    /**
     * Upper bound protecting the endpoint from being used to generate
     * arbitrarily large inserts.
     *
     * @var int
     */
    private const MAX_BATCH_SIZE = 500;

    /**
     * @param ResourceConnection $resourceConnection
     */
    public function __construct(
        private readonly ResourceConnection $resourceConnection
    ) {}

    /**
     * Upsert $count demo rows keyed by email; existing rows keep created_at
     * and only refresh name/updated_at.
     *
     * @param int $count
     * @return int Affected row count reported by MySQL (inserts + updates).
     * @throws LocalizedException When $count is out of the allowed range.
     */
    public function execute(int $count): int
    {
        if ($count < 1 || $count > self::MAX_BATCH_SIZE) {
            throw new LocalizedException(
                new Phrase('Count must be between 1 and %1, got %2.', [self::MAX_BATCH_SIZE, $count])
            );
        }

        $now = gmdate('Y-m-d H:i:s');
        $rows = [];
        for ($i = 1; $i <= $count; $i++) {
            $rows[] = [
                'name' => sprintf('Demo Employee %d', $i),
                'email' => sprintf('demo.%d@example.com', $i),
                'created_at' => $now,   // ignored when the unique key already exists
                'updated_at' => $now,
            ];
        }

        $connection = $this->resourceConnection->getConnection();
        $table = $this->resourceConnection->getTableName('vendor_module_demo_employee');

        return (int) $connection->insertOnDuplicate(
            $table,
            $rows,
            ['name', 'updated_at'] // columns refreshed on duplicate key — created_at is preserved
        );
    }
}
```

---

## 5. `Model/Resolver/TestInsert.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\Phrase;
use Vendor\Module\Service\AddDemoEmployeeData;

/**
 * GraphQL resolver for the testInsert query — validates input and delegates to the service.
 */
class TestInsert implements ResolverInterface
{
    /**
     * @param AddDemoEmployeeData $service
     */
    public function __construct(
        private readonly AddDemoEmployeeData $service
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
        $count = (int) ($args['count'] ?? 5);
        try {
            $affected = $this->service->execute($count);
        } catch (LocalizedException $e) {
            throw new GraphQlInputException(new Phrase($e->getRawMessage(), $e->getParameters()));
        }

        return [
            'total' => $count,
            'affected' => $affected,
        ];
    }
}
```

---

## 6. Verify

```bash
bin/magento setup:di:compile && bin/magento setup:upgrade
```

```graphql
query {
    testInsert(count: 3) { total affected }
}
```

- Chạy lần 1: `affected: 3` (insert). Chạy lần 2 với cùng count: vẫn `affected: 3` (update),
  bảng vẫn **3 dòng** — `created_at` giữ nguyên, `updated_at` refresh.
- `count: 0` hoặc `count: 999` → GraphQL error `Count must be between 1 and 500`.
- Log SQL test: bật MySQL general log và xác nhận chỉ có **1 câu** `INSERT ... ON DUPLICATE KEY UPDATE`.

---

## Liên kết

- Upsert idempotent + UNIQUE key pattern: [config/references/core/php8-data-idioms.md](../../config/references/core/php8-data-idioms.md)
- Declarative Schema + whitelist: [config/references/core/declarative-schema.md](../../config/references/core/declarative-schema.md)
- GraphQL schema/resolver: [config/references/network/graphql/development.md](../../config/references/network/graphql/development.md)
- Blueprint GraphQL mutation đầy đủ (validation + auth): [graphql-mutation-input-validation-blueprint.md](graphql-mutation-input-validation-blueprint.md)
