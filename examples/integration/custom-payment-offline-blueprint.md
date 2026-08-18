# Blueprint: Custom Offline Payment Method

> Blueprint đầy đủ cho offline payment method dùng Adapter pattern (không cần AbstractMethod deprecated).
> Nguồn: https://www.rakeshjesadiya.com/create-custom-payment-method-using-adapter-class-magento-2/
> Nguồn: https://developer.adobe.com/commerce/php/development/payments-integrations/base-integration/facade-configuration/

---

## Cấu trúc module

```
Vendor/OfflinePayment/
├── registration.php
├── etc/
│   ├── module.xml
│   ├── config.xml
│   ├── di.xml
│   └── adminhtml/
│       └── system.xml
├── Model/
│   └── Ui/
│       └── ConfigProvider.php
└── view/
    └── frontend/
        ├── layout/
        │   └── checkout_index_index.xml
        └── web/
            ├── js/view/payment/
            │   ├── offline-payments.js
            │   └── method-renderer/
            │       └── offline-method.js
            └── template/payment/
                └── offline-form.html
```

---

## `registration.php`

```php
<?php
declare(strict_types=1);

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_OfflinePayment',
    __DIR__
);
```

---

## `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_OfflinePayment">
        <sequence>
            <module name="Magento_Sales"/>
            <module name="Magento_Payment"/>
            <module name="Magento_Checkout"/>
            <module name="Magento_Quote"/>
            <module name="Magento_OfflinePayments"/>
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
        <payment>
            <vendor_offline>
                <active>1</active>
                <title>Bank Transfer / Offline Payment</title>
                <order_status>pending</order_status>
                <allowspecific>0</allowspecific>
                <sort_order>100</sort_order>
                <model>VendorOfflinePaymentFacade</model><!-- trỏ tới virtualType trong di.xml -->
                <group>offline</group>
                <can_use_internal>1</can_use_internal>
                <can_use_checkout>1</can_use_checkout>
                <is_offline>1</is_offline>
            </vendor_offline>
        </payment>
    </default>
</config>
```

---

## `etc/di.xml` — Facade configuration (core pattern)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Payment Method Facade — dùng virtualType, không tạo class PHP mới -->
    <virtualType name="VendorOfflinePaymentFacade" type="Magento\Payment\Model\Method\Adapter">
        <arguments>
            <argument name="code" xsi:type="const">
                Vendor\OfflinePayment\Model\Ui\ConfigProvider::CODE
            </argument>
            <argument name="formBlockType" xsi:type="string">Magento\Payment\Block\Form</argument>
            <argument name="infoBlockType" xsi:type="string">Magento\Payment\Block\Info</argument>
            <argument name="valueHandlerPool" xsi:type="object">VendorOfflinePaymentValueHandlerPool</argument>
        </arguments>
    </virtualType>

    <!-- Value Handler Pool -->
    <virtualType name="VendorOfflinePaymentValueHandlerPool"
                 type="Magento\Payment\Gateway\Config\ValueHandlerPool">
        <arguments>
            <argument name="handlers" xsi:type="array">
                <item name="default" xsi:type="string">VendorOfflinePaymentConfigValueHandler</item>
            </argument>
        </arguments>
    </virtualType>

    <!-- Config Value Handler — đọc config từ DB/config.xml -->
    <virtualType name="VendorOfflinePaymentConfigValueHandler"
                 type="Magento\Payment\Gateway\Config\ConfigValueHandler">
        <arguments>
            <argument name="configInterface" xsi:type="object">VendorOfflinePaymentConfig</argument>
        </arguments>
    </virtualType>

    <!-- Config reader -->
    <virtualType name="VendorOfflinePaymentConfig" type="Magento\Payment\Gateway\Config\Config">
        <arguments>
            <argument name="methodCode" xsi:type="const">
                Vendor\OfflinePayment\Model\Ui\ConfigProvider::CODE
            </argument>
        </arguments>
    </virtualType>

</config>
```

---

## `Model/Ui/ConfigProvider.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\OfflinePayment\Model\Ui;

use Magento\Checkout\Model\ConfigProviderInterface;

class ConfigProvider implements ConfigProviderInterface
{
    public const CODE = 'vendor_offline';

    /**
     * Trả về config cho checkout JS
     *
     * @return array<string, mixed>
     */
    public function getConfig(): array
    {
        return [
            'payment' => [
                self::CODE => [
                    'instructions' => __('Please transfer the amount to our bank account.'),
                ],
            ],
        ];
    }
}
```

---

## `etc/adminhtml/system.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Config:etc/system_file.xsd">
    <system>
        <section id="payment">
            <group id="vendor_offline" translate="label" type="text" sortOrder="100"
                   showInDefault="1" showInWebsite="1" showInStore="1">
                <label>Offline Payment (Vendor)</label>
                <field id="active" translate="label" type="select" sortOrder="1"
                       showInDefault="1" showInWebsite="1" showInStore="0" canRestore="1">
                    <label>Enabled</label>
                    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
                </field>
                <field id="title" translate="label" type="text" sortOrder="10"
                       showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
                    <label>Title</label>
                </field>
                <field id="order_status" translate="label" type="select" sortOrder="20"
                       showInDefault="1" showInWebsite="1" showInStore="0" canRestore="1">
                    <label>New Order Status</label>
                    <source_model>Magento\Sales\Model\Config\Source\Order\Status\Newprocessing</source_model>
                </field>
                <field id="allowspecific" translate="label" type="allowspecific" sortOrder="50"
                       showInDefault="1" showInWebsite="1" showInStore="0" canRestore="1">
                    <label>Payment from Applicable Countries</label>
                    <source_model>Magento\Payment\Model\Config\Source\Allspecificcountries</source_model>
                </field>
                <field id="specificcountry" translate="label" type="multiselect" sortOrder="51"
                       showInDefault="1" showInWebsite="1" showInStore="0">
                    <label>Payment from Specific Countries</label>
                    <source_model>Magento\Directory\Model\Config\Source\Country</source_model>
                    <can_be_empty>1</can_be_empty>
                </field>
                <field id="sort_order" translate="label" type="text" sortOrder="100"
                       showInDefault="1" showInWebsite="1" showInStore="0">
                    <label>Sort Order</label>
                    <frontend_class>validate-number</frontend_class>
                </field>
            </group>
        </section>
    </system>
