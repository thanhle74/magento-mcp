# Blueprint: Custom Price Modifier (Catalog Rule Condition)

> Nguồn: https://developer.adobe.com/commerce/php/development/components/catalog-rules/ — đã refactor theo constitution
> Nguồn: https://www.rakeshjesadiya.com/set-product-final-price-using-catalog-product-get-final-price-event-in-magento-2/
> Mục đích: Thêm custom condition vào Catalog Price Rule và/hoặc modify final price

---

## Hai approach chính

| Approach | Dùng khi | Cơ chế |
|---|---|---|
| **Custom Catalog Rule Condition** | Cần thêm điều kiện mới vào rule builder trong Admin | Plugin + Condition class |
| **Final Price Modifier** | Cần modify giá cuối theo logic riêng | Observer `catalog_product_get_final_price` |

---

## Approach 1: Custom Catalog Rule Condition

### Cấu trúc

```
app/code/Vendor/Module/
├── etc/
│   └── di.xml
├── Plugin/
│   └── CatalogRule/
│       └── Model/
│           └── Rule/
│               └── Condition/
│                   └── CombinePlugin.php
└── Model/
    └── Rule/
        └── Condition/
            └── VendorAttribute.php
```

### `Model/Rule/Condition/VendorAttribute.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Rule\Condition;

use Magento\Rule\Model\Condition\AbstractCondition;
use Magento\Framework\Model\AbstractModel;

class VendorAttribute extends AbstractCondition
{
    /**
     * Load attribute options — các attributes có thể dùng làm condition
     */
    public function loadAttributeOptions(): static
    {
        $this->setAttributeOption([
            'vendor_custom_attribute' => (string) __('Vendor Custom Attribute'),
            'vendor_product_tier' => (string) __('Vendor Product Tier'),
        ]);

        return $this;
    }

    /**
     * Render HTML cho condition input
     */
    public function getInputType(): string
    {
        return match ($this->getAttribute()) {
            'vendor_product_tier' => 'select',
            default => 'string',
        };
    }

    public function getValueElementType(): string
    {
        return match ($this->getAttribute()) {
            'vendor_product_tier' => 'select',
            default => 'text',
        };
    }

    /**
     * Options cho select type
     */
    public function getValueSelectOptions(): array
    {
        if ($this->getAttribute() === 'vendor_product_tier') {
            return [
                ['value' => 'bronze', 'label' => __('Bronze')],
                ['value' => 'silver', 'label' => __('Silver')],
                ['value' => 'gold', 'label' => __('Gold')],
            ];
        }
        return [];
    }

    /**
     * Validate condition với product
     */
    public function validate(AbstractModel $model): bool
    {
        $attributeCode = $this->getAttribute();
        $productValue = $model->getData($attributeCode);

        if ($productValue === null) {
            return false;
        }

        return $this->validateAttribute($productValue);
    }
}
```

### `Plugin/CatalogRule/Model/Rule/Condition/CombinePlugin.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\CatalogRule\Model\Rule\Condition;

use Magento\CatalogRule\Model\Rule\Condition\Combine;

class CombinePlugin
{
    /**
     * Thêm custom condition vào dropdown trong Admin
     */
    public function afterGetNewChildSelectOptions(
        Combine $subject,
        array $result
    ): array {
        $vendorConditions = [
            'label' => __('Vendor Attributes'),
            'value' => [
                [
                    'value' => \Vendor\Module\Model\Rule\Condition\VendorAttribute::class . '|vendor_custom_attribute',
                    'label' => __('Vendor Custom Attribute'),
                ],
                [
                    'value' => \Vendor\Module\Model\Rule\Condition\VendorAttribute::class . '|vendor_product_tier',
                    'label' => __('Vendor Product Tier'),
                ],
            ],
        ];

        $result[] = $vendorConditions;
        return $result;
    }
}
```

### `etc/di.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\CatalogRule\Model\Rule\Condition\Combine">
        <plugin name="vendor_module_catalog_rule_condition"
                type="Vendor\Module\Plugin\CatalogRule\Model\Rule\Condition\CombinePlugin" />
    </type>
</config>
```

---

## Approach 2: Final Price Modifier via Observer

Dùng khi cần modify `final_price` của product theo logic riêng (không cần rule builder).

### `etc/events.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="catalog_product_get_final_price">
        <observer name="vendor_module_modify_final_price"
                  instance="Vendor\Module\Observer\ModifyFinalPrice" />
    </event>
