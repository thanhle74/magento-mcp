# Blueprint: Integration Test Module

> Nguồn: https://developer.adobe.com/commerce/testing/guide/integration/data-fixtures-guide — đã refactor theo constitution
> Mục đích: Cấu trúc integration test chuẩn cho custom module

---

## Tổng quan

Integration test trong Magento chạy với **DB thật** (DB riêng cho test), DI container thật, và toàn bộ Magento framework. Dùng để test:
- Repository CRUD với DB thật
- Plugin/Observer wiring
- Service contract behavior
- Custom indexer

---

## Cấu trúc thư mục test

```
app/code/Vendor/Module/Test/Integration/
├── Model/
│   └── CustomEntityRepositoryTest.php
├── Service/
│   └── CustomServiceTest.php
└── _files/                          # Legacy fixtures (deprecated — chỉ dùng khi maintain)
    └── custom_entity.php
```

---

## Setup môi trường

### 1. Tạo DB riêng cho integration test

```bash
mysql -u root -p -e "CREATE DATABASE magento_integration_tests;"
```

### 2. Cấu hình `dev/tests/integration/etc/install-config-mysql.php`

```php
<?php
return [
    'db-host' => 'localhost',
    'db-user' => 'root',
    'db-password' => 'password',
    'db-name' => 'magento_integration_tests',
    'db-prefix' => '',
    'backend-frontname' => 'backend',
    'admin-user' => \Magento\TestFramework\Bootstrap::ADMIN_NAME,
    'admin-password' => \Magento\TestFramework\Bootstrap::ADMIN_PASSWORD,
    'admin-email' => \Magento\TestFramework\Bootstrap::ADMIN_EMAIL,
    'admin-firstname' => \Magento\TestFramework\Bootstrap::ADMIN_FIRSTNAME,
    'admin-lastname' => \Magento\TestFramework\Bootstrap::ADMIN_LASTNAME,
];
```

### 3. Chạy integration test

```bash
cd dev/tests/integration

# Toàn bộ module
../../../vendor/bin/phpunit ../../../app/code/Vendor/Module/Test/Integration

# File cụ thể
../../../vendor/bin/phpunit ../../../app/code/Vendor/Module/Test/Integration/Model/CustomEntityRepositoryTest.php

# Method cụ thể
../../../vendor/bin/phpunit --filter 'testSaveAndLoad' \
    ../../../app/code/Vendor/Module/Test/Integration/Model/CustomEntityRepositoryTest.php
```

---

## Ví dụ 1: Repository Test (PHP Attributes — khuyến nghị)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Integration\Model;

use Magento\Catalog\Test\Fixture\Product as ProductFixture;
use Magento\TestFramework\Fixture\DataFixture;
use Magento\TestFramework\Fixture\DataFixtureStorageManager;
use Magento\TestFramework\Helper\Bootstrap;
use PHPUnit\Framework\TestCase;
use Vendor\Module\Api\CustomEntityRepositoryInterface;
use Vendor\Module\Api\Data\CustomEntityInterfaceFactory;

/**
 * @magentoDbIsolation enabled
 */
class CustomEntityRepositoryTest extends TestCase
{
    private CustomEntityRepositoryInterface $repository;
    private CustomEntityInterfaceFactory $entityFactory;

    protected function setUp(): void
    {
        $objectManager = Bootstrap::getObjectManager();
        $this->repository = $objectManager->get(CustomEntityRepositoryInterface::class);
        $this->entityFactory = $objectManager->get(CustomEntityInterfaceFactory::class);
    }

    /**
     * Test save và load entity
     */
    public function testSaveAndLoad(): void
    {
        $entity = $this->entityFactory->create();
        $entity->setTitle('Test Entity');
        $entity->setStatus(1);

        $savedEntity = $this->repository->save($entity);

        $this->assertNotNull($savedEntity->getId());
        $this->assertGreaterThan(0, (int) $savedEntity->getId());

        // Load lại và verify
        $loadedEntity = $this->repository->getById((int) $savedEntity->getId());
        $this->assertEquals('Test Entity', $loadedEntity->getTitle());
        $this->assertEquals(1, $loadedEntity->getStatus());
    }

    /**
     * Test delete entity
     */
    public function testDelete(): void
    {
        $entity = $this->entityFactory->create();
        $entity->setTitle('To Delete');
        $savedEntity = $this->repository->save($entity);
        $entityId = (int) $savedEntity->getId();

        $this->repository->deleteById($entityId);

        $this->expectException(\Magento\Framework\Exception\NoSuchEntityException::class);
        $this->repository->getById($entityId);
    }

