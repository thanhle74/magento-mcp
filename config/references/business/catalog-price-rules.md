# Tham khảo: Catalog Price, Cart Rules & Tax

Nguồn:
- https://belvg.com/blog/the-functionality-and-basic-concepts-of-price-generation-in-magento-2.html — price waterfall
- https://developer.adobe.com/commerce/php/development/components/catalog-rules/ — extend catalog rule conditions
- https://magento.stackexchange.com/questions/266838 — cart rule programmatic

---

## 1. Catalog price waterfall

### Các loại price

| Price type | Class | Mô tả |
|-----------|-------|-------|
| `base_price` | `BasePrice` | Giá gốc theo default currency |
| `regular_price` | `RegularPrice` | Giá theo currency đang chọn |
| `special_price` | `SpecialPrice` | Giá khuyến mãi (có thời hạn) |
| `tier_price` | `TierPrice` | Giá theo số lượng / customer group |
| `catalog_rule_price` | `CatalogRulePrice` | Giá sau khi áp catalog price rule |
| `final_price` | `FinalPrice` | Giá cuối cùng (thấp nhất trong các loại) |
| `custom_option_price` | `CustomOptionPrice` | Giá option |
| `configured_price` | `ConfiguredPrice` | Giá bao gồm options |

### final_price logic

```
Simple/Virtual: min(regular_price, special_price, catalog_rule_price, tier_price)
Configurable: min(final_price của tất cả options)
Grouped: min(final_price của tất cả products trong group)
Bundle: final_price của bundle + bundle_option prices
```

### Namespace

```
Magento\Catalog\Pricing\Price\*
Magento\Framework\Pricing\Price\AbstractPrice  ← base class
```

---

## 2. Custom price modifier — plugin approach

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Pricing;

use Magento\Catalog\Pricing\Price\FinalPrice;

/**
 * Plugin để modify final price
 * Nguồn: belvg.com — đã refactor theo constitution
 */
class FinalPricePlugin
{
    /**
     * Modify final price value
     */
    public function afterGetValue(FinalPrice $subject, float $result): float
    {
        $product = $subject->getProduct();

        // Ví dụ: giảm 10% cho product có custom attribute
        if ($product->getData('has_member_discount')) {
            return $result * 0.9;
        }

        return $result;
    }
}
```

```xml
<!-- di.xml -->
<type name="Magento\Catalog\Pricing\Price\FinalPrice">
    <plugin name="vendor_module_final_price_plugin"
            type="Vendor\Module\Plugin\Pricing\FinalPricePlugin" />
</type>
```

### Custom price type (thêm vào Price Pool)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Pricing\Price;

use Magento\Framework\Pricing\Price\AbstractPrice;
use Magento\Framework\Pricing\Price\BasePriceProviderInterface;

class MemberPrice extends AbstractPrice implements BasePriceProviderInterface
{
    public const PRICE_CODE = 'member_price';

    public function getValue(): float
    {
        $product = $this->getProduct();
        $memberPrice = $product->getData('member_price');

        if ($memberPrice && $memberPrice < $this->getRegularPrice()) {
            return (float)$memberPrice;
        }

        return $this->getRegularPrice();
    }

    private function getRegularPrice(): float
    {
        return (float)$this->priceInfo
            ->getPrice(\Magento\Catalog\Pricing\Price\RegularPrice::PRICE_CODE)
            ->getValue();
    }
}
```

```xml
<!-- di.xml — thêm vào Price Pool -->
<virtualType name="Vendor\Module\Pricing\Price\Pool"
             type="Magento\Framework\Pricing\Price\Pool">
    <arguments>
        <argument name="prices" xsi:type="array">
            <item name="member_price" xsi:type="string">
                Vendor\Module\Pricing\Price\MemberPrice
            </item>
        </argument>
        <argument name="target" xsi:type="object">
            Magento\Catalog\Pricing\Price\Pool
        </argument>
    </arguments>
</virtualType>
```

---

## 3. Tier price — group price

```php
// Lấy tier prices của product
$tierPrices = $product->getTierPrices();
// Trả về array của Magento\Catalog\Api\Data\ProductTierPriceInterface

// Set tier price programmatically
use Magento\Catalog\Api\Data\ProductTierPriceInterfaceFactory;
use Magento\Catalog\Api\ProductTierPriceManagementInterface;

// Thêm tier price
$tierPrice = $this->tierPriceFactory->create();
$tierPrice->setCustomerGroupId(0);  // 0 = ALL GROUPS
$tierPrice->setQty(5);
$tierPrice->setValue(90.00);

$product->setTierPrices([$tierPrice]);
$this->productRepository->save($product);
```