</config>
```

---

## `view/frontend/layout/checkout_index_index.xml`

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="checkout.root">
            <arguments>
                <argument name="jsLayout" xsi:type="array">
                    <item name="components" xsi:type="array">
                        <item name="checkout" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="steps" xsi:type="array">
                                    <item name="children" xsi:type="array">
                                        <item name="billing-step" xsi:type="array">
                                            <item name="children" xsi:type="array">
                                                <item name="payment" xsi:type="array">
                                                    <item name="children" xsi:type="array">
                                                        <item name="renders" xsi:type="array">
                                                            <item name="children" xsi:type="array">
                                                                <item name="vendor-offline-payments" xsi:type="array">
                                                                    <item name="component" xsi:type="string">
                                                                        Vendor_OfflinePayment/js/view/payment/offline-payments
                                                                    </item>
                                                                    <item name="methods" xsi:type="array">
                                                                        <item name="vendor_offline" xsi:type="array">
                                                                            <item name="isBillingAddressRequired" xsi:type="boolean">true</item>
                                                                        </item>
                                                                    </item>
                                                                </item>
                                                            </item>
                                                        </item>
                                                    </item>
                                                </item>
                                            </item>
                                        </item>
                                    </item>
                                </item>
                            </item>
                        </item>
                    </item>
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>
```

---

## `view/frontend/web/js/view/payment/offline-payments.js`

```javascript
define([
    'uiComponent',
    'Magento_Checkout/js/model/payment/renderer-list'
], function (Component, rendererList) {
    'use strict';

    rendererList.push({
        type: 'vendor_offline',
        component: 'Vendor_OfflinePayment/js/view/payment/method-renderer/offline-method'
    });

    return Component.extend({});
});
```

---

## `view/frontend/web/js/view/payment/method-renderer/offline-method.js`

```javascript
define([
    'Magento_Checkout/js/view/payment/default'
], function (Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_OfflinePayment/payment/offline-form'
        },

        getInstructions: function () {
            return window.checkoutConfig.payment[this.item.method].instructions;
        }
    });
});
```

---

## `view/frontend/web/template/payment/offline-form.html`

```html
<div class="payment-method" data-bind="css: {'_active': (getCode() == isChecked())}">
    <div class="payment-method-title field choice">
        <input type="radio"
               name="payment[method]"
               class="radio"
               data-bind="attr: {'id': getCode()}, value: getCode(), checked: isChecked,
                          click: selectPaymentMethod, visible: isRadioButtonVisible()"/>
        <label data-bind="attr: {'for': getCode()}" class="label">
            <span data-bind="text: getTitle()"></span>
        </label>
    </div>
    <div class="payment-method-content">
        <!-- ko foreach: getRegion('messages') -->
        <!-- ko template: getTemplate() --><!-- /ko -->
        <!--/ko-->

        <!-- Instructions -->
        <!-- ko if: getInstructions() -->
        <div class="payment-method-note">
            <p data-bind="text: getInstructions()"></p>
        </div>
        <!-- /ko -->

        <div class="payment-method-billing-address">
            <!-- ko foreach: $parent.getRegion(getBillingAddressFormName()) -->
            <!-- ko template: getTemplate() --><!-- /ko -->
            <!--/ko-->
        </div>

        <div class="actions-toolbar" id="review-buttons-container">
            <div class="primary">
                <button class="action primary checkout"
                        type="submit"
                        data-bind="click: placeOrder,
                                   attr: {title: $t('Place Order')},
                                   enable: (getCode() == isChecked()),
                                   css: {disabled: !isPlaceOrderActionAllowed()}">
                    <span data-bind="i18n: 'Place Order'"></span>
                </button>
            </div>
        </div>
    </div>
</div>
```

---

## Verify steps

```bash
bin/magento module:enable Vendor_OfflinePayment
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean
```

1. Admin > Stores > Configuration > Sales > Payment Methods → kiểm tra "Offline Payment (Vendor)" xuất hiện
2. Enable, set title
3. Checkout → kiểm tra method hiển thị với instructions
4. Place order → kiểm tra order status = `pending`

---

## Liên kết

- Reference: [config/references/security/payment-gateway.md](../../config/references/security/payment-gateway.md)
- Patterns: [config/magento-patterns.md](../../config/magento-patterns.md)
