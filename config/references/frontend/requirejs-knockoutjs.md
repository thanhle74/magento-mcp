# Tham khảo: RequireJS & KnockoutJS trong Magento 2

Nguồn:
- https://developer.adobe.com/commerce/frontend-core/javascript/requirejs — đã refactor theo constitution
- https://www.rakeshjesadiya.com/require-js-config-map-vs-paths-vs-shim-in-magento/ — map/paths/shim/mixins
- https://amasty.com/blog/tips-and-examples-of-using-knockout-in-magento-2/ — KO patterns
- https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/knockout-bindings — custom bindings

---

## 1. RequireJS — cấu hình requirejs-config.js

### Vị trí file

```
app/code/<Vendor>/<Module>/view/frontend/requirejs-config.js   # storefront
app/code/<Vendor>/<Module>/view/adminhtml/requirejs-config.js  # admin
app/code/<Vendor>/<Module>/view/base/requirejs-config.js       # cả hai
```

### Cấu trúc cơ bản

```javascript
var config = {
    map: {...},
    paths: {...},
    deps: [...],
    shim: {...},
    config: {
        mixins: {...},
        text: {...}
    }
};
```

---

### map — alias cho AMD module

Dùng để override JS module hoặc HTML template của core/module khác.

```javascript
var config = {
    map: {
        // '*' = áp dụng globally cho mọi module
        '*': {
            // Override JS module
            'Magento_Checkout/js/view/shipping': 'Vendor_Module/js/view/shipping',
            // Override HTML template
            'Magento_Checkout/template/view/shipping.html': 'Vendor_Module/template/view/shipping.html'
        },
        // Chỉ áp dụng trong context của module cụ thể
        'Vendor_Module/js/my-module': {
            'some-alias': 'Vendor_Module/js/other-module'
        }
    }
};
```

> **Khác với paths:** `map` chỉ hoạt động với AMD module (có `define()`). `paths` hoạt động với mọi file JS, HTML template, URL bên ngoài.

---

### paths — alias cho file path và URL

```javascript
var config = {
    paths: {
        // Alias cho thư mục
        'checkoutPath': 'Vendor_Module/js/view',

        // Third-party library từ CDN (với fallback)
        'googlePayLibrary': [
            'https://pay.google.com/gp/p/js/pay',
            'Vendor_Module/js/fallback/google-pay'  // fallback nếu CDN fail
        ],

        // Override HTML template (dùng paths thay vì map cho template)
        'ui/template/form/element/input': 'Vendor_Module/template/form/element/input'
    }
};
```

---

### shim — dependency cho non-AMD library

Dùng khi thư viện bên thứ ba không dùng AMD `define()`.

```javascript
var config = {
    shim: {
        // Load jquery trước slick
        'Magento_PageBuilder/js/resource/slick/slick': {
            deps: ['jquery']
        },
        // Export global variable
        'Vendor_Module/js/legacy-lib': {
            deps: ['jquery'],
            exports: 'LegacyLib'  // window.LegacyLib sau khi load
        }
    }
};
```

---

### deps — load trên mọi trang

```javascript
var config = {
    // Load module này trên mọi trang (dùng cẩn thận — ảnh hưởng performance)
    deps: ['Vendor_Module/js/global-init']
};
```

---

### mixins — override method của AMD module

Cách an toàn nhất để extend JS module mà không override toàn bộ.

```javascript
// requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/shipping': {
                'Vendor_Module/js/view/shipping-mixin': true
            },
            // Có thể disable mixin
            'Magento_Theme/js/view/breadcrumbs': {
                'Magento_Theme/js/view/add-home-breadcrumb': false
            }
        }
    }
};
```

```javascript
// Vendor_Module/view/frontend/web/js/view/shipping-mixin.js
define([], function () {
    'use strict';

    return function (Component) {
        return Component.extend({
            // Override method
            validateShippingInformation: function () {
                // Custom validation logic
                console.log('Custom validation');
                return this._super(); // Gọi method gốc
            },

            // Thêm method mới
            customMethod: function () {
                return 'custom';
            }
        });
    };
});
```

---

### AMD module pattern chuẩn

```javascript
// Vendor_Module/view/frontend/web/js/my-component.js
define([
    'jquery',
    'ko',
    'uiComponent',
    'Magento_Customer/js/customer-data'
], function ($, ko, Component, customerData) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/my-component',
            isVisible: true
        },

        initialize: function () {
            this._super();
            this.initObservables();
            return this;
        },

        initObservables: function () {
            this._super();
            this.observe(['isVisible', 'items']);
            return this;
        }
    });
});
```

---

## 2. KnockoutJS — observable, computed, custom binding, component lifecycle

### Observable

```javascript
// Trong UI Component
defaults: {
    // Khai báo observable trong defaults
    isLoading: false,
    selectedItem: null,
    items: []
},

initialize: function () {
    this._super();
    // Khai báo observable
    this.observe(['isLoading', 'selectedItem', 'items']);
    return this;
},

// Sử dụng
loadData: function () {
    this.isLoading(true);           // set value
    var current = this.isLoading(); // get value
    this.items([{id: 1}, {id: 2}]); // set array
}
```

```html
<!-- Template HTML -->
<div data-bind="visible: isLoading">Loading...</div>
<div data-bind="foreach: items">
    <span data-bind="text: $data.name"></span>
</div>
```

### Computed observable

