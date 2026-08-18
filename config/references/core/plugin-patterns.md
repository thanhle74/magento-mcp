# Tham khảo: Plugin Patterns (Thực chiến)

Nguồn:
- https://developer.adobe.com/commerce/php/development/components/plugins/ — đã refactor theo constitution
- https://magento.stackexchange.com/questions/268110 — sequence & sortOrder
- https://magefan.com/blog/prioritizing-plugins-in-magento-2 — sortOrder execution flow

---

## 1. Around plugin — khi nào dùng, performance cost, callable pattern đúng

### Khi nào NÊN dùng around

| Use case | Lý do |
|----------|-------|
| Cần **ngăn** method gốc chạy có điều kiện | Chỉ around mới có thể skip `$proceed()` |
| Cần wrap toàn bộ method trong transaction | Cần kiểm soát cả trước lẫn sau, kể cả exception |
| Cần thay thế hoàn toàn logic method gốc | Không gọi `$proceed()` |

### Khi nào KHÔNG nên dùng around

| Tình huống | Dùng thay thế |
|-----------|--------------|
| Chỉ cần thêm logic trước method | `before` plugin |
| Chỉ cần sửa return value | `after` plugin |
| Chỉ cần log/audit | `after` plugin |
| Cần cả trước lẫn sau nhưng không skip | `before` + `after` kết hợp |

> **Performance cost:** Around plugin tăng stack depth đáng kể. Mỗi around plugin thêm 1 frame vào call stack. Magento core có ~30% overhead từ plugin system — around plugin là nguyên nhân chính.
> Nguồn: https://yegorshytikov.medium.com/magento-2-plug-ins-aod-architecture-are-harmful-dc23c4edb534

### Callable pattern đúng

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductSavePlugin
{
    /**
     * Pattern 1: Forward tất cả args bằng variadic (khuyến nghị khi không cần sửa args)
     */
    public function aroundSave(Product $subject, callable $proceed, ...$args): Product
    {
        // Logic trước
        $result = $proceed(...$args);
        // Logic sau
        return $result;
    }

    /**
     * Pattern 2: Khai báo rõ từng tham số (khi cần dùng/sửa args)
     * Phải match ĐÚNG type hint và default value của method gốc
     */
    public function aroundSetName(
        Product $subject,
        callable $proceed,
        string $name  // match với Product::setName(string $name)
    ): Product {
        $name = strtoupper($name);
        return $proceed($name);
    }

    /**
     * Pattern 3: Conditional skip — chỉ dùng around khi cần skip
     */
    public function aroundValidate(
        Product $subject,
        callable $proceed,
        ...$args
    ): bool {
        if ($this->shouldSkipValidation($subject)) {
            return true; // Skip method gốc và tất cả plugin phía sau
        }
        return $proceed(...$args);
    }
}
```

> **Lưu ý nullable parameter:** Nếu method gốc có `SomeType $obj = null`, plugin phải khai báo `SomeType $obj = null` — thiếu `= null` sẽ gây fatal error khi gọi với `null`.

---

## 2. Interceptor chain — thứ tự thực thi khi nhiều plugin cùng target 1 method

### Quy tắc sortOrder

- Số nhỏ hơn → chạy trước (before/around first half)
- Số lớn hơn → chạy sau (after/around second half)
- Cùng sortOrder → thứ tự theo `<sequence>` trong `module.xml` → thứ tự trong `app/etc/config.php`

### Execution flow chi tiết

Giả sử 3 plugin A (sortOrder=10), B (sortOrder=20), C (sortOrder=30):

**Scenario 1: Chỉ có before + after**
```
A::before → B::before → C::before
  → [Method gốc]
A::after → B::after → C::after
```

**Scenario 2: B có around (gọi $proceed)**
```
A::before
B::before
B::around [first half]
  → C::before
  → [Method gốc]
  → C::after
B::around [second half]
A::after
B::after
```

> **Quan trọng:** Khi B::around gọi `$proceed()`, nó tạo ra một "sub-chain" mới bao gồm tất cả plugin có sortOrder cao hơn B. After methods của sub-chain chạy trước khi B::around kết thúc.

**Scenario 3: B có around KHÔNG gọi $proceed**
```
A::before
B::before
B::around [không gọi $proceed → C và method gốc bị skip]
A::after
B::after
```

**Scenario 4: A và C có around, B không có**
```
A::around [first half]
  → B::before
  → C::around [first half]
    → [Method gốc]
  → C::around [second half]
  → B::after
A::around [second half]
A::after
C::after
```

### Debug interceptor chain

```bash
# Xem tất cả plugin đang active cho 1 class
bin/magento dev:di:info "Magento\Quote\Model\Quote\Item\ToOrderItem"

# Output hiển thị: Plugin name, Method, Type (before/after/around)
```

### Resolve sortOrder conflict

```xml
<!-- Module A: sortOrder=10 -->
<plugin name="vendor_a_plugin" type="VendorA\Module\Plugin\MyPlugin" sortOrder="10"/>

<!-- Module B muốn chạy TRƯỚC A: dùng sortOrder nhỏ hơn -->
<plugin name="vendor_b_plugin" type="VendorB\Module\Plugin\MyPlugin" sortOrder="5"/>

<!-- Disable plugin của module khác -->
<plugin name="vendor_a_plugin" disabled="true"/>
```

---

## 3. Before plugin — modify arguments, add validation

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Framework\Exception\LocalizedException;

class ProductRepositoryBeforePlugin
{
    /**
     * Validate trước khi save — throw exception để ngăn save
     */
    public function beforeSave(
        ProductRepositoryInterface $subject,
        ProductInterface $product,
        bool $saveOptions = false
    ): array {
        if (strlen((string)$product->getName()) > 255) {
            throw new LocalizedException(__('Product name cannot exceed 255 characters.'));
        }
        // Trả về array đủ tham số theo đúng thứ tự
        return [$product, $saveOptions];
    }
}
```

