# Tham khảo: Custom Product Type

Nguồn:
- https://www.classyllama.com/blog/custom-product-types-magento-2
- https://mage2gen.com/snippets/producttype/
- https://developer.adobe.com/commerce/php/development/components/catalog-rules/

---

## 0. Tổng quan

Custom product type cho phép tạo loại sản phẩm mới với behavior và attributes riêng, không ảnh hưởng đến các product type core.

**Khi nào dùng:**
- Sản phẩm có logic đặc thù không fit vào simple/configurable/bundle
- Cần custom price calculation riêng
- Cần custom add-to-cart behavior
- Cần custom stock handling

**Các product type core có thể extend:**

| Class | Type |
|---|---|
| `Magento\Catalog\Model\Product\Type\Simple` | Simple |
| `Magento\Catalog\Model\Product\Type\Virtual` | Virtual |
| `Magento\ConfigurableProduct\Model\Product\Type\Configurable` | Configurable |
| `Magento\GroupedProduct\Model\Product\Type\Grouped` | Grouped |
| `Magento\Downloadable\Model\Product\Type` | Downloadable |
| `Magento\Bundle\Model\Product\Type` | Bundle |

---

## 1. Cấu trúc module

```
Vendor/Module/
├── etc/
│   ├── module.xml          # sequence: Magento_Catalog
│   └── product_types.xml   # khai báo product type
├── Model/
│   └── Product/
│       ├── Type.php         # Product Type Model
│       └── Price.php        # Price Model (optional)
└── Setup/
    └── Patch/
        └── Data/
            └── AddProductTypeAttributes.php  # gán attributes
```

---

## 2. `etc/product_types.xml` — khai báo product type

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Catalog:etc/product_types.xsd">
    <type name="vendor_custom"
          label="Custom Product"
          modelInstance="Vendor\Module\Model\Product\Type"
          indexPriority="10"
          sortOrder="100"
          isQty="true">
        <priceModel instance="Vendor\Module\Model\Product\Price" />
        <stockIndexerModel instance="Magento\CatalogInventory\Model\Indexer\Stock\DefaultStockIndexer" />
        <customAttributes>
            <attribute name="is_real_product" value="true" />
        </customAttributes>
    </type>

    <!-- Cho phép type này là child của composite products (configurable/grouped/bundle) -->
    <composableTypes>
        <type name="vendor_custom" />
    </composableTypes>
</config>
```

**Attributes của `<type>`:**

| Attribute | Mô tả |
|---|---|
| `name` | Code của product type (lưu vào DB) |
| `label` | Tên hiển thị trong Admin |
| `modelInstance` | FQCN của Type Model class |
| `indexPriority` | Thứ tự index |
| `isQty` | Có quản lý qty không |
| `sortOrder` | Thứ tự hiển thị trong dropdown |

---

## 3. Product Type Model

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Product;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Type\AbstractType;

class Type extends AbstractType
{
    /**
     * Product type code — dùng constant để reference trong code
     */
    public const TYPE_ID = 'vendor_custom';

    /**
     * Bắt buộc implement — dọn dẹp data khi product đổi type
     */
    public function deleteTypeSpecificData(Product $product): void
    {
        // Xóa data đặc thù của type này nếu có
        // Ví dụ: xóa records trong bảng riêng
    }

    /**
     * Override để custom logic kiểm tra saleability
     */
    public function isSalable(Product $product): bool
    {
        // Custom logic — ví dụ: check thêm điều kiện riêng
        return parent::isSalable($product);
    }

    /**
     * Hook khi product được add vào cart
     * Override để custom add-to-cart behavior
     */
    protected function _prepareProduct(\Magento\Framework\DataObject $buyRequest, Product $product, string $processMode): array
    {
        $result = parent::_prepareProduct($buyRequest, $product, $processMode);

        if (is_string($result)) {
            // Lỗi — trả về string error message
            return $result;
        }

        // Custom logic trước khi add vào cart
        // Ví dụ: validate custom options, set custom data

        return $result;
    }

    /**
     * Hook trước khi save product
     */
    public function beforeSave(Product $product): static
    {
        parent::beforeSave($product);
        // Custom logic trước khi save
        return $this;
    }

    /**
     * Hook sau khi save product
     */
    public function save(Product $product): static
    {
        parent::save($product);
        // Custom logic sau khi save (ví dụ: lưu data vào bảng riêng)
        return $this;
    }
}
```

