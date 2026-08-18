# Custom Checkout Step trong Magento 2

Nguồn:
- [Add a New Checkout Step](https://developer.adobe.com/commerce/php/tutorials/frontend/custom-checkout/add-new-step/) — developer.adobe.com
- [Add Payment Method to Checkout](https://developer.adobe.com/commerce/php/tutorials/frontend/custom-checkout/add-payment-method/) — developer.adobe.com
- [Add a New Input Form to Checkout](https://developer.adobe.com/commerce/php/tutorials/frontend/custom-checkout/add-form) — developer.adobe.com

---

## 1. Kiến trúc Checkout Magento

Checkout mặc định gồm 2 steps:
1. **Shipping Information** (sortOrder = 1)
2. **Review and Payments Information** (sortOrder = 2)

Checkout được implement bằng **KnockoutJS UI Components** với `step-navigator` quản lý thứ tự.

```
sortOrder < 10  → Hiển thị trước Shipping
10 < sortOrder < 20 → Giữa Shipping và Payment
sortOrder > 20  → Sau Payment
```

---

## 2. Tạo Custom Checkout Step

### 2.1 JavaScript View Model

```javascript
// view/frontend/web/js/view/my-checkout-step.js
define([
    'ko',
    'uiComponent',
    'underscore',
    'Magento_Checkout/js/model/step-navigator'
], function (ko, Component, _, stepNavigator) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/checkout/my-step'
        },

        isVisible: ko.observable(true),

        initialize: function () {
            this._super();

            // Đăng ký step với step-navigator
            stepNavigator.registerStep(
                'my_custom_step',   // step code (dùng làm ID trong template)
                null,               // step alias
                'My Custom Step',   // step title
                this.isVisible,     // observable visibility
                _.bind(this.navigate, this),
                15                  // sortOrder (giữa shipping và payment)
            );

            return this;
        },

        navigate: function () {
            this.isVisible(true);
        },

        navigateToNextStep: function () {
            stepNavigator.next();
        },

        // Validate trước khi cho phép next
        validateStep: function () {
            // Thêm validation logic ở đây
            return true;
        }
    });
});
```

### 2.2 HTML Template

```html
<!-- view/frontend/web/template/checkout/my-step.html -->
<!-- ID phải khớp với step code đã đăng ký -->
<li id="my_custom_step" data-bind="fadeVisible: isVisible">
    <div class="step-title" data-bind="i18n: 'My Custom Step'" data-role="title"></div>
    <div id="checkout-step-my-custom"
         class="step-content"
         data-role="content">

        <!-- Nội dung step -->
        <form data-bind="submit: navigateToNextStep" novalidate="novalidate">
            <fieldset class="fieldset">
                <!-- Custom fields ở đây -->
                <div class="field required">
                    <label class="label" for="custom-field">
                        <span data-bind="i18n: 'Custom Field'"></span>
                    </label>
                    <div class="control">
                        <input type="text"
                               id="custom-field"
                               class="input-text"
                               data-bind="value: customValue"
                               data-validate="{required: true}"/>
                    </div>
                </div>
            </fieldset>

            <div class="actions-toolbar">
                <div class="primary">
                    <button data-role="opc-continue"
                            type="submit"
                            class="button action continue primary">
                        <span data-bind="i18n: 'Next'"></span>
                    </button>
                </div>
            </div>
        </form>
    </div>
</li>
```

### 2.3 Layout XML

```xml
<!-- view/frontend/layout/checkout_index_index.xml -->
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
                                        <item name="my-custom-step" xsi:type="array">
                                            <item name="component" xsi:type="string">
                                                Vendor_Module/js/view/my-checkout-step
                                            </item>
                                            <item name="sortOrder" xsi:type="string">2</item>
                                            <item name="children" xsi:type="array">
                                                <!-- Child components nếu cần -->
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

## 3. Mixin cho Shipping/Payment Steps (khi step mới là FIRST)

Nếu custom step có `sortOrder < 1` (hiển thị trước Shipping), cần mixin để tắt auto-activate của Shipping/Payment:

```javascript
// view/base/requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/shipping': {
                'Vendor_Module/js/view/shipping-mixin': true
            },
            'Magento_Checkout/js/view/payment': {
                'Vendor_Module/js/view/shipping-mixin': true
            }
        }
    }
};
```

```javascript
// view/base/web/js/view/shipping-mixin.js
define(['ko'], function (ko) {
    'use strict';

    return function (target) {
        return target.extend({
            initialize: function () {
                // Set visible = false để step mới hiển thị trước
                this.visible = ko.observable(false);
                this._super();
                return this;
            }
        });
    };
});
```

---

## 4. Custom Payment Method Renderer

```javascript
// view/frontend/web/js/view/payment/method-renderer/custom-payment.js
define([
    'Magento_Checkout/js/view/payment/default'
], function (Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/payment/custom-payment'
        },

        getCode: function () {
            return 'vendor_custom_payment';
        },

        getData: function () {
            return {
                method: this.item.method,
                additional_data: {
                    // Custom data
                }
            };
        },

        validate: function () {
            // Custom validation
            return true;
        }
    });
});
```

Đăng ký renderer:

```javascript
// view/frontend/web/js/view/payment/vendor-payment.js
define([
    'uiComponent',
    'Magento_Checkout/js/model/payment/renderer-list'
], function (Component, rendererList) {
    'use strict';

    rendererList.push({
        type: 'vendor_custom_payment',
        component: 'Vendor_Module/js/view/payment/method-renderer/custom-payment'
    });

    return Component.extend({});
});
```

Layout XML để đăng ký:

```xml
<!-- view/frontend/layout/checkout_index_index.xml -->
<item name="payment" xsi:type="array">
    <item name="children" xsi:type="array">
        <item name="renders" xsi:type="array">
            <item name="children" xsi:type="array">
                <item name="vendor-payment" xsi:type="array">
                    <item name="component" xsi:type="string">
                        Vendor_Module/js/view/payment/vendor-payment
                    </item>
                    <item name="methods" xsi:type="array">
                        <item name="vendor_custom_payment" xsi:type="array">
                            <item name="isBillingAddressRequired" xsi:type="boolean">true</item>
                        </item>
                    </item>
                </item>
            </item>
        </item>
    </item>
