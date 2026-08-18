# Blueprint: Custom Widget

> Nguồn: https://developer.adobe.com/commerce/php/development/components/widgets/ — đã refactor theo constitution
> Mục đích: Tạo widget tái sử dụng với parameters cấu hình từ Admin

---

## Use case

Widget hiển thị danh sách sản phẩm nổi bật với heading, số lượng, và link "View More" — cấu hình từ Admin CMS.

---

## Cấu trúc module

```
app/code/Vendor/Module/
├── etc/
│   ├── module.xml          # sequence: Magento_Widget, Magento_Cms
│   └── widget.xml          # khai báo widget
├── Block/
│   └── Widget/
│       └── FeaturedProducts.php
└── view/
    └── frontend/
        └── templates/
            └── widget/
                └── featured_products.phtml
```

---

## `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module">
        <sequence>
            <module name="Magento_Widget"/>
            <module name="Magento_Cms"/>
            <module name="Magento_Catalog"/>
        </sequence>
    </module>
</config>
```

---

## `etc/widget.xml`

```xml
<?xml version="1.0"?>
<widgets xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Widget:etc/widget.xsd">
    <widget class="Vendor\Module\Block\Widget\FeaturedProducts"
            id="vendor_featured_products">
        <label>Featured Products Widget</label>
        <description>Displays a configurable list of featured products</description>
        <parameters>
            <!-- Text field -->
            <parameter name="heading_text" xsi:type="text" required="false" visible="true" sort_order="10">
                <label>Heading Text</label>
                <value>Featured Products</value>
            </parameter>

            <!-- Select field -->
            <parameter name="display_mode" xsi:type="select" required="false" visible="true" sort_order="20">
                <label>Display Mode</label>
                <options>
                    <option name="grid" value="grid" selected="true">
                        <label>Grid</label>
                    </option>
                    <option name="list" value="list">
                        <label>List</label>
                    </option>
                </options>
            </parameter>

            <!-- Number field -->
            <parameter name="products_count" xsi:type="text" required="false" visible="true" sort_order="30">
                <label>Number of Products</label>
                <value>6</value>
                <description>Enter a number between 1 and 20</description>
            </parameter>

            <!-- Category chooser -->
            <parameter name="category_id" xsi:type="text" required="false" visible="true" sort_order="40">
                <label>Category ID</label>
                <description>Leave empty to use all categories</description>
            </parameter>

            <!-- URL field -->
            <parameter name="view_more_url" xsi:type="text" required="false" visible="true" sort_order="50">
                <label>View More URL</label>
                <description>URL for the "View More" button (optional)</description>
            </parameter>

            <!-- Checkbox-style select -->
            <parameter name="show_price" xsi:type="select" required="false" visible="true" sort_order="60">
                <label>Show Price</label>
                <options>
                    <option name="yes" value="1" selected="true">
                        <label>Yes</label>
                    </option>
                    <option name="no" value="0">
                        <label>No</label>
                    </option>
                </options>
            </parameter>
        </parameters>
    </widget>
</widgets>
```

---

## `Block/Widget/FeaturedProducts.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Block\Widget;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;

class FeaturedProducts extends Template implements BlockInterface
{
    protected $_template = 'Vendor_Module::widget/featured_products.phtml';

