# Pager/Toolbar trong Magento 2

Nguồn:
- [Magento 2 Toolbar Block](https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Catalog/Block/Product/ProductList/Toolbar.php) — github.com/magento
- [Custom Attribute Filter in Product Collection](https://webkul.com/blog/adding-toolbar-in-custom-product-list-page/) — webkul.com — đã refactor theo constitution
- [Magento StackExchange: custom sort by](https://magento.stackexchange.com/questions/96095/magento-2-how-to-add-custom-sort-by-option) — stackexchange.com

---

## 1. Tổng quan Toolbar

`Magento\Catalog\Block\Product\ProductList\Toolbar` quản lý:
- Sort by (sắp xếp theo attribute)
- Items per page (số sản phẩm/trang)
- Pager (phân trang)
- View mode (grid/list)

---

## 2. Thêm Custom Sort Option

### Cách 1: Plugin trên Toolbar Block

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Block\Product\ProductList;

use Magento\Catalog\Block\Product\ProductList\Toolbar;

class AddCustomSortOption
{
    public function afterGetAvailableOrders(
        Toolbar $subject,
        array $result
    ): array {
        // Thêm sort option mới
        $result['created_at'] = __('Newest First');
        $result['bestseller'] = __('Best Seller');

        return $result;
    }
}
```

```xml
<!-- etc/di.xml -->
<type name="Magento\Catalog\Block\Product\ProductList\Toolbar">
    <plugin name="vendor_module_add_sort_options"
            type="Vendor\Module\Plugin\Block\Product\ProductList\AddCustomSortOption"/>
</type>
```

### Cách 2: Config trong system.xml

Thêm attribute vào `catalog_product` EAV và set `used_for_sort_by = 1`:

```php
// Data Patch
$eavSetup->addAttribute(\Magento\Catalog\Model\Product::ENTITY, 'custom_sort_field', [
    'type'             => 'int',
    'label'            => 'Custom Sort Field',
    'input'            => 'text',
    'used_for_sort_by' => 1,
    'visible'          => false,
    'required'         => false,
    'global'           => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
]);
```

---

## 3. Custom Items Per Page

```php
// Plugin trên Toolbar
public function afterGetAvailableLimit(
    Toolbar $subject,
    array $result
): array {
    // Override available limits
    return [9 => 9, 18 => 18, 36 => 36, 72 => 72];
}

public function afterGetDefaultPerPageValue(
    Toolbar $subject,
    int $result
): int {
    return 18; // Default 18 items per page
}
```

---

## 4. Toolbar trong Custom Product List Page

Để dùng Toolbar trong custom page (không phải category page):

```xml
<!-- view/frontend/layout/vendor_module_index_index.xml -->
<block class="Vendor\Module\Block\CustomProductList"
       name="custom.products.list"
       template="Magento_Catalog::product/list.phtml">

    <!-- Toolbar block -->
    <block class="Magento\Catalog\Block\Product\ProductList\Toolbar"
           name="product_list_toolbar"
           template="Magento_Catalog::product/list/toolbar.phtml">
        <!-- Pager block -->
        <block class="Magento\Theme\Block\Html\Pager"
               name="product_list_toolbar_pager"/>
    </block>

    <!-- Kết nối toolbar với product list -->
    <action method="setToolbarBlockName">
        <argument name="name" xsi:type="string">product_list_toolbar</argument>
    </action>
</block>
```

---

## 5. Custom Product List Block với Toolbar

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Block;

use Magento\Catalog\Block\Product\ListProduct;
use Magento\Catalog\Model\ResourceModel\Product\Collection;

class CustomProductList extends ListProduct
{
    protected function _getProductCollection(): Collection
    {
        if ($this->_productCollection === null) {
            $collection = $this->_productCollectionFactory->create();
            $collection
                ->addAttributeToSelect('*')
                ->addFieldToFilter('status', 1)
                ->addFieldToFilter('visibility', [
                    'in' => [
                        \Magento\Catalog\Model\Product\Visibility::VISIBILITY_IN_CATALOG,
                        \Magento\Catalog\Model\Product\Visibility::VISIBILITY_BOTH,
                    ]
                ]);

            $this->_productCollection = $collection;
        }

        return $this->_productCollection;
    }
}
```

---

## 6. Plugin để thêm Custom Filter vào Product Collection

Khi dùng custom product list, event `catalog_block_product_list_collection` bị override bởi Review observer. Cần plugin:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Observer;

use Magento\Framework\App\RequestInterface;
use Magento\Framework\Event\Observer;
use Magento\Review\Observer\CatalogBlockProductCollectionBeforeToHtmlObserver;

class AddCustomFilterToCollection
{
    public function __construct(
        private readonly RequestInterface $request
    ) {}

    public function aroundExecute(
        CatalogBlockProductCollectionBeforeToHtmlObserver $subject,
        callable $proceed,
        Observer $observer
    ): void {
        $collection = $observer->getEvent()->getCollection();

        // Chỉ apply filter cho action cụ thể
        if ($this->request->getFullActionName() === 'vendor_module_index_index') {
            $collection->addAttributeToFilter('is_featured', 1);
        }

        $proceed($observer);
    }
}
```

---

## 7. Pager Block độc lập

Dùng Pager block cho custom collection (không phải product list):

```xml
<!-- Layout XML -->
<block class="Magento\Theme\Block\Html\Pager"
       name="custom.pager"
       template="Magento_Theme::html/pager.phtml">
    <arguments>
        <argument name="limit" xsi:type="number">20</argument>
    </arguments>
</block>
```

```php
// Trong Block PHP
use Magento\Theme\Block\Html\Pager;

public function getPagerHtml(): string
{
    $pagerBlock = $this->getLayout()->getBlock('custom.pager');
    if ($pagerBlock instanceof Pager) {
        $pagerBlock->setAvailableLimit([10 => 10, 20 => 20, 50 => 50]);
        $pagerBlock->setCollection($this->getCollection());
        return $pagerBlock->toHtml();
    }
    return '';
}
```

---

## 8. Lưu ý

- Toolbar lưu state (sort, limit, page) vào session — cần clear khi test
- `setToolbarBlockName()` phải được gọi để kết nối toolbar với product list block
- Custom sort option cần attribute được đánh index để performance tốt
- Pager block dùng `$_GET` params: `p` (page), `limit` (per page)

---

## Liên kết

- Layout XML: xem [layout-xml.md](./layout-xml.md)
- Catalog Product Types: xem [../business/catalog-product-types.md](../business/catalog-product-types.md)
- Plugin Patterns: xem [../core/plugin-patterns.md](../core/plugin-patterns.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
