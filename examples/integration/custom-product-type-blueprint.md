# Blueprint: Custom Product Type

> Nguồn: https://www.classyllama.com/blog/custom-product-types-magento-2 — đã refactor theo constitution
> Mục đích: Tạo product type mới với custom price model và stock handling

---

## Cấu trúc module

```
app/code/Vendor/CustomProduct/
├── registration.php
├── etc/
│   ├── module.xml
│   └── product_types.xml
├── Model/
│   └── Product/
│       ├── Type.php
│       └── Price.php
└── Setup/
    └── Patch/
        └── Data/
            └── AddProductTypeAttributes.php
```

---

## `registration.php`

```php
<?php
declare(strict_types=1);

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_CustomProduct',
    __DIR__
);
```

---

## `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_CustomProduct">
        <sequence>
            <module name="Magento_Catalog"/>
            <module name="Magento_CatalogInventory"/>
        </sequence>
    </module>
</config>
```

---

## `etc/product_types.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Catalog:etc/product_types.xsd">
    <type name="vendor_custom"
          label="Custom Product"
          modelInstance="Vendor\CustomProduct\Model\Product\Type"
          indexPriority="10"
          sortOrder="100"
          isQty="true">
        <priceModel instance="Vendor\CustomProduct\Model\Product\Price" />
        <stockIndexerModel instance="Magento\CatalogInventory\Model\Indexer\Stock\DefaultStockIndexer" />
    </type>

    <!-- Cho phép là child của composite products -->
    <composableTypes>
        <type name="vendor_custom" />
    </composableTypes>
</config>
```

---

## `Model/Product/Type.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\CustomProduct\Model\Product;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Type\AbstractType;
use Magento\Framework\DataObject;

class Type extends AbstractType
{
    public const TYPE_ID = 'vendor_custom';

    /**
     * Bắt buộc implement — dọn dẹp data khi product đổi type
     */
    public function deleteTypeSpecificData(Product $product): void
    {
        // Xóa data đặc thù nếu có bảng riêng
        // Ví dụ: $this->customRepository->deleteByProductId((int) $product->getId());
    }

    /**
     * Custom saleability check
     */
    public function isSalable(Product $product): bool
    {
        if (!parent::isSalable($product)) {
            return false;
        }

        // Custom logic — ví dụ: check thêm điều kiện riêng
        $customField = $product->getData('vendor_custom_field');
        if ($customField === 'disabled') {
            return false;
        }

        return true;
    }

    /**
     * Hook khi add vào cart
     */
    protected function _prepareProduct(
        DataObject $buyRequest,
        Product $product,
        string $processMode
    ): array|string {
        $result = parent::_prepareProduct($buyRequest, $product, $processMode);

        if (is_string($result)) {
            return $result;
        }

        // Custom logic trước khi add vào cart
        // Ví dụ: validate custom options

        return $result;
    }

    /**
     * Hook trước khi save
     */
    public function beforeSave(Product $product): static
    {
        parent::beforeSave($product);
        // Custom logic trước khi save
        return $this;
    }

    /**
     * Hook sau khi save
     */
    public function save(Product $product): static
    {
        parent::save($product);
        // Custom logic sau khi save
        return $this;
    }
}
```

---

## `Model/Product/Price.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\CustomProduct\Model\Product;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Type\Price as BasePrice;

class Price extends BasePrice
{
    /**
     * Custom final price calculation
     */
    public function getFinalPrice(float $qty, Product $product): float
    {
        // Lấy base price từ parent (áp dụng catalog rules, special price...)
        $basePrice = parent::getFinalPrice($qty, $product);

        // Custom logic — ví dụ: thêm phí dịch vụ
        $serviceFee = (float) ($product->getData('vendor_service_fee') ?? 0.0);
        $finalPrice = $basePrice + $serviceFee;

        // Dispatch event để các module khác có thể modify
        $this->_eventManager->dispatch(
            'catalog_product_get_final_price',
            ['product' => $product, 'qty' => $qty]
        );

        // Lấy final price sau khi event đã modify (nếu có)
        $eventFinalPrice = (float) $product->getData('final_price');
        if ($eventFinalPrice > 0) {
            $finalPrice = $eventFinalPrice;
        }

        return max(0.0, $finalPrice);
    }
}
```

---

## `Setup/Patch/Data/AddProductTypeAttributes.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\CustomProduct\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Vendor\CustomProduct\Model\Product\Type;

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

        // Gán core attributes vào product type mới
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
            'status',
            'visibility',
        ];

        foreach ($attributesToAssign as $attributeCode) {
            $currentApplyTo = (string) $eavSetup->getAttribute(
                Product::ENTITY,
                $attributeCode,
                'apply_to'
            );

            $applyTo = $currentApplyTo ? explode(',', $currentApplyTo) : [];

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

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

# Kiểm tra product type đã đăng ký
# Admin > Catalog > Products > Add Product
# Dropdown "Product Type" phải có "Custom Product"

# Tạo product test
# Admin > Catalog > Products > Add Product > Custom Product
# Điền thông tin, save, kiểm tra frontend
```

---

## Liên kết

- Reference: [config/references/business/custom-product-type.md](../../config/references/business/custom-product-type.md)
- Catalog Product Types: [config/references/business/catalog-product-types.md](../../config/references/business/catalog-product-types.md)
- Data Patch: [config/references/core/data-schema-patch.md](../../config/references/core/data-schema-patch.md)
