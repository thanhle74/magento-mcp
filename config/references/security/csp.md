# Tham khảo: Content Security Policy (CSP)

Nguồn: https://developer.adobe.com/commerce/php/development/security/content-security-policies/

---

## 0. Tổng quan

CSP (Content Security Policy) là cơ chế bảo mật giúp ngăn XSS, card skimmer, session hijacking, clickjacking. Magento hỗ trợ CSP từ 2.3.5 qua module `Magento_Csp`.

**Từ 2.4.7:** Payment pages mặc định ở `restrict` mode; các trang khác ở `report-only` mode.
**Trước 2.4.7:** Tất cả trang ở `report-only` mode.

---

## 1. Hai chế độ hoạt động

| Mode | Hành vi |
|---|---|
| `report-only` | Ghi log vi phạm vào browser console (hoặc endpoint), không block |
| `restrict` | Block tài nguyên vi phạm policy |

Cấu hình trong `etc/config.xml` của module:

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Store:etc/config.xsd">
    <default>
        <csp>
            <mode>
                <storefront>
                    <report_only>0</report_only><!-- 0 = restrict, 1 = report-only -->
                </storefront>
                <admin>
                    <report_only>0</report_only>
                </admin>
            </mode>
        </csp>
    </default>
</config>
```

---

## 2. Whitelist domain (`csp_whitelist.xml`)

Đặt tại `etc/csp_whitelist.xml` trong module. Chỉ whitelist domain thực sự cần thiết cho module đó.

```xml
<?xml version="1.0"?>
<csp_whitelist xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Csp:etc/csp_whitelist.xsd">
    <policies>
        <policy id="script-src">
            <values>
                <value id="my-cdn" type="host">https://cdn.example.com</value>
            </values>
        </policy>
        <policy id="connect-src">
            <values>
                <value id="my-api" type="host">https://api.example.com</value>
            </values>
        </policy>
        <policy id="img-src">
            <values>
                <value id="my-images" type="host">https://images.example.com</value>
            </values>
        </policy>
    </policies>
</csp_whitelist>
```

**Các policy type phổ biến:**

| Policy | Kiểm soát |
|---|---|
| `script-src` | JavaScript files và inline scripts |
| `style-src` | CSS files và inline styles |
| `img-src` | Images |
| `connect-src` | AJAX, fetch, WebSocket |
| `font-src` | Web fonts |
| `frame-src` | `<iframe>` sources |
| `form-action` | Form submission targets |
| `default-src` | Fallback cho tất cả |

---

## 3. Whitelist inline script/style bằng hash

Khi không thể dùng external file, whitelist inline content bằng SHA-256 hash:

```php
// Tính hash của nội dung inline
$content = "console.log('my script');";
$whitelistHash = base64_encode(hash('sha256', $content, true));
```

Thêm vào `csp_whitelist.xml`:

```xml
<policy id="script-src">
    <values>
        <value id="my-inline-hash" type="hash" algorithm="sha256">B4yPHKaXnvFWtRChIbabYmUBFZdVfKKXHbWtWidDVF8=</value>
    </values>
</policy>
```

---

## 4. CSP Nonce Provider (2.4.7+)

Nonce là chuỗi ngẫu nhiên unique mỗi request, cho phép inline script cụ thể chạy mà không cần hash.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Block;

use Magento\Csp\Helper\CspNonceProvider;
use Magento\Framework\View\Element\Template;

class MyBlock extends Template
{
    public function __construct(
        Template\Context $context,
        private readonly CspNonceProvider $cspNonceProvider,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getNonce(): string
    {
        return $this->cspNonceProvider->generateNonce();
    }
}
```

Dùng trong phtml:

```html
<script nonce="<?= $escaper->escapeHtmlAttr($block->getNonce()) ?>">
    // inline script được phép
</script>
```

---

## 5. SecureHtmlRenderer — render inline script/style an toàn

Thay vì viết `<script>` trực tiếp trong phtml (bị block khi `unsafe-inline` disabled), dùng `$secureRenderer`:

```php
<!-- ❌ Cũ — bị block khi restrict mode -->
<div onclick="alert('click')">Click me</div>

<!-- ✅ Mới — dùng SecureHtmlRenderer -->
<div id="my-div">Click me</div>
<?= $secureRenderer->renderEventListenerAsTag('onclick', 'alert("click");', '#my-div'); ?>
```

```php
<!-- Inline style -->
<!-- ❌ Cũ -->
<div style="color:blue">Text</div>

<!-- ✅ Mới -->
<div id="blue-text">Text</div>
<?= $secureRenderer->renderStyleAsTag('color: blue', '#blue-text'); ?>
```

```php
<!-- Inline script block -->
<?= $secureRenderer->renderTag('script', ['type' => 'text/javascript'], "\nconsole.log('safe');\n", false); ?>
```

---

## 6. Page-specific CSP

Cấu hình CSP riêng cho từng trang trong `etc/config.xml`:

```xml
<default>
    <csp>
        <mode>
            <!-- Key = area_routeId_controllerName_actionName -->
            <storefront_checkout_index_index>
                <report_only>0</report_only>
            </storefront_checkout_index_index>
        </mode>
    </csp>
</default>
```

Hoặc implement `CspAwareActionInterface` trong controller:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Controller\Index;

use Magento\Csp\Api\CspAwareActionInterface;
use Magento\Csp\Model\Policy\FetchPolicy;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\View\Result\PageFactory;

class Index implements HttpGetActionInterface, CspAwareActionInterface
{
    public function __construct(
        private readonly PageFactory $pageFactory
    ) {}

    public function execute(): \Magento\Framework\View\Result\Page
    {
        return $this->pageFactory->create();
    }

    public function modifyCsp(array $appliedPolicies): array
    {
        $appliedPolicies[] = new FetchPolicy(
            'connect-src',
            false,
            ['https://my-api.example.com'],
            ['https']
        );
        return $appliedPolicies;
    }
}
```

---

## 7. Report-URI — thu thập vi phạm

Cấu hình endpoint nhận báo cáo vi phạm CSP:

```xml
<default>
    <csp>
        <mode>
            <storefront>
                <report_uri>https://csp-collector.example.com/report</report_uri>
            </storefront>
            <admin>
                <report_uri>https://csp-collector.example.com/report-admin</report_uri>
            </admin>
        </mode>
    </csp>
</default>
```

Hoặc cấu hình trong Admin: **Stores > Configuration > Security > Content Security Policy**.

---

## 8. Troubleshooting

**Lỗi phổ biến:**
```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src"
```

**Giải pháp theo thứ tự ưu tiên:**
1. Dùng `SecureHtmlRenderer` thay inline script/style
2. Dùng `CspNonceProvider` (2.4.7+)
3. Whitelist hash trong `csp_whitelist.xml`
4. Whitelist domain nếu script từ external CDN

**Không nên:** Thêm `unsafe-inline` vào `script-src` — vô hiệu hóa toàn bộ bảo vệ CSP.

---

## Liên kết

- Security Best Practices: xem [security-best-practices.md](./security-best-practices.md)
- Payment Gateway (CSP cho payment): xem [payment-gateway.md](./payment-gateway.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
