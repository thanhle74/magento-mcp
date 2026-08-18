# Tham khảo: Catalog Product Types & Pricing

Nguồn: https://developer.adobe.com/commerce/php/development/components/catalog/

---

## 1. Product Types

| Type | Class | Đặc điểm | Stock |
|------|-------|----------|-------|
| `simple` | `Magento\Catalog\Model\Product\Type\Simple` | Sản phẩm đơn, không variant | Có stock trực tiếp |
| `configurable` | `Magento\ConfigurableProduct\Model\Product\Type\Configurable` | Có variant (size, color) | **Không có stock** — stock từ child |
| `virtual` | `Magento\Catalog\Model\Product\Type\Virtual` | Không vận chuyển (dịch vụ, download) | Có stock |
| `downloadable` | `Magento\Downloadable\Model\Product\Type` | File download | Có stock |
| `bundle` | `Magento\Bundle\Model\Product\Type` | Gói nhiều item tùy chọn | Stock từ child |
| `grouped` | `Magento\GroupedProduct\Model\Product\Type\Grouped` | Nhóm simple products | Stock từ từng child |

### Configurable Product — lưu ý quan trọng

- Parent configurable **không có stock** — chỉ là container
- Stock thực tế nằm ở **child simple products**
- Khi check salable qty: phải query child products
- `catalog_product_entity` lưu cả parent và child
- Liên kết parent-child: `catalog_product_super_link` table

```php
// Lấy child products của configurable
$typeInstance = $configurableProduct->getTypeInstance();
$childProducts = $typeInstance->getUsedProducts($configurableProduct);

foreach ($childProducts as $child) {
    // $child là simple product với stock thực tế
    $salableQty = $this->getProductSalableQty->execute($child->getSku(), $stockId);
}
```

---

## 2. Price Hierarchy

Magento tính `final_price` theo quy tắc: **lấy giá thấp nhất** trong các loại giá áp dụng.

```
final_price = min(
    regular_price,
    special_price (nếu trong thời hạn),
    tier_price (theo qty),
    catalog_price_rule (nếu có rule áp dụng)
)
```

### Ví dụ

| Loại giá | Giá |
|----------|-----|
| regular_price | 100 |
| special_price | 80 |
| tier_price (qty ≥ 5) | 70 |
| catalog_rule (giảm 25%) | 75 |

→ `final_price` = **70** (tier_price thấp nhất)

### Các loại giá

| Loại | Lưu ở đâu | Mô tả |
|------|-----------|-------|
| `regular_price` | `catalog_product_entity_decimal` (attribute `price`) | Giá gốc |
| `special_price` | `catalog_product_entity_decimal` (attribute `special_price`) | Giá khuyến mãi trực tiếp, có date range |
| `tier_price` | `catalog_product_entity_tier_price` | Giá theo số lượng mua, có thể theo customer group |
| `catalog_price_rule` | Tính toán qua indexer `catalog_product_price` | Rule giảm giá catalog |
| `final_price` | Index table `catalog_product_index_price` | Giá cuối đã tính toán |

---

## 3. Lấy giá trong code

### Cách đúng — dùng Price Model

```php
// Lấy final_price đã tính toán (từ index)
$finalPrice = $product->getFinalPrice();

// Lấy regular_price
$regularPrice = $product->getPrice();

// Lấy special_price
$specialPrice = $product->getSpecialPrice();

// Lấy tier prices
$tierPrices = $product->getTierPrices();
```

### Lấy giá qua Price Interface (khuyến nghị cho custom logic)

```php
use Magento\Catalog\Pricing\Price\FinalPrice;
use Magento\Catalog\Pricing\Price\RegularPrice;
use Magento\Catalog\Pricing\Price\TierPrice;

// Final price
$finalPrice = $product->getPriceInfo()->getPrice(FinalPrice::PRICE_CODE)->getValue();

// Regular price
$regularPrice = $product->getPriceInfo()->getPrice(RegularPrice::PRICE_CODE)->getValue();

// Tier price cho qty cụ thể
$tierPrice = $product->getPriceInfo()->getPrice(TierPrice::PRICE_CODE)->getValue(5); // qty = 5
```