```javascript
initialize: function () {
    this._super();
    this.observe(['firstName', 'lastName']);

    // Computed: tự động update khi dependency thay đổi
    this.fullName = ko.computed(function () {
        return this.firstName() + ' ' + this.lastName();
    }, this);

    // Writable computed
    this.fullNameWritable = ko.computed({
        read: function () {
            return this.firstName() + ' ' + this.lastName();
        },
        write: function (value) {
            var parts = value.split(' ');
            this.firstName(parts[0]);
            this.lastName(parts[1] || '');
        },
        owner: this
    });

    return this;
}
```

### Custom binding

```javascript
// Đăng ký custom binding
ko.bindingHandlers.fadeVisible = {
    init: function (element, valueAccessor) {
        // Chạy một lần khi binding được áp dụng
        var value = ko.unwrap(valueAccessor());
        $(element).toggle(value);
    },
    update: function (element, valueAccessor) {
        // Chạy mỗi khi observable thay đổi
        var value = ko.unwrap(valueAccessor());
        value ? $(element).fadeIn() : $(element).fadeOut();
    }
};
```

```html
<div data-bind="fadeVisible: isVisible">Content</div>
```

### Magento custom bindings (built-in)

```html
<!-- scope: tạo KO scope mới -->
<div data-bind="scope: 'checkout'">
    <span data-bind="text: getTitle()"></span>
</div>

<!-- i18n: translate -->
<span data-bind="i18n: 'Add to Cart'"></span>

<!-- mageInit: khởi tạo widget -->
<div data-bind="mageInit: {'Magento_Ui/js/modal/modal': {type: 'popup'}}"></div>

<!-- afterRender: callback sau khi render -->
<div data-bind="afterRender: onRendered"></div>

<!-- template: render KO template -->
<div data-bind="template: {name: getTemplate(), data: $data}"></div>
```

### Component lifecycle

```javascript
define(['uiComponent'], function (Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/component',
            // Các property mặc định
            isVisible: true
        },

        /**
         * 1. initialize() — gọi đầu tiên khi component được tạo
         */
        initialize: function () {
            this._super();           // Gọi parent initialize
            this.initObservables();  // Khởi tạo observables
            this.initSubscriptions(); // Đăng ký subscriptions
            return this;
        },

        /**
         * 2. initObservables() — khai báo observable properties
         */
        initObservables: function () {
            this._super();
            this.observe(['isVisible', 'items', 'selectedId']);
            return this;
        },

        /**
         * 3. initSubscriptions() — watch observable changes
         */
        initSubscriptions: function () {
            this.selectedId.subscribe(function (newId) {
                this.onSelectedIdChange(newId);
            }.bind(this));
            return this;
        },

        /**
         * 4. Các method nghiệp vụ
         */
        onSelectedIdChange: function (id) {
            // Handle change
        },

        /**
         * 5. getTemplate() — trả về template path
         */
        getTemplate: function () {
            return this.template;
        }
    });
});
```

### Truy cập component từ template

```html
<!-- Trong template, $data là component instance -->
<button data-bind="click: loadMore, text: buttonLabel()"></button>

<!-- $parent: component cha -->
<span data-bind="text: $parent.title()"></span>

<!-- $root: component gốc nhất -->
<span data-bind="text: $root.storeTitle()"></span>

<!-- $index: index trong foreach -->
<div data-bind="foreach: items">
    <span data-bind="text: $index()"></span>
</div>
```

### Truy cập component từ JS

```javascript
// Lấy component instance theo name
var registry = require('uiRegistry');
var component = registry.get('checkout.steps.shipping-step');

// Subscribe vào component
registry.get('checkout.steps.shipping-step', function (component) {
    component.isVisible(false);
});
```

---

## 3. x-magento-init — khởi tạo JS component từ PHP

```html
<!-- Trong phtml template -->
<script type="text/x-magento-init">
{
    "#element-id": {
        "Vendor_Module/js/my-widget": {
            "config_key": "<?= $block->escapeJs($block->getConfigValue()) ?>"
        }
    }
}
</script>

<!-- Áp dụng cho toàn trang (không cần element cụ thể) -->
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/global-component": {
            "storeId": <?= (int)$block->getStoreId() ?>
        }
    }
}
</script>
```

---

## 4. Luma theme — parent theme override, _module.less, _extend.less

### Theme inheritance

```
app/design/frontend/<Vendor>/<theme>/
├── registration.php
├── theme.xml
├── composer.json
└── web/
    └── css/
        └── source/
            ├── _theme.less          # Override theme variables
            ├── _module.less         # Override module styles (deprecated approach)
            └── _extend.less         # Extend/add styles
```

### theme.xml — khai báo parent theme

```xml
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor Custom Theme</title>
    <parent>Magento/luma</parent>  <!-- hoặc Magento/blank -->
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
```

### Override module LESS

```less
/* app/design/frontend/Vendor/theme/Magento_Catalog/web/css/source/_module.less */
/* Override styles của Magento_Catalog module */

.product-item {
    .product-item-name {
        font-size: 1.4rem;
        font-weight: @font-weight__bold;
    }
}
```

### _extend.less — thêm styles mà không override

```less
/* app/design/frontend/Vendor/theme/web/css/source/_extend.less */
/* Thêm styles mới, không override styles gốc */

.custom-banner {
    background: @color-blue1;
    padding: 20px;
}
```

---

## Liên kết

- Layout XML: xem [layout-xml.md](./layout-xml.md)
- UI Components: xem [ui-components.md](./ui-components.md)
- ViewModel: xem [frontend-view-models.md](./frontend-view-models.md)
- Hyva (Alpine.js thay KO): xem [hyva-theme.md](./hyva-theme.md)