    public function __construct(
        Template\Context $context,
        private readonly CollectionFactory $productCollectionFactory,
        private readonly CategoryRepositoryInterface $categoryRepository,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getHeadingText(): string
    {
        return (string) ($this->getData('heading_text') ?: 'Featured Products');
    }

    public function getDisplayMode(): string
    {
        return (string) ($this->getData('display_mode') ?: 'grid');
    }

    public function getProductsCount(): int
    {
        return max(1, min(20, (int) ($this->getData('products_count') ?: 6)));
    }

    public function getViewMoreUrl(): string
    {
        return (string) $this->getData('view_more_url');
    }

    public function isShowPrice(): bool
    {
        return (bool) ($this->getData('show_price') ?? true);
    }

    /**
     * Lấy danh sách products
     */
    public function getProducts(): array
    {
        $collection = $this->productCollectionFactory->create();
        $collection->addAttributeToSelect(['name', 'price', 'thumbnail', 'url_key', 'status']);
        $collection->addAttributeToFilter('status', \Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED);
        $collection->addAttributeToFilter('visibility', [
            'in' => [
                \Magento\Catalog\Model\Product\Visibility::VISIBILITY_IN_CATALOG,
                \Magento\Catalog\Model\Product\Visibility::VISIBILITY_BOTH,
            ]
        ]);

        $categoryId = (int) $this->getData('category_id');
        if ($categoryId > 0) {
            $collection->addCategoriesFilter(['in' => [$categoryId]]);
        }

        $collection->setPageSize($this->getProductsCount());
        $collection->setCurPage(1);

        return $collection->getItems();
    }

    /**
     * Cache key unique theo parameters
     */
    public function getCacheKeyInfo(): array
    {
        return [
            'VENDOR_FEATURED_PRODUCTS_WIDGET',
            $this->_storeManager->getStore()->getId(),
            $this->getHeadingText(),
            $this->getDisplayMode(),
            $this->getProductsCount(),
            (string) $this->getData('category_id'),
        ];
    }
}
```

---

## `view/frontend/templates/widget/featured_products.phtml`

```php
<?php
/** @var \Vendor\Module\Block\Widget\FeaturedProducts $block */
/** @var \Magento\Framework\Escaper $escaper */
$products = $block->getProducts();
if (empty($products)) {
    return;
}
?>
<div class="vendor-featured-products vendor-featured-products--<?= $escaper->escapeHtmlAttr($block->getDisplayMode()) ?>">
    <?php if ($block->getHeadingText()): ?>
        <h2 class="vendor-featured-products__heading">
            <?= $escaper->escapeHtml($block->getHeadingText()) ?>
        </h2>
    <?php endif; ?>

    <div class="vendor-featured-products__grid">
        <?php foreach ($products as $product): ?>
            <div class="vendor-featured-products__item">
                <a href="<?= $escaper->escapeUrl($product->getProductUrl()) ?>"
                   class="vendor-featured-products__link">
                    <img src="<?= $escaper->escapeUrl($block->getUrl('catalog/product/image', ['image' => $product->getThumbnail()])) ?>"
                         alt="<?= $escaper->escapeHtmlAttr($product->getName()) ?>"
                         class="vendor-featured-products__image"
                         loading="lazy" />
                    <span class="vendor-featured-products__name">
                        <?= $escaper->escapeHtml($product->getName()) ?>
                    </span>
                </a>

                <?php if ($block->isShowPrice()): ?>
                    <div class="vendor-featured-products__price">
                        <?= /* @noEscape */ $block->getLayout()
                            ->createBlock(\Magento\Catalog\Block\Product\Price::class)
                            ->setProduct($product)
                            ->toHtml() ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>

    <?php if ($block->getViewMoreUrl()): ?>
        <div class="vendor-featured-products__footer">
            <a href="<?= $escaper->escapeUrl($block->getViewMoreUrl()) ?>"
               class="vendor-featured-products__view-more action primary">
                <?= $escaper->escapeHtml(__('View More')) ?>
            </a>
        </div>
    <?php endif; ?>
</div>
```

---

## Thêm widget vào CMS page qua Layout XML

```xml
<!-- view/frontend/layout/cms_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\Widget\FeaturedProducts"
                   name="vendor.featured.products"
                   template="Vendor_Module::widget/featured_products.phtml">
                <arguments>
                    <argument name="heading_text" xsi:type="string">Our Best Sellers</argument>
                    <argument name="display_mode" xsi:type="string">grid</argument>
                    <argument name="products_count" xsi:type="number">8</argument>
                    <argument name="show_price" xsi:type="number">1</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

---

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

# Kiểm tra widget đã đăng ký
# Admin > Content > Widgets > Add Widget
# "Widget Type" dropdown phải có "Featured Products Widget"

# Tạo widget instance:
# 1. Chọn type "Featured Products Widget"
# 2. Điền parameters
# 3. Assign vào page/block
# 4. Save và kiểm tra frontend
```

---

## Liên kết

- Widget Reference: [config/references/frontend/widget.md](../../config/references/frontend/widget.md)
- Layout XML: [config/references/frontend/layout-xml.md](../../config/references/frontend/layout-xml.md)
- ViewModel: [config/references/frontend/frontend-view-models.md](../../config/references/frontend/frontend-view-models.md)