---

## 4. Price Model (optional)

Chỉ cần khi có custom price calculation logic:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Product;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Type\Price as BasePrice;

class Price extends BasePrice
{
    /**
     * Override để custom final price calculation
     */
    public function getFinalPrice(float $qty, Product $product): float
    {
        // Lấy base price
        $basePrice = parent::getFinalPrice($qty, $product);

        // Custom logic — ví dụ: thêm phí dịch vụ
        $serviceFee = (float) $product->getData('vendor_service_fee');

        $finalPrice = $basePrice + $serviceFee;

        // Dispatch event để các module khác có thể modify
        $this->_eventManager->dispatch(
            'catalog_product_get_final_price',
            ['product' => $product, 'qty' => $qty]
        );

        $finalPrice = max(0.0, (float) $product->getData('final_price'));

        return $finalPrice;
    }

    /**
     * Override để custom price cho cart
     */
    public function getPrice(Product $product): float
    {
        return (float) $product->getData('price');
    }
}
```

---

## 5. Data Patch — gán attributes cho product type

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Vendor\Module\Model\Product\Type;

class AddProductTypeAttributes implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup,
        private readonly EavSetupFactory $eavSetupFactory
    ) {}

    public function apply(): static
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        /** @var EavSetup $eavSetup */
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        // Gán các core attributes vào product type mới
        $attributesToAssign = [
            'price',
            'special_price',
            'special_from_date',
            'special_to_date',
            'minimal_price',
            'cost',
            'tier_price',
            'weight',
            'tax_class_id',
        ];

        foreach ($attributesToAssign as $attributeCode) {
            $applyTo = explode(
                ',',
                (string) $eavSetup->getAttribute(Product::ENTITY, $attributeCode, 'apply_to')
            );

            if (!in_array(Type::TYPE_ID, $applyTo, true)) {
                $applyTo[] = Type::TYPE_ID;
                $eavSetup->updateAttribute(
                    Product::ENTITY,
                    $attributeCode,
                    'apply_to',
                    implode(',', $applyTo)
                );
            }
        }

        $this->moduleDataSetup->getConnection()->endSetup();

        return $this;
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

## 6. Lưu ý quan trọng

### Stock handling

- Nếu `isQty="true"` trong `product_types.xml`, product type sẽ dùng MSI/stock management
- Nếu `isQty="false"` (như Virtual), không cần stock tracking

### Composite products

- Thêm vào `<composableTypes>` nếu muốn type này có thể là child của configurable/grouped/bundle
- Không thêm nếu type này là standalone product

### Indexing

- Custom product type tự động được index bởi catalog price indexer
- Nếu cần custom index logic, implement custom indexer riêng

### Admin UI

- Product type mới tự động xuất hiện trong dropdown "Product Type" khi tạo product mới
- Nếu cần custom form fields, thêm UI component riêng

---

## 7. Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

# Kiểm tra product type đã đăng ký
bin/magento catalog:product:type:list  # nếu có command này

# Hoặc kiểm tra qua Admin: Catalog > Products > Add Product
# Dropdown "Product Type" phải có "Custom Product"
```

---

## Liên kết

- Catalog Product Types: xem [catalog-product-types.md](./catalog-product-types.md)
- Data Patch: xem [../core/data-schema-patch.md](../core/data-schema-patch.md)
- EAV Attributes: xem [../core/attributes.md](../core/attributes.md)
- Blueprint: xem [../../examples/integration/custom-product-type-blueprint.md](../../examples/integration/custom-product-type-blueprint.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
