# Tham khảo: Varnish & Full Page Cache (FPC)

Nguồn:
- https://experienceleague.adobe.com/docs/commerce-operations/configuration-guide/cache/use-varnish-cache.html — đã refactor theo constitution
- https://developer.adobe.com/commerce/php/development/cache/page/private-content/ — private content / hole punching
- https://mgt-commerce.com/blog/magento-full-page-cache/ — FPC overview
- https://www.atwix.com/development/cache-context-and-page-variations-in-magento-2/ — cache context

---

## 1. Full Page Cache — tổng quan

FPC lưu toàn bộ HTML của trang và serve cached version mà không cần PHP processing.

| Backend | Dùng khi | Cấu hình |
|---------|---------|----------|
| **Varnish** (khuyến nghị) | Production | `bin/magento setup:config:set --http-cache-hosts=...` |
| **Built-in (file)** | Development | Mặc định |
| **Redis** | Production (alternative) | Cấu hình trong `env.php` |

### Cache tags (X-Magento-Tags)

Magento gắn cache tags vào response header. Varnish dùng tags này để invalidate cache theo nhóm.

```
X-Magento-Tags: cat_p,cat_p_1,cat_p_2,cat_c,cat_c_3,store,cms_b,cms_b_1
```

| Tag prefix | Ý nghĩa |
|-----------|---------|
| `cat_p` | Catalog product |
| `cat_p_<id>` | Product cụ thể |
| `cat_c` | Catalog category |
| `cat_c_<id>` | Category cụ thể |
| `cms_b` | CMS block |
| `cms_b_<id>` | CMS block cụ thể |
| `cms_p` | CMS page |
| `store` | Store config |

---

## 2. Varnish — cấu hình và purge

### Cấu hình Varnish hosts

```bash
# Cấu hình Varnish host
bin/magento setup:config:set --http-cache-hosts=192.0.2.100,192.0.2.155:6081

# Lấy VCL config từ Magento
bin/magento varnish:vcl:generate --export-version=6 > /etc/varnish/magento.vcl
```

### Purge cache

```bash
# Purge qua Admin: System > Cache Management > Flush Magento Cache
# Purge qua CLI
bin/magento cache:clean full_page

# Purge tất cả Varnish cache
bin/magento cache:flush
```

### VCL cơ bản cho Magento 2

```vcl
vcl 4.0;

import std;

backend default {
    .host = "127.0.0.1";
    .port = "8080";
    .first_byte_timeout = 600s;
    .probe = {
        .url = "/pub/health_check.php";
        .timeout = 2s;
        .interval = 5s;
        .window = 10;
        .threshold = 5;
    }
}

# ACL cho phép purge từ Magento server
acl purge {
    "localhost";
    "127.0.0.1";
    "::1";
}

sub vcl_recv {
    # Xử lý PURGE request từ Magento
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Method not allowed"));
        }
        # Purge theo X-Magento-Tags-Pattern header
        if (req.http.X-Magento-Tags-Pattern) {
            ban("obj.http.X-Magento-Tags ~ " + req.http.X-Magento-Tags-Pattern);
        }
        return (synth(200, "Purged"));
    }

    # Không cache admin pages
    if (req.url ~ "^/admin") {
        return (pass);
    }

    # Không cache khi có session cookie (logged in user)
    # Magento dùng private_content_version cookie thay vì session
    if (req.http.cookie ~ "PHPSESSID") {
        # Vẫn cache nhưng vary theo cookie
    }

    # Strip marketing params để tăng cache hit rate
    if (req.url ~ "(\?|&)(utm_source|utm_medium|utm_campaign|gclid|fbclid)=") {
        set req.url = regsuball(req.url, "&(utm_source|utm_medium|utm_campaign|gclid|fbclid)=[^&]+", "");
        set req.url = regsuball(req.url, "\?(utm_source|utm_medium|utm_campaign|gclid|fbclid)=[^&]+&?", "?");
        set req.url = regsub(req.url, "\?$", "");
    }
}

sub vcl_backend_response {
    # Cache 404 pages ngắn hơn
    if (beresp.status == 404) {
        set beresp.ttl = 30s;
    }

    # Không cache nếu Magento set no-cache
    if (beresp.http.Cache-Control ~ "no-cache") {
        set beresp.uncacheable = true;
        return (deliver);
    }
}

sub vcl_deliver {
    # Xóa X-Magento-Tags khỏi response gửi đến client
    unset resp.http.X-Magento-Tags;
    unset resp.http.X-Powered-By;

    # Debug header (chỉ dùng trong development)
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
}
```

---

