# Unit + Static Testing (Adobe Commerce)

Tài liệu này gom phần **Unit** và **Static** theo hướng chạy nhanh trong dự án.

Nguồn:

- [PHP Unit Testing](https://developer.adobe.com/commerce/testing/guide/unit/)
- [Unit Tests in PhpStorm](https://developer.adobe.com/commerce/testing/guide/unit/phpstorm)
- [Run Unit Tests in Command Line](https://developer.adobe.com/commerce/testing/guide/unit/command-line)
- [Unit DocBlock Annotations (`@dataProvider`)](https://developer.adobe.com/commerce/testing/guide/unit/annotations)
- [Writing Testable Code](https://developer.adobe.com/commerce/testing/guide/unit/writing-testable-code)
- [Static Tests](https://developer.adobe.com/commerce/testing/guide/static/)
- [Static Analysis Setup](https://developer.adobe.com/commerce/testing/guide/static/analysis)
- [Semantic Version Checker](https://developer.adobe.com/commerce/testing/guide/svc/)
- [ObjectManager Unit Helper (legacy utility)](https://developer.adobe.com/commerce/php/development/components/object-manager/helper)

---

## 1) Lệnh chạy nhanh (copy dùng ngay)

## A. Unit tests (toàn bộ)

```bash
./vendor/bin/phpunit -c dev/tests/unit/phpunit.xml.dist
```

## B. Unit tests theo module

```bash
./vendor/bin/phpunit -c dev/tests/unit/phpunit.xml.dist app/code/<Vendor>/<Module>/Test/Unit
```

## C. Unit tests khi gặp permission/entrypoint issue

```bash
php -f vendor/bin/phpunit -- -c dev/tests/unit/phpunit.xml.dist
```

## D. Static tests (toàn bộ)

```bash
bin/magento dev:test:run static
```

---

## 2) Khi nào thêm unit test?

- Có logic xử lý/branch mới trong service/model/helper.
- Có bug fix cần chống tái phát.
- Có refactor làm thay đổi hành vi class.

Không nên dùng unit test để thay integration test:

- Không test DB thật.
- Không test wiring `di.xml`, plugin/interceptor runtime.

---

## 3) Viết code “dễ test” (rút gọn từ Adobe)

- Ưu tiên class nhỏ, một trách nhiệm.
- Constructor injection rõ ràng, tránh dependency ẩn.
- Không dùng `ObjectManager` và không `new` trực tiếp trong production code (trừ trường hợp phù hợp như factory/DTO/exception theo context).
- Ưu tiên interface nếu thực sự chỉ dùng contract của interface.
- Tránh method chain sâu gây phụ thuộc ngầm.
- Nếu muốn test `private` nhiều, thường là dấu hiệu class đang làm quá nhiều việc.

---

## 4) `@dataProvider` cho unit test

Dùng khi cùng một assertion logic cần chạy với nhiều bộ input/output.

```php
/**
 * @dataProvider dataProviderEmails
 */
public function testIsValidEmail(string $email, bool $expected): void
{
    self::assertSame($expected, $this->sut->isValidEmail($email));
}
```

Mẹo:

- Đặt key tên dataset để đọc lỗi dễ hơn.
- Dataset chỉ chứa dữ liệu cần thiết cho scenario.

---

## 5) PhpStorm setup tối thiểu

- Chọn đúng PHP interpreter cùng version môi trường chạy Magento.
- Cấu hình PHPUnit bằng `vendor/autoload.php`.
- Có thể đặt default config file: `dev/tests/unit/phpunit.xml.dist`.
- Tạo run config theo scope:
  - all unit tests
  - module directory
  - class cụ thể

---

## 6) Static tests và static analysis

## A. Static test tổng quát

- Dùng `bin/magento dev:test:run static` cho toàn dự án.

## B. Phân tích cục bộ trong IDE

- PHPCS với Magento coding standard (`Magento2`).
- PHPMD ruleset theo cấu hình trong `dev/tests/static/...`.
- ESLint cho JS theo cấu hình Magento coding standard.

Mục tiêu:

- Bắt lỗi chuẩn code sớm trước khi vào vòng review/integration.

---

## 7) Mock Repository và Service Class (patterns thực chiến)

### A. Mock Repository cơ bản

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Unit\Model;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Vendor\Module\Model\EntityService;
use Vendor\Module\Api\EntityRepositoryInterface;
use Vendor\Module\Api\Data\EntityInterface;
use Magento\Framework\Exception\NoSuchEntityException;

class EntityServiceTest extends TestCase
{
    private EntityService $sut;
    private EntityRepositoryInterface&MockObject $repositoryMock;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(EntityRepositoryInterface::class);
        $this->sut = new EntityService($this->repositoryMock);
    }

    public function testGetEntityReturnsEntity(): void
    {
        $entityId = 1;
        $entityMock = $this->createMock(EntityInterface::class);
        $entityMock->method('getId')->willReturn($entityId);

        $this->repositoryMock
            ->expects($this->once())
            ->method('getById')
            ->with($entityId)
            ->willReturn($entityMock);

        $result = $this->sut->getEntity($entityId);
        $this->assertSame($entityMock, $result);
    }

    public function testGetEntityThrowsWhenNotFound(): void
    {
        $this->repositoryMock
            ->method('getById')
            ->willThrowException(new NoSuchEntityException(__('Entity not found')));

        $this->expectException(NoSuchEntityException::class);
        $this->sut->getEntity(999);
    }
}
```

### B. Mock với data provider

```php
/**
 * @dataProvider priceDataProvider
 */
public function testCalculateDiscount(float $price, float $discount, float $expected): void
{
    $result = $this->sut->calculateDiscount($price, $discount);
    $this->assertEqualsWithDelta($expected, $result, 0.001);
}

public static function priceDataProvider(): array
{
    return [
        'zero discount'    => [100.0, 0.0, 100.0],
        'ten percent'      => [100.0, 10.0, 90.0],
        'full discount'    => [100.0, 100.0, 0.0],
        'negative price'   => [-10.0, 10.0, -9.0],  // edge case
    ];
}
```

### C. Mock Logger (Psr\Log\LoggerInterface)

```php
use Psr\Log\LoggerInterface;

$loggerMock = $this->createMock(LoggerInterface::class);
$loggerMock->expects($this->once())
    ->method('error')
    ->with($this->stringContains('Failed'));

$this->sut = new MyService($repositoryMock, $loggerMock);
```

### D. ObjectManager Helper (khi constructor quá nhiều dependency)

```php
use Magento\Framework\TestFramework\Unit\Helper\ObjectManager;

protected function setUp(): void
{
    $objectManager = new ObjectManager($this);

    // Tự động mock tất cả dependencies
    $this->sut = $objectManager->getObject(
        EntityService::class,
        [
            // Override dependency cụ thể cần control
            'entityRepository' => $this->createMock(EntityRepositoryInterface::class),
        ]
    );
}
```

**Lưu ý:** Chỉ dùng ObjectManager Helper khi constructor có nhiều dependency (≥ 5). Ưu tiên inject thủ công để test rõ ràng hơn.

---

## 7a) ObjectManager Unit Helper (khi cần)

`Magento\Framework\TestFramework\Unit\Helper\ObjectManager` có thể giúp dựng SUT nhanh khi constructor quá nhiều dependency.

Nguyên tắc:

- Dùng như utility để giảm boilerplate mock.
- Không lạm dụng để che đi thiết kế class khó test.
- Ưu tiên refactor class cho dễ test trước, helper là phương án hỗ trợ.

---

## 8) Checklist “Done” cho phần Unit/Static

- [ ] Có unit test cho logic mới/bug fix.
- [ ] Test chạy pass ở scope module.
- [ ] Có ít nhất 1 case negative/edge nếu liên quan.
- [ ] Static checks không phát sinh lỗi mới.
- [ ] Với thay đổi có thể ảnh hưởng API/service contract, đã cân nhắc chạy SVC compare.
- [ ] Báo cáo rõ lệnh đã chạy và kết quả.

---

## 9) Semantic Version Checker (SVC) - khi nên dùng

SVC dùng để phát hiện thay đổi phá vỡ tương thích ngược (backward compatibility) ở mức semantic/API.

Dùng khi:

- thay đổi interface trong `Api/` hoặc `Api/Data/`,
- đổi method signature/type/return có thể ảnh hưởng module khác,
- refactor public contract và muốn kiểm tra rủi ro BC.

Luồng cơ bản theo Adobe:

1. Clone tool `magento-semver` và cài dependency (`composer install`).
2. Chuẩn bị 2 source tree:
   - mainline (chưa có thay đổi),
   - branch hiện tại (có thay đổi).
3. Chạy compare:

```bash
bin/svc compare ../magento2-mainline ../magento2
```

Lưu ý:

- SVC là quality gate bổ sung, không thay thế unit/integration tests.
- Ưu tiên chạy cho task có rủi ro BC cao, không bắt buộc cho mọi task nhỏ.

---

## Liên kết nội bộ

- Testing tổng quan + Integration/Fixtures/Isolation: [testing-guide.md](./testing-guide.md)
- DI & Codegen: [di-codegen.md](./di-codegen.md)
- Quy tắc chung: [../../constitution.md](../../constitution.md)