    /**
     * Test getList với SearchCriteria
     */
    public function testGetList(): void
    {
        // Tạo 3 entities
        for ($i = 1; $i <= 3; $i++) {
            $entity = $this->entityFactory->create();
            $entity->setTitle("Entity $i");
            $entity->setStatus(1);
            $this->repository->save($entity);
        }

        $searchCriteria = Bootstrap::getObjectManager()
            ->get(\Magento\Framework\Api\SearchCriteriaBuilder::class)
            ->addFilter('status', 1)
            ->setPageSize(10)
            ->create();

        $result = $this->repository->getList($searchCriteria);

        $this->assertGreaterThanOrEqual(3, $result->getTotalCount());
    }
}
```

---

## Ví dụ 2: Test với Product Fixture (PHP Attributes)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Integration\Service;

use Magento\Catalog\Test\Fixture\Product as ProductFixture;
use Magento\TestFramework\Fixture\DataFixture;
use Magento\TestFramework\Fixture\DataFixtureStorageManager;
use Magento\TestFramework\Helper\Bootstrap;
use PHPUnit\Framework\TestCase;
use Vendor\Module\Api\CustomServiceInterface;

class CustomServiceTest extends TestCase
{
    private CustomServiceInterface $service;

    protected function setUp(): void
    {
        $this->service = Bootstrap::getObjectManager()->get(CustomServiceInterface::class);
    }

    /**
     * Test service với product fixture
     */
    #[DataFixture(ProductFixture::class, ['price' => 100.00, 'sku' => 'test-product'], 'product')]
    public function testProcessProduct(): void
    {
        $fixtures = DataFixtureStorageManager::getStorage();
        $product = $fixtures->get('product');

        $result = $this->service->processProduct((int) $product->getId());

        $this->assertTrue($result->isSuccess());
        $this->assertEquals($product->getSku(), $result->getSku());
    }

    /**
     * Test với nhiều products
     */
    #[
        DataFixture(ProductFixture::class, ['price' => 50.00], 'product1'),
        DataFixture(ProductFixture::class, ['price' => 150.00], 'product2'),
    ]
    public function testBulkProcess(): void
    {
        $fixtures = DataFixtureStorageManager::getStorage();
        $product1 = $fixtures->get('product1');
        $product2 = $fixtures->get('product2');

        $results = $this->service->bulkProcess([
            (int) $product1->getId(),
            (int) $product2->getId(),
        ]);

        $this->assertCount(2, $results);
    }
}
```

---

## Ví dụ 3: Controller Test (Admin)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Integration\Controller\Adminhtml;

use Magento\TestFramework\TestCase\AbstractBackendController;

/**
 * @magentoAppArea adminhtml
 */
class EntityControllerTest extends AbstractBackendController
{
    protected $resource = 'Vendor_Module::entity_view';
    protected $uri = 'backend/vendor_module/entity/index';

    public function testIndexAction(): void
    {
        $this->dispatch($this->uri);

        $this->assertEquals(200, $this->getResponse()->getHttpResponseCode());
        $this->assertStringContainsString(
            'Vendor Module Entities',
            $this->getResponse()->getBody()
        );
    }

    public function testSaveAction(): void
    {
        $this->getRequest()->setMethod('POST');
        $this->getRequest()->setPostValue([
            'title' => 'New Entity',
            'status' => 1,
            'form_key' => $this->_objectManager->get(\Magento\Framework\Data\Form\FormKey::class)->getFormKey(),
        ]);

        $this->dispatch('backend/vendor_module/entity/save');

        $this->assertRedirect($this->stringContains('vendor_module/entity'));
    }
}
```

---

## Ví dụ 4: Custom Fixture Class

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Fixture;

use Magento\TestFramework\Fixture\RevertibleDataFixtureInterface;
use Vendor\Module\Api\CustomEntityRepositoryInterface;
use Vendor\Module\Api\Data\CustomEntityInterfaceFactory;

class CustomEntity implements RevertibleDataFixtureInterface
{
    public function __construct(
        private readonly CustomEntityRepositoryInterface $repository,
        private readonly CustomEntityInterfaceFactory $entityFactory
    ) {}

    public function apply(array $data = []): ?\Magento\TestFramework\Fixture\DataFixtureStorageInterface
    {
        $entity = $this->entityFactory->create();
        $entity->setTitle($data['title'] ?? 'Default Title');
        $entity->setStatus($data['status'] ?? 1);

        $savedEntity = $this->repository->save($entity);

        return new \Magento\TestFramework\Fixture\DataFixtureStorage($savedEntity);
    }

    public function revert(\Magento\TestFramework\Fixture\DataFixtureInterface $dataFixture): void
    {
        $entity = $dataFixture->get();
        if ($entity && $entity->getId()) {
            $this->repository->deleteById((int) $entity->getId());
        }
    }
}
```

### Dùng custom fixture

```php
#[DataFixture(CustomEntity::class, ['title' => 'My Entity', 'status' => 1], 'entity')]
public function testWithCustomFixture(): void
{
    $entity = DataFixtureStorageManager::getStorage()->get('entity');
    $this->assertEquals('My Entity', $entity->getTitle());
}
```

---

## Annotations quan trọng (legacy — dùng khi maintain test cũ)

```php
/**
 * @magentoAppArea frontend|adminhtml|global
 * @magentoDbIsolation enabled|disabled
 * @magentoAppIsolation enabled|disabled
 * @magentoConfigFixture current_store general/locale/code en_US
 * @magentoDataFixture Magento/Catalog/_files/product_simple.php
 */
```

> **Lưu ý:** Với test mới, ưu tiên PHP Attributes thay vì DocBlock annotations.

---

## Checklist

- [ ] DB integration test riêng đã cấu hình
- [ ] Test dùng PHP Attributes cho fixtures mới
- [ ] Mỗi test có isolation (DB rollback)
- [ ] Custom fixture implement `RevertibleDataFixtureInterface`
- [ ] Test cover: happy path + edge case + negative case
- [ ] Chạy được với lệnh: `../../../vendor/bin/phpunit <path>`

---

## Liên kết

- Testing Guide: [config/references/ops/testing-guide.md](../../config/references/ops/testing-guide.md)
- Unit Testing: [config/references/ops/unit-testing.md](../../config/references/ops/unit-testing.md)