</item>
```

---

## 5. Lưu custom data vào Quote

Để lưu dữ liệu từ custom step vào quote/order, cần:

1. **Extension attribute** trên Quote/Order
2. **Plugin** trên `PaymentInformationManagement::savePaymentInformation` hoặc observer `checkout_submit_before`
3. **Observer** `sales_order_place_after` để xử lý sau khi order được tạo

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Checkout\Model\Session as CheckoutSession;

class SaveCustomDataToOrder implements ObserverInterface
{
    public function __construct(
        private readonly CheckoutSession $checkoutSession
    ) {}

    public function execute(Observer $observer): void
    {
        /** @var \Magento\Sales\Model\Order $order */
        $order = $observer->getEvent()->getOrder();
        $customData = $this->checkoutSession->getData('my_custom_step_data');

        if ($customData) {
            // Lưu vào order extension attributes hoặc custom field
            $order->setData('custom_field', $customData);
        }
    }
}
```

---

## 6. Anti-patterns cần tránh

- **Không** dùng `%Vendor%_Ui` làm tên module — gây conflict với Magento_Ui
- **Không** edit `Magento_Checkout/js/view/checkout.js` trực tiếp — dùng mixin
- **Không** hardcode sortOrder trùng với step mặc định (1 = Shipping, 2 = Payment)
- **Không** dùng `$.ajax` trực tiếp — dùng `Magento_Customer/js/customer-data` hoặc `mage/storage`

---

## 7. Gotchas khi đăng ký Payment Renderer

### 7.1 `billing-step` phải có `component` declaration

Khi đăng ký renderer qua `checkout_index_index.xml`, node `billing-step` **bắt buộc** phải có `<item name="component" xsi:type="string">uiComponent</item>`. Thiếu khai báo này khiến Magento không merge đúng jsLayout tree và renderer không được đăng ký vào `rendererList`.

```xml
<!-- ✅ ĐÚNG -->
<item name="billing-step" xsi:type="array">
    <item name="component" xsi:type="string">uiComponent</item>
    <item name="children" xsi:type="array">
        <item name="payment" xsi:type="array">
            ...
        </item>
    </item>
</item>

<!-- ❌ SAI: thiếu component → renderer không được load -->
<item name="billing-step" xsi:type="array">
    <item name="children" xsi:type="array">
        ...
    </item>
</item>
```

### 7.2 Mageplaza OSC — cần file layout riêng

Mageplaza One Step Checkout dùng layout handle `onestepcheckout_index_index` (có `<update handle="checkout_index_index"/>` nhưng OSC dùng `osc-payment-list` component riêng với `deps` trỏ đến `checkout.steps.billing-step.payment.renders`).

Nếu renderer không xuất hiện trong OSC, tạo thêm:
```
view/frontend/layout/onestepcheckout_index_index.xml
```
với nội dung giống `checkout_index_index.xml`.

**Debug nhanh trong browser console:**
```js
// Kiểm tra renderer đã được đăng ký chưa
require(['Magento_Checkout/js/model/payment/renderer-list'], function(list) {
    console.log(list());
});

// Kiểm tra jsLayout có chứa renderer không
document.body.innerHTML.indexOf('my-payment-renderer-name');
// Nếu -1 → layout XML không được merge → kiểm tra billing-step component
```

### 7.3 `window.checkoutConfig` vs `window.checkout`

- `window.checkoutConfig` — inject bởi `CompositeConfigProvider` tại trang checkout/OSC
- `window.checkout` — inject bởi `Magento\Checkout\Block\Cart\Sidebar::getConfig()` tại trang có minicart

Plugin inject config vào minicart phải target `Magento\Checkout\Block\Cart\Sidebar`, không phải `CompositeConfigProvider`.

---

## Liên kết

- RequireJS/KnockoutJS: xem [requirejs-knockoutjs.md](./requirejs-knockoutjs.md)
- Layout XML: xem [layout-xml.md](./layout-xml.md)
- Extension Attributes: xem [../core/extension-attributes.md](../core/extension-attributes.md)
- Quote Totals: xem [../business/quote-totals.md](../business/quote-totals.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
