# Blueprint: Custom Shipping Carrier

> Blueprint đầy đủ cho custom shipping carrier kế thừa `AbstractCarrier`.
> Nguồn: https://developer.adobe.com/commerce/php/tutorials/frontend/custom-checkout/add-shipping-carrier
> Nguồn: https://inchoo.net/magento-2/creating-a-shipping-method-in-magento-2/

---

## Cấu trúc module

```
Vendor/CustomShipping/
├── registration.php
├── etc/
│   ├── module.xml
│   ├── config.xml
│   └── adminhtml/
│       └── system.xml
├── Model/
│   └── Carrier/
│       └── CustomShipping.php
└── composer.json
```

---

## `registration.php`

```php
<?php
declare(strict_types=1);

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_CustomShipping',
    __DIR__
);
```

---

## `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_CustomShipping">
        <sequence>
            <module name="Magento_Shipping"/>
            <module name="Magento_Quote"/>
            <module name="Magento_Sales"/>
        </sequence>
    </module>
</config>
```

---

## `etc/config.xml` — default values

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Store:etc/config.xsd">
    <default>
        <carriers>
            <customshipping>
                <active>0</active>
                <title>Custom Shipping</title>
                <name>Standard Delivery</name>
                <shipping_cost>10.00</shipping_cost>
                <sallowspecific>0</sallowspecific>
                <sort_order>15</sort_order>
                <model>Vendor\CustomShipping\Model\Carrier\CustomShipping</model>
            </customshipping>
        </carriers>
    </default>
</config>
```

---

## `etc/adminhtml/system.xml` — Admin config

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Config:etc/system_file.xsd">
    <system>
        <section id="carriers">
            <group id="customshipping" translate="label" type="text" sortOrder="0"
                   showInDefault="1" showInWebsite="1" showInStore="1">
                <label>Custom Shipping</label>
                <field id="active" translate="label" type="select" sortOrder="10"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Enabled</label>
                    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
                </field>
                <field id="title" translate="label" type="text" sortOrder="20"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Title</label>
                </field>
                <field id="name" translate="label" type="text" sortOrder="30"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Method Name</label>
                </field>
                <field id="shipping_cost" translate="label" type="text" sortOrder="40"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Shipping Cost</label>
                    <validate>validate-number validate-zero-or-greater</validate>
                </field>
                <field id="sallowspecific" translate="label" type="select" sortOrder="50"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Ship to Applicable Countries</label>
                    <frontend_class>shipping-applicable-country</frontend_class>
                    <source_model>Magento\Shipping\Model\Config\Source\Allspecificcountries</source_model>
                </field>
                <field id="specificcountry" translate="label" type="multiselect" sortOrder="60"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Ship to Specific Countries</label>
                    <source_model>Magento\Directory\Model\Config\Source\Country</source_model>
                    <can_be_empty>1</can_be_empty>
                </field>
                <field id="showmethod" translate="label" type="select" sortOrder="70"
                       showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Show Method if Not Applicable</label>
                    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
                    <frontend_class>shipping-skip-hide</frontend_class>
                </field>
                <field id="specificerrmsg" translate="label" type="textarea" sortOrder="80"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Displayed Error Message</label>
                </field>
                <field id="sort_order" translate="label" type="text" sortOrder="90"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Sort Order</label>
                </field>
            </group>
        </section>
    </system>
</config>
```

---

## `Model/Carrier/CustomShipping.php` — Carrier class

```php
<?php
declare(strict_types=1);

namespace Vendor\CustomShipping\Model\Carrier;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory;
use Magento\Quote\Model\Quote\Address\RateResult\Method;
use Magento\Quote\Model\Quote\Address\RateResult\MethodFactory;
use Magento\Shipping\Model\Carrier\AbstractCarrier;
use Magento\Shipping\Model\Carrier\CarrierInterface;
use Magento\Shipping\Model\Rate\Result;
use Magento\Shipping\Model\Rate\ResultFactory;
use Psr\Log\LoggerInterface;

class CustomShipping extends AbstractCarrier implements CarrierInterface
{
    /**
     * Carrier code — phải khớp với key trong config.xml
     */
    protected $_code = 'customshipping';

    /**
     * Fixed rate carrier (không tính theo weight/distance)
     */
    protected $_isFixed = true;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        ErrorFactory $rateErrorFactory,
        LoggerInterface $logger,
        private readonly ResultFactory $rateResultFactory,
        private readonly MethodFactory $rateMethodFactory,
        array $data = []
    ) {
        parent::__construct($scopeConfig, $rateErrorFactory, $logger, $data);
    }

    /**
     * Collect shipping rates
     *
     * @param RateRequest $request
     * @return Result|bool
     */
    public function collectRates(RateRequest $request): Result|bool
    {
        if (!$this->getConfigFlag('active')) {
            return false;
        }

        // Guard: kiểm tra điều kiện nghiệp vụ nếu cần
        // Ví dụ: chỉ áp dụng cho đơn hàng trên $50
        // if ($request->getPackageValueWithDiscount() < 50) {
        //     return false;
        // }

        /** @var Method $method */
        $method = $this->rateMethodFactory->create();

        $method->setCarrier($this->_code);
        $method->setCarrierTitle($this->getConfigData('title'));
        $method->setMethod($this->_code);
        $method->setMethodTitle($this->getConfigData('name'));

        $shippingCost = (float) $this->getConfigData('shipping_cost');
        $method->setPrice($shippingCost);
        $method->setCost($shippingCost);

        /** @var Result $result */
        $result = $this->rateResultFactory->create();
        $result->append($method);

        return $result;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array<string, string>
     */
    public function getAllowedMethods(): array
    {
        return [$this->_code => (string) $this->getConfigData('name')];
    }

    /**
     * Check if tracking is available
     * Override nếu carrier hỗ trợ tracking
     */
    public function isTrackingAvailable(): bool
    {
        return false;
    }
}
```

---

## Thêm tracking support (optional)

Nếu carrier hỗ trợ tracking, override `getTrackingInfo()`:

```php
use Magento\Shipping\Model\Tracking\Result\StatusFactory;

// Thêm vào constructor
private readonly StatusFactory $trackStatusFactory,

public function isTrackingAvailable(): bool
{
    return true;
}

public function getTrackingInfo(string $tracking): \Magento\Shipping\Model\Tracking\Result\Status
{
    $status = $this->trackStatusFactory->create();
    $status->setCarrier($this->_code);
    $status->setCarrierTitle($this->getConfigData('title'));
    $status->setTracking($tracking);

    // Gọi API carrier để lấy tracking info
    $trackingData = $this->fetchTrackingFromApi($tracking);
    $status->setStatus($trackingData['status'] ?? __('In Transit'));
    $status->setUrl($trackingData['url'] ?? '');

    return $status;
}
```

---

## Verify steps

```bash
bin/magento module:enable Vendor_CustomShipping
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean
```

1. Admin > Stores > Configuration > Sales > Shipping Methods → kiểm tra "Custom Shipping" xuất hiện
2. Enable carrier, set price
3. Checkout → kiểm tra method hiển thị đúng
4. Place order → kiểm tra `sales_order.shipping_method = 'customshipping_customshipping'`

---

## Liên kết

- Reference: [config/references/infrastructure/shipping-carrier.md](../../config/references/infrastructure/shipping-carrier.md)
- Patterns: [config/magento-patterns.md](../../config/magento-patterns.md)