> **Quy tắc return:** Trả về `array` với đủ tham số theo đúng thứ tự. Trả về `null` nếu không thay đổi gì. **KHÔNG** `unset()` phần tử trong array — gây lỗi runtime.

---

## 4. After plugin — modify return value, add data

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;

class ProductRepositoryAfterPlugin
{
    /**
     * Transform return value sau khi getById
     * Chỉ khai báo tham số gốc đến tham số cần dùng
     */
    public function afterGetById(
        ProductRepositoryInterface $subject,
        ProductInterface $result,
        int $productId  // tham số gốc — khai báo vì cần dùng
        // $editMode, $storeId, $forceReload — không khai báo vì không cần
    ): ProductInterface {
        // Thêm custom data vào product
        $result->setCustomAttribute('processed_by', 'plugin');
        return $result;
    }
}
```

---

## 5. Plugin on Repository — common patterns

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Catalog\Api\Data\ProductSearchResultsInterface;

class ProductRepositoryPlugin
{
    /**
     * Add custom filter trước khi getList
     */
    public function beforeGetList(
        ProductRepositoryInterface $subject,
        SearchCriteriaInterface $searchCriteria
    ): array {
        // Thêm filter tự động (ví dụ: chỉ lấy product active)
        $filterBuilder = $this->filterBuilder;
        $filter = $filterBuilder
            ->setField('status')
            ->setValue(1)
            ->setConditionType('eq')
            ->create();
        // Thêm vào searchCriteria...
        return [$searchCriteria];
    }

    /**
     * Transform kết quả getList
     */
    public function afterGetList(
        ProductRepositoryInterface $subject,
        ProductSearchResultsInterface $result
    ): ProductSearchResultsInterface {
        foreach ($result->getItems() as $product) {
            // Xử lý từng item
        }
        return $result;
    }
}
```

---

## 6. Plugin on Controller — redirect, modify response

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Framework\App\ActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\Controller\ResultInterface;

class ControllerPlugin
{
    public function __construct(
        private readonly ResultFactory $resultFactory,
        private readonly RequestInterface $request
    ) {}

    /**
     * Redirect trước khi controller execute
     * Dùng around để có thể skip execute gốc
     */
    public function aroundExecute(
        ActionInterface $subject,
        callable $proceed
    ): ResultInterface {
        if ($this->shouldRedirect()) {
            $redirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
            $redirect->setPath('*/*/index');
            return $redirect;
        }
        return $proceed();
    }

    private function shouldRedirect(): bool
    {
        return false; // logic thực tế
    }
}
```

---

## 7. Plugin on Block — modify template, add data

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Magento\Catalog\Block\Product\View;

class ProductViewBlockPlugin
{
    /**
     * Thay đổi template của block
     */
    public function afterGetTemplate(View $subject, string $result): string
    {
        if ($subject->getProduct()?->getTypeId() === 'custom_type') {
            return 'Vendor_Module::product/view/custom.phtml';
        }
        return $result;
    }

    /**
     * Thêm data vào block
     */
    public function afterToHtml(View $subject, string $result): string
    {
        // Inject thêm HTML sau block
        return $result . '<div class="custom-badge">Custom</div>';
    }
}
```

---

## 8. Plugin disabled — area-specific disable

```xml
<!-- etc/di.xml — global: plugin active -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_plugin"
            type="Vendor\Module\Plugin\ProductPlugin"
            sortOrder="10" />
</type>

<!-- etc/adminhtml/di.xml — disable trong admin area -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_plugin" disabled="true"/>
</type>
```

> **Lưu ý:** Khi disable, dùng đúng format path (có hoặc không có leading slash phải nhất quán với khai báo gốc).

---

## 9. Plugin on interface vs class — best practice

| Target | Ưu điểm | Nhược điểm |
|--------|---------|-----------|
| **Interface** (khuyến nghị) | Áp dụng cho mọi implementation | Cần interface tồn tại |
| **Class cụ thể** | Chính xác hơn | Không áp dụng cho subclass khác |

```xml
<!-- Khuyến nghị: plugin trên interface -->
<type name="Magento\Catalog\Api\ProductRepositoryInterface">
    <plugin name="vendor_module_product_repo_plugin"
            type="Vendor\Module\Plugin\ProductRepositoryPlugin" />
</type>

<!-- Chỉ dùng khi cần target class cụ thể -->
<type name="Magento\Catalog\Model\ProductRepository">
    <plugin name="vendor_module_product_repo_impl_plugin"
            type="Vendor\Module\Plugin\ProductRepositoryImplPlugin" />
</type>
```

---

## 10. Debug plugin: log all method calls

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin;

use Psr\Log\LoggerInterface;

/**
 * Debug plugin — CHỈ dùng trong development, KHÔNG deploy lên production
 */
class DebugPlugin
{
    public function __construct(
        private readonly LoggerInterface $logger
    ) {}

    public function aroundExecute(
        object $subject,
        callable $proceed,
        ...$args
    ): mixed {
        $class = get_class($subject);
        $this->logger->debug("Plugin: {$class}::execute() called", [
            'args_count' => count($args),
        ]);

        $start = microtime(true);
        $result = $proceed(...$args);
        $elapsed = round((microtime(true) - $start) * 1000, 2);

        $this->logger->debug("Plugin: {$class}::execute() completed in {$elapsed}ms");

        return $result;
    }
}
```

---

## Liên kết

- Plugin cơ bản: xem [plugins.md](./plugins.md)
- DI & Generated code: xem [di-codegen.md](./di-codegen.md)
- Observer patterns: xem [events-observers.md](./events-observers.md)
