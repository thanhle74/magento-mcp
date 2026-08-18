# Adobe Commerce Testing Guide (Thực dụng cho project này)

Tài liệu này tóm tắt bộ Testing Guide của Adobe theo hướng **dùng ngay** cho workflow Magento của bạn, tránh đọc dàn trải.

Nguồn chính:

- [Application Testing Guide Introduction](https://developer.adobe.com/commerce/testing/guide/)
- [Integration Testing](https://developer.adobe.com/commerce/testing/guide/integration/)
- [DocBlock Annotations](https://developer.adobe.com/commerce/testing/guide/integration/annotations/)
- [Working with Data Fixtures](https://developer.adobe.com/commerce/testing/guide/integration/data-fixtures-guide)
- [Database Isolation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-db-isolation)
- [Data Fixture Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-data-fixture)
- [Configuration Fixture Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-config-fixture)
- [Component Registration Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-components-dir)
- [Cache Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-cache)
- [Application Isolation Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-app-isolation)
- [Application Area Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-app-area)
- [Dependency Annotation](https://developer.adobe.com/commerce/testing/guide/integration/annotations/magento-depends)
- [PHP built-in Attributes](https://developer.adobe.com/commerce/testing/guide/integration/attributes/)
- [Data Fixture Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/data-fixture)
- [Data Fixture Before Transaction Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/data-fixture-before-transaction)
- [Database Isolation Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/db-isolation)
- [Configuration Fixture Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/config-fixture)
- [Component Registration Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/components-dir)
- [Cache Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/cache)
- [Application Isolation Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/app-isolation)
- [Application Area Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/app-area)
- [Indexer Dimension Mode Attribute](https://developer.adobe.com/commerce/testing/guide/integration/attributes/indexer-dimension-mode)
- [JavaScript Unit Testing with Jasmine](https://developer.adobe.com/commerce/testing/guide/js/)

---

## 1) Bản đồ test levels (nên chọn gì khi nào)

- **Unit**: test logic cục bộ, không dùng DB thật, chạy nhanh nhất.
- **Integration**: test wiring thật của DI/config/resource/repository với runtime Magento.
- **Web API Functional**: test contract REST/SOAP/GraphQL từ góc nhìn client.
- **MFTF/Functional**: test UI storefront/admin ở mức người dùng.
- **Static**: `phpcs`, `phpmd`, dependency/legacy checks, PHPStan.

Quy tắc thực dụng:

- Sửa logic class => bắt buộc Unit.
- Sửa `di.xml`, repository, DB schema/patch, plugin wiring => thêm Integration.
- Sửa endpoint API => thêm API functional hoặc ít nhất integration + call verify.
- Sửa flow admin/storefront quan trọng => thêm MFTF/manual test checklist.

---

## 2) Integration testing - setup tối thiểu cần nhớ

- Dùng **DB riêng cho integration tests**, không dùng DB project đang chạy.
- Tạo file cấu hình test từ `.dist`:
  - `dev/tests/integration/etc/install-config-mysql.php`
  - (nếu cần) `dev/tests/integration/etc/config-global.php`
  - `dev/tests/integration/phpunit.xml`
- Chạy test từ đúng thư mục:
  - `cd dev/tests/integration`
  - `../../../vendor/bin/phpunit`

Chạy scope nhỏ khi develop:

- theo thư mục module: `../../../vendor/bin/phpunit ../../../app/code/<Vendor>/<Module>/Test/Integration`
- theo file test: `../../../vendor/bin/phpunit <path-to-test-file>`
- theo method: thêm `--filter 'testMethodName'`

---

## 3) DocBlock annotations vs PHP Attributes (điểm rất quan trọng)

- Adobe hiện **không khuyến nghị** tạo test mới bằng DocBlock annotations cho fixtures.
- Với data fixtures mới, ưu tiên **PHP Attributes** + parameterized fixtures.
- DocBlock annotations vẫn cần biết để đọc/maintain code legacy.

Kết luận cho project:

- Test mới: ưu tiên attributes-based fixtures.
- Test cũ: chỉ chỉnh DocBlock khi cần maintain, tránh mở rộng theo hướng legacy.

Rule cho team:

- Mặc định dùng **PHP Attributes** cho integration test mới.
- Chỉ dùng DocBlock annotations khi đang sửa test cũ đã viết theo annotation.

---

## 4) Nhóm annotations integration cần biết (legacy/maintain)

## A. Isolation

- `@magentoDbIsolation enabled|disabled`
  - Cô lập thay đổi DB trong transaction, rollback sau test.
- `@magentoAppIsolation enabled|disabled`
  - Reinit app state để tránh nhiễu state giữa test.

## B. Fixtures

- `@magentoDataFixture`
  - Dùng script/method fixture kiểu cũ.
  - Nếu fixture có side-effect ngoài DB, cần rollback tương ứng.
- `@magentoConfigFixture`
  - Set config theo test method, tự revert sau test.

## C. Runtime context

- `@magentoAppArea adminhtml|frontend|global`
  - Chạy test trong area cụ thể.
- `@magentoCache ...`
  - Bật/tắt cache type theo test.
- `@magentoComponentsDir <dir>`
  - Register fixture components theo thư mục.
- `@depends methodName`
  - Truyền output test trước cho test sau.

Thứ tự apply annotations theo Adobe có ý nghĩa; đọc khi debug test bị hành vi lạ.

---

## 5) Nhóm PHP Attributes nên dùng cho test mới (khuyến nghị)

## A. Isolation

- `#[AppIsolation(true|false)]`
- `#[DbIsolation(true|false)]`

## B. Fixtures

- `#[DataFixture(FixtureClass::class, data: [...], as: 'alias', scope: 'storeX', count: 1)]`
- `#[DataFixtureBeforeTransaction(...)]` cho fixture cần apply trước transaction.

## C. Runtime/context

- `#[AppArea('frontend'|'adminhtml'|'graphql'|...)]`
- `#[Cache('all'|'config'|..., true|false)]`
- `#[ComponentsDir('path/to/components')]`
- `#[Config('path/to/config', value, 'default|store|group|site', scopeValue)]`
- `#[IndexerDimensionMode('indexer_code', 'dimension_mode')]`

Ghi nhớ:

- Attributes có thứ tự apply riêng (Adobe đã định nghĩa), giúp setup context nhất quán.
- Method-level attributes có thể override class-level tùy loại attribute.

---

## 6) Data fixtures - chuẩn mới nên theo

Theo Adobe:

- Legacy file fixtures là hướng cũ (deprecated cho test mới).
- Dùng parameterized fixtures với PHP Attributes để:
  - type-safe hơn,
  - dễ tái sử dụng,
  - giảm copy fixture file.

Best practices:

- Mỗi fixture làm một việc.
- Dùng alias để reference dữ liệu giữa fixtures.
- Chỉ override field cần cho scenario.
- Đảm bảo cleanup/revert để tránh test pollution.

Mẫu ngắn:

```php
#[DataFixture(ProductFixture::class, ['price' => 100], as: 'product')]
public function testSomething(): void
{
    $product = \Magento\TestFramework\Fixture\DataFixtureStorageManager::getStorage()->get('product');
    // assertions...
}
```

---

## 7) JavaScript unit testing (Jasmine) - khi nào dùng

- Dùng cho module JS Magento (RequireJS/Ui components) khi cần verify hành vi phía client.
- Chạy qua Grunt task `spec`.
- Scope chạy:
  - toàn theme: `grunt spec:backend` hoặc `grunt spec:luma`
  - 1 file test: `grunt spec:luma --file="/path/to/test.js"`

Khi task có thay đổi JS đáng kể:

- thêm ít nhất 1 test Jasmine cho logic mới hoặc nhánh bug đã fix.
- ghi rõ verify command trong báo cáo.

---

## 8) Checklist “Done” cho task có test

- [ ] Xác định đúng test level cần thêm (unit/integration/api/functional).
- [ ] Có verify command chạy được trên local.
- [ ] Test không phụ thuộc state rò rỉ từ test khác.
- [ ] Với fixtures mới, ưu tiên attributes-based fixture.
- [ ] Nếu dùng annotation legacy, khai báo isolation/config rõ ràng.
- [ ] Nếu có thay đổi JS logic quan trọng, đã cân nhắc Jasmine test.
- [ ] Nếu có thay đổi flow UI quan trọng, đã cân nhắc MFTF test/regression.

---

## 9) Prompt mẫu để giao AI viết test

```text
Đọc `.spec/config/constitution.md` và `.spec/config/references/ops/testing-guide.md`.
Viết test cho thay đổi này theo mức phù hợp (unit/integration/api).
Ưu tiên PHP Attributes cho integration test mới; chỉ dùng annotation legacy khi maintain test cũ.
Báo cáo:
1) file test đã thêm/sửa
2) vì sao chọn loại test đó
3) lệnh verify đã chạy và kết quả
4) các rủi ro test coverage còn thiếu
```

---

## Liên kết nội bộ

- [Unit Testing & ObjectManager Helper](./unit-testing.md)
- [MFTF Functional Testing](./mftf-functional-testing.md)
- [Constitution](../../constitution.md)