---

## 4. Tier Price

Tier price cho phép giảm giá theo số lượng mua, có thể theo customer group.

```php
// Cấu trúc tier price
[
    'website_id' => 0,           // 0 = all websites
    'cust_group' => 32000,       // 32000 = ALL GROUPS
    'price_qty' => 5,            // Mua từ 5 cái
    'price' => 70.00,            // Giá tier
    'percentage_value' => null,  // Hoặc giảm theo %
]
```

### Set tier price qua Data Patch

```php
$product->setTierPrices([
    [
        'website_id' => 0,
        'cust_group' => \Magento\Customer\Model\Group::CUST_GROUP_ALL,
        'price_qty' => 5,
        'price' => 70.00,
    ],
    [
        'website_id' => 0,
        'cust_group' => \Magento\Customer\Model\Group::CUST_GROUP_ALL,
        'price_qty' => 10,
        'price' => 60.00,
    ],
]);
$this->productRepository->save($product);
```

---

## 5. EAV và Flat Catalog

### EAV (Entity-Attribute-Value)

Mặc định, product attributes lưu theo EAV:
- `catalog_product_entity` — entity chính
- `catalog_product_entity_varchar` — string attributes
- `catalog_product_entity_int` — integer attributes
- `catalog_product_entity_decimal` — decimal attributes (price)
- `catalog_product_entity_text` — text attributes (description)
- `catalog_product_entity_datetime` — datetime attributes

### Flat Catalog

Khi bật Flat Catalog (`Use Flat Catalog Product = Yes`), Magento tạo bảng flat `catalog_product_flat_<store_id>` chứa tất cả attributes thường dùng — giảm số JOIN khi query.

**Lưu ý:** Flat catalog cần reindex sau mỗi thay đổi attribute. Với Elasticsearch/OpenSearch, flat catalog ít cần thiết hơn.

---

## 6. Attribute Set

Attribute Set nhóm các attributes lại và gán cho product type.

```php
// Lấy attribute set của product
$attributeSetId = $product->getAttributeSetId();

// Lấy tên attribute set
$attributeSet = $this->attributeSetRepository->get($attributeSetId);
$attributeSetName = $attributeSet->getAttributeSetName();

// Lấy tất cả attributes trong attribute set
$attributes = $this->productAttributeRepository->getList(
    $this->searchCriteriaBuilder
        ->addFilter('attribute_set_id', $attributeSetId)
        ->create()
)->getItems();
```

---

## 7. Custom Product Attribute (Data Patch)

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Setup\CategorySetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddCustomProductAttribute implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup,
        private readonly CategorySetupFactory $categorySetupFactory
    ) {
    }

    public function apply(): void
    {
        $categorySetup = $this->categorySetupFactory->create(['setup' => $this->moduleDataSetup]);

        $categorySetup->addAttribute(
            Product::ENTITY,
            'vendor_custom_field',
            [
                'type' => 'varchar',
                'label' => 'Custom Field',
                'input' => 'text',
                'required' => false,
                'visible' => true,
                'user_defined' => true,
                'searchable' => false,
                'filterable' => false,
                'comparable' => false,
                'visible_on_front' => false,
                'used_in_product_listing' => false,
                'unique' => false,
                'apply_to' => 'simple,configurable,virtual',
                'group' => 'General',
                'sort_order' => 100,
                'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
            ]
        );
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

---

## Liên kết

- Inventory MSI: xem [../inventory/inventory-msi.md](../inventory/inventory-msi.md)
- Catalog Price Rules: xem [catalog-price-rules.md](./catalog-price-rules.md)
- Data Patch: xem [../core/data-schema-patch.md](../core/data-schema-patch.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