## 3. Private Content — hole punching

Private content là dữ liệu riêng của từng user (cart, wishlist, customer name...). Không được cache server-side.

### Cơ chế hoạt động

```
1. Magento serve cached HTML (không có private data)
2. Browser nhận HTML với KO placeholders
3. JS gửi AJAX request đến /customer/section/load
4. Server trả về private data (JSON)
5. KO binding điền data vào placeholders
```

### Tạo custom private content section

**1. Section source class**

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\CustomerData;

use Magento\Customer\CustomerData\SectionSourceInterface;
use Magento\Customer\Model\Session;

class CustomSection implements SectionSourceInterface
{
    public function __construct(
        private readonly Session $customerSession
    ) {}

    /**
     * @return array
     */
    public function getSectionData(): array
    {
        if (!$this->customerSession->isLoggedIn()) {
            return ['items' => [], 'count' => 0];
        }

        return [
            'items' => $this->getCustomItems(),
            'count' => count($this->getCustomItems()),
        ];
    }

    private function getCustomItems(): array
    {
        // Lấy data từ DB/session
        return [];
    }
}
```

**2. Đăng ký section trong di.xml**

```xml
<type name="Magento\Customer\CustomerData\SectionPoolInterface">
    <arguments>
        <argument name="sectionSourceMap" xsi:type="array">
            <item name="vendor-custom" xsi:type="string">
                Vendor\Module\CustomerData\CustomSection
            </item>
        </argument>
    </arguments>
</type>
```

**3. Khai báo invalidation trong sections.xml**

```xml
<!-- etc/frontend/sections.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Customer:etc/sections.xsd">
    <!-- Invalidate section khi user thực hiện action này -->
    <action name="vendor_module/custom/add">
        <section name="vendor-custom"/>
    </action>
    <action name="vendor_module/custom/remove">
        <section name="vendor-custom"/>
    </action>
    <!-- Invalidate tất cả sections -->
    <action name="vendor_module/custom/clear">
        <section name="*"/>
    </action>
</config>
```

**4. Template với KO binding**

```html
<!-- Template phtml — không có private data, chỉ có placeholder -->
<div data-bind="scope: 'vendorCustomSection'">
    <span data-bind="text: count()"></span> items
    <!-- ko foreach: items -->
    <div data-bind="text: name"></div>
    <!-- /ko -->
</div>

<script type="text/x-magento-init">
{
    "[data-bind='scope: vendorCustomSection']": {
        "Magento_Ui/js/core/app": {
            "components": {
                "vendorCustomSection": {
                    "component": "Vendor_Module/js/view/custom-section"
                }
            }
        }
    }
}
</script>
```

**5. JS component**

```javascript
// Vendor_Module/view/frontend/web/js/view/custom-section.js
define([
    'uiComponent',
    'Magento_Customer/js/customer-data'
], function (Component, customerData) {
    'use strict';

    return Component.extend({
        initialize: function () {
            this._super();
            // Lấy section data từ customer-data (local storage)
            var sectionData = customerData.get('vendor-custom');
            this.count = sectionData.map(function (data) {
                return data.count || 0;
            });
            this.items = sectionData.map(function (data) {
                return data.items || [];
            });
            return this;
        }
    });
});
```

---

## 4. Cache context — page variations

Magento tạo cache variations dựa trên context (customer group, store, currency...).

```php
// Trong Block class — khai báo cache context
public function getCacheKeyInfo(): array
{
    return [
        'VENDOR_MODULE_CUSTOM_BLOCK',
        $this->_storeManager->getStore()->getId(),
        $this->customerSession->getCustomerGroupId(),
        // Thêm context khác nếu cần
    ];
}

// Hoặc dùng IdentityInterface để invalidate theo entity
public function getIdentities(): array
{
    return [
        \Magento\Catalog\Model\Product::CACHE_TAG . '_' . $this->getProductId()
    ];
}
```

---

## 5. Disable cache cho block cụ thể

```xml
<!-- Layout XML — cacheable=false cho toàn trang (KHÔNG khuyến nghị) -->
<block class="Vendor\Module\Block\MyBlock"
       name="vendor.module.block"
       cacheable="false" />
```

> **Cảnh báo:** `cacheable="false"` trên bất kỳ block nào trong layout sẽ disable FPC cho **toàn bộ trang**. Chỉ dùng khi thực sự cần thiết. Thay vào đó, dùng private content pattern.

---

## Liên kết

- Cache management: xem [cache-management.md](./cache-management.md)
- Redis: xem [redis.md](./redis.md)
- Performance: xem [performance.md](./performance.md)