</config>
```

### `Observer/ModifyFinalPrice.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Catalog\Model\Product;
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Psr\Log\LoggerInterface;

class ModifyFinalPrice implements ObserverInterface
{
    public function __construct(
        private readonly LoggerInterface $logger
    ) {}

    public function execute(Observer $observer): void
    {
        /** @var Product $product */
        $product = $observer->getEvent()->getProduct();
        $qty = (float) ($observer->getEvent()->getQty() ?? 1.0);

        if ($product === null) {
            return;
        }

        try {
            $currentFinalPrice = (float) $product->getData('final_price');

            // Custom logic — ví dụ: giảm giá theo customer tier
            $discount = $this->calculateCustomDiscount($product, $qty);

            if ($discount > 0) {
                $newFinalPrice = max(0.0, $currentFinalPrice - $discount);
                $product->setData('final_price', $newFinalPrice);
            }
        } catch (\Exception $e) {
            $this->logger->error(
                'Error modifying final price for product ' . $product->getId(),
                ['exception' => $e]
            );
        }
    }

    private function calculateCustomDiscount(Product $product, float $qty): float
    {
        // Custom discount logic
        // Ví dụ: giảm 5% nếu qty >= 10
        if ($qty >= 10) {
            return (float) $product->getData('final_price') * 0.05;
        }

        return 0.0;
    }
}
```

---

## Approach 3: Custom Total Collector (Cart Price)

Nếu cần modify giá ở cart level (không phải catalog level):

### `etc/sales.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Sales:etc/sales.xsd">
    <section name="quote">
        <group name="totals">
            <item name="vendor_custom_discount" instance="Vendor\Module\Model\Quote\Total\CustomDiscount"
                  sort_order="450" />
        </group>
    </section>
</config>
```

### `Model/Quote/Total/CustomDiscount.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Quote\Total;

use Magento\Quote\Api\Data\ShippingAssignmentInterface;
use Magento\Quote\Model\Quote;
use Magento\Quote\Model\Quote\Address\Total;
use Magento\Quote\Model\Quote\Address\Total\AbstractTotal;

class CustomDiscount extends AbstractTotal
{
    public function __construct()
    {
        $this->setCode('vendor_custom_discount');
    }

    public function collect(
        Quote $quote,
        ShippingAssignmentInterface $shippingAssignment,
        Total $total
    ): static {
        parent::collect($quote, $shippingAssignment, $total);

        $items = $shippingAssignment->getItems();
        if (empty($items)) {
            return $this;
        }

        $discountAmount = 0.0;

        foreach ($items as $item) {
            if ($item->getParentItemId()) {
                continue; // Skip child items
            }

            // Custom discount logic
            $itemDiscount = $this->calculateItemDiscount($item);
            $discountAmount += $itemDiscount;

            $item->setDiscountAmount($item->getDiscountAmount() + $itemDiscount);
            $item->setBaseDiscountAmount($item->getBaseDiscountAmount() + $itemDiscount);
        }

        if ($discountAmount > 0) {
            $total->addTotalAmount($this->getCode(), -$discountAmount);
            $total->addBaseTotalAmount($this->getCode(), -$discountAmount);
        }

        return $this;
    }

    public function fetch(Quote $quote, Total $total): array
    {
        $amount = $total->getTotalAmount($this->getCode());
        if ($amount === null || $amount == 0) {
            return [];
        }

        return [
            'code' => $this->getCode(),
            'title' => __('Custom Discount'),
            'value' => $amount,
        ];
    }

    private function calculateItemDiscount(mixed $item): float
    {
        // Custom logic
        return 0.0;
    }
}
```

---

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

# Approach 1: Kiểm tra condition trong Admin
# Admin > Marketing > Catalog Price Rules > Add New Rule
# Tab "Conditions" > Add condition > "Vendor Attributes" phải xuất hiện

# Approach 2: Test final price modifier
# Tạo product, xem giá trên frontend
# Thêm vào cart với qty >= 10, kiểm tra giá

# Approach 3: Test total collector
# Thêm sản phẩm vào cart, kiểm tra cart totals
```

---

## Liên kết

- Catalog Price Rules Reference: [config/references/business/catalog-price-rules.md](../../config/references/business/catalog-price-rules.md)
- Quote & Totals: [config/references/business/quote-totals.md](../../config/references/business/quote-totals.md)
- Observer/Event: [config/references/core/events-observers.md](../../config/references/core/events-observers.md)
- Plugin: [config/references/core/plugins.md](../../config/references/core/plugins.md)
