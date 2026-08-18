# Tham khảo: View Models (Frontend Logic)

Nguồn: https://developer.adobe.com/commerce/php/development/components/view-models

---

## 1. Nguyên tắc sử dụng

**KHÔNG** kế thừa Block core (`Magento\Catalog\Block\Product\View`, v.v.) chỉ để thêm một hàm helper. Thay vào đó, hãy sử dụng **View Model**.

## 2. Cách triển khai

### Bước 1: Tạo class View Model
Class phải thực thi `Magento\Framework\View\Element\Block\ArgumentInterface`.

```php
namespace Vendor\Module\ViewModel;

use Magento\Framework\View\Element\Block\ArgumentInterface;

class CustomData implements ArgumentInterface
{
    public function getGreeting(): string
    {
        return "Chào mừng bạn đến với Magento 2.4.8!";
    }
}
```

### Bước 2: Nhúng vào Block qua Layout XML
Sử dụng thẻ `<argument>` với `xsi:type="object"`. Tên argument nên là `view_model`.

```xml
<referenceBlock name="product.info.main">
    <arguments>
        <argument name="view_model" xsi:type="object">Vendor\Module\ViewModel\CustomData</argument>
    </arguments>
</referenceBlock>
```

### Bước 3: Sử dụng trong Template (.phtml)

```php
<?php
/** @var \Vendor\Module\ViewModel\CustomData $viewModel */
$viewModel = $block->getViewModel();
?>

<div class="custom-greeting">
    <?= $escaper->escapeHtml($viewModel->getGreeting()) ?>
</div>
```

---

## 3. Ưu điểm vượt trội

- **Tách biệt logic:** Template chỉ lo hiển thị, View Model lo cung cấp dữ liệu, Block lo về cấu trúc layout.
- **Dependency Injection:** Bạn có thể inject bất kỳ Service/Repository nào vào View Model một cách dễ dàng.
- **Hiệu suất:** Nhẹ hơn rất nhiều so với việc khởi tạo một đối tượng Block đầy đủ.

---

## 4. Shared Instance và Multiple ViewModels

ViewModel là **shared instance** (singleton) theo mặc định trong DI. Điều này có nghĩa:
- Cùng 1 ViewModel class được inject vào nhiều blocks → cùng 1 instance
- Không nên lưu state per-request trong ViewModel property

### Dùng nhiều ViewModel trong 1 block

```xml
<referenceBlock name="product.info.main">
    <arguments>
        <!-- ViewModel chính -->
        <argument name="view_model" xsi:type="object">Vendor\Module\ViewModel\ProductData</argument>
        <!-- ViewModel phụ -->
        <argument name="price_view_model" xsi:type="object">Vendor\Module\ViewModel\PriceData</argument>
    </arguments>
</referenceBlock>
```

```php
// Trong template
$viewModel = $block->getData('view_model');
$priceViewModel = $block->getData('price_view_model');
```

### Lấy ViewModel trong template

```php
// Cách 1: getData() — explicit, rõ ràng
$viewModel = $block->getData('view_model');

// Cách 2: magic getter — camelCase của key
$viewModel = $block->getViewModel();  // getData('view_model')

// Cách 3: nếu key có underscore
$priceVm = $block->getData('price_view_model');
// KHÔNG dùng $block->getPriceViewModel() — magic getter không handle underscore đúng
```

---

## Liên kết

- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Architectural Patterns: xem [architectural-patterns.md](./architectural-patterns.md)
- Layout XML: xem [layout-xml.md](./layout-xml.md)