---

## 4. Catalog price rule — extend conditions

### Thêm custom condition

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\CatalogRule;

use Magento\CatalogRule\Model\Rule\Condition\Combine;

class CombinePlugin
{
    /**
     * Thêm custom condition vào catalog price rule
     * Nguồn: developer.adobe.com — đã refactor theo constitution
     */
    public function afterGetNewChildSelectOptions(
        Combine $subject,
        array $result
    ): array {
        $result = array_merge_recursive($result, [
            [
                'value' => \Vendor\Module\Model\Rule\Condition\CustomCondition::class,
                'label' => __('Custom Condition'),
            ]
        ]);
        return $result;
    }
}
```

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Rule\Condition;

use Magento\Rule\Model\Condition\AbstractCondition;
use Magento\Framework\Model\AbstractModel;

class CustomCondition extends AbstractCondition
{
    public function loadAttributeOptions(): static
    {
        $this->setAttributeOption([
            'custom_field' => __('Custom Field'),
        ]);
        return $this;
    }

    public function getInputType(): string
    {
        return 'string';
    }

    public function getValueElementType(): string
    {
        return 'text';
    }

    public function validate(AbstractModel $model): bool
    {
        $value = $model->getData('custom_field');
        return $this->validateAttribute($value);
    }
}
```

---

## 5. Cart price rule — programmatic

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\SalesRule\Api\RuleRepositoryInterface;
use Magento\SalesRule\Api\Data\RuleInterfaceFactory;
use Magento\SalesRule\Api\Data\ConditionInterfaceFactory;
use Magento\SalesRule\Model\Rule;

class CartRuleService
{
    public function __construct(
        private readonly RuleRepositoryInterface $ruleRepository,
        private readonly RuleInterfaceFactory $ruleFactory,
        private readonly ConditionInterfaceFactory $conditionFactory
    ) {}

    /**
     * Tạo cart price rule với coupon
     */
    public function createDiscountRule(
        string $name,
        float $discountAmount,
        string $couponCode,
        int $usesPerCoupon = 1
    ): \Magento\SalesRule\Api\Data\RuleInterface {
        $rule = $this->ruleFactory->create();
        $rule->setName($name);
        $rule->setIsActive(1);
        $rule->setCustomerGroupIds([0, 1, 2, 3]); // All groups
        $rule->setWebsiteIds([1]);
        $rule->setCouponType(Rule::COUPON_TYPE_SPECIFIC_COUPON);
        $rule->setCouponCode($couponCode);
        $rule->setUsesPerCoupon($usesPerCoupon);
        $rule->setSimpleAction(Rule::BY_PERCENT_ACTION);
        $rule->setDiscountAmount($discountAmount);
        $rule->setStopRulesProcessing(false);
        $rule->setSortOrder(0);

        return $this->ruleRepository->save($rule);
    }
}
```

### Action types

| Constant | Mô tả |
|---------|-------|
| `BY_PERCENT_ACTION` | Giảm % trên từng item |
| `BY_FIXED_ACTION` | Giảm số tiền cố định trên từng item |
| `CART_FIXED_ACTION` | Giảm số tiền cố định trên toàn cart |
| `BUY_X_GET_Y_ACTION` | Mua X tặng Y |

---

## 6. Tax — tax class, tax rule, FPT

### Tax class

```php
// Lấy tax class của product
$taxClassId = $product->getTaxClassId();

// Tax class IDs mặc định
// 0 = None
// 2 = Taxable Goods
// 4 = Shipping
```

### FPT (Fixed Product Tax)

FPT là thuế cố định theo sản phẩm (ví dụ: phí tái chế, phí môi trường).

```php
// Thêm FPT attribute vào product
// Attribute type: weee (Fixed Product Tax)
// Cấu hình trong: Stores > Configuration > Sales > Tax > Fixed Product Taxes
```

### Tax display settings

```
Stores > Configuration > Sales > Tax:
- Display Product Prices In Catalog: Excluding Tax / Including Tax / Both
- Display Shipping Prices: Excluding Tax / Including Tax / Both
- Display Subtotal: Excluding Tax / Including Tax / Both
```

---

## Liên kết

- Catalog product types: xem [catalog-product-types.md](./catalog-product-types.md)
- Custom product type: xem [custom-product-type.md](./custom-product-type.md)
- Order lifecycle: xem [order-lifecycle.md](./order-lifecycle.md)
