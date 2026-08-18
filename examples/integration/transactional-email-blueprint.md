# Blueprint: Transactional Email

> Blueprint đầy đủ cho gửi transactional email từ custom module.
> Nguồn: https://webkul.com/blog/magento-2-send-transactional-email-programmatically-in-your-custom-module/

---

## Cấu trúc module

```
Vendor/Module/
├── etc/
│   ├── module.xml
│   ├── email_templates.xml
│   └── adminhtml/
│       └── system.xml          # field chọn email template
├── Model/
│   └── Email/
│       └── Sender.php          # service gửi email
└── view/
    └── frontend/
        └── email/
            └── my_notification.html
```

---

## `etc/email_templates.xml` — đăng ký template

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Email:etc/email_templates.xsd">
    <template id="vendor_module_my_notification"
              label="My Custom Notification"
              file="my_notification.html"
              type="html"
              module="Vendor_Module"
              area="frontend"/>
</config>
```

**Lưu ý:**
- `id` phải khớp với config path trong `system.xml` (thay `/` bằng `_`)
- `file` là tên file trong `view/<area>/email/`
- `area` có thể là `frontend` hoặc `adminhtml`

---

## `etc/adminhtml/system.xml` — field chọn template

```xml
<field id="my_notification_template" translate="label" type="select"
       sortOrder="10" showInDefault="1" showInWebsite="1" showInStore="1">
    <label>My Notification Email Template</label>
    <source_model>Magento\Config\Model\Config\Source\Email\Template</source_model>
    <!-- source_model này tự động list tất cả email templates -->
</field>
```

Config path sẽ là: `vendor_module/email/my_notification_template`

---

## `view/frontend/email/my_notification.html` — template file

```html
<!--@subject {{trans "Your notification from %store_name" store_name=$store.getFrontendName()}} @-->
<!--@vars {
"var order.increment_id":"Order ID",
"var customer_name":"Customer Name",
"var store.getFrontendName()":"Store Name"
} @-->

{{template config_path="design/email/header_template"}}

<table>
    <tr class="email-intro">
        <td>
            <p class="greeting">
                {{trans "Hello %customer_name," customer_name=$customer_name}}
            </p>
            <p>
                {{trans "Thank you for your order #%order_id." order_id=$order.increment_id}}
            </p>
        </td>
    </tr>
    <tr class="email-summary">
        <td>
            <h1>
                {{trans 'Order <span class="no-link">#%increment_id</span>'
                    increment_id=$order.increment_id |raw}}
            </h1>
        </td>
    </tr>
    <tr class="email-information">
        <td>
            <p>{{var custom_message|raw}}</p>
        </td>
    </tr>
</table>

{{template config_path="design/email/footer_template"}}
```

**Cú pháp template:**
- `{{trans "text"}}` — dịch text
- `{{var variable_name}}` — output biến
- `{{var variable_name|raw}}` — output HTML không escape
- `{{template config_path="..."}}` — include template khác

---

## `Model/Email/Sender.php` — Email Sender Service

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Email;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Mail\Template\TransportBuilder;
use Magento\Framework\Translate\Inline\StateInterface;
use Magento\Store\Model\ScopeInterface;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;

class Sender
{
    private const XML_PATH_EMAIL_TEMPLATE = 'vendor_module/email/my_notification_template';
    private const XML_PATH_EMAIL_SENDER = 'trans_email/ident_general/email';
    private const XML_PATH_EMAIL_SENDER_NAME = 'trans_email/ident_general/name';

    public function __construct(
        private readonly TransportBuilder $transportBuilder,
        private readonly StateInterface $inlineTranslation,
        private readonly ScopeConfigInterface $scopeConfig,
        private readonly StoreManagerInterface $storeManager,
        private readonly LoggerInterface $logger
    ) {}

    /**
     * Gửi notification email
     *
     * @param string $recipientEmail
     * @param string $recipientName
     * @param array<string, mixed> $templateVars
     * @param int|null $storeId
     * @throws LocalizedException
     */
    public function send(
        string $recipientEmail,
        string $recipientName,
        array $templateVars,
        ?int $storeId = null
    ): void {
        try {
            $storeId = $storeId ?? (int) $this->storeManager->getStore()->getId();

            $templateId = $this->scopeConfig->getValue(
                self::XML_PATH_EMAIL_TEMPLATE,
                ScopeInterface::SCOPE_STORE,
                $storeId
            );

            $senderEmail = $this->scopeConfig->getValue(
                self::XML_PATH_EMAIL_SENDER,
                ScopeInterface::SCOPE_STORE,
                $storeId
            );

            $senderName = $this->scopeConfig->getValue(
                self::XML_PATH_EMAIL_SENDER_NAME,
                ScopeInterface::SCOPE_STORE,
                $storeId
            );

            $this->inlineTranslation->suspend();

            $transport = $this->transportBuilder
                ->setTemplateIdentifier($templateId)
                ->setTemplateOptions([
                    'area' => \Magento\Framework\App\Area::AREA_FRONTEND,
                    'store' => $storeId,
                ])
                ->setTemplateVars($templateVars)
                ->setFromByScope(
                    ['email' => $senderEmail, 'name' => $senderName],
                    $storeId
                )
                ->addTo($recipientEmail, $recipientName)
                ->getTransport();

            $transport->sendMessage();
        } catch (\Exception $e) {
            $this->logger->error(
                'Failed to send notification email: ' . $e->getMessage(),
                ['exception' => $e]
            );
            throw new LocalizedException(__('Unable to send notification email.'));
        } finally {
            $this->inlineTranslation->resume();
        }
    }
}
```

---

## Cách dùng Sender trong service/observer

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Vendor\Module\Model\Email\Sender;

class SendNotificationObserver implements ObserverInterface
{
    public function __construct(
        private readonly Sender $emailSender
    ) {}

    public function execute(Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();

        $this->emailSender->send(
            recipientEmail: $order->getCustomerEmail(),
            recipientName: $order->getCustomerFirstname() . ' ' . $order->getCustomerLastname(),
            templateVars: [
                'order' => $order,
                'customer_name' => $order->getCustomerFirstname(),
                'custom_message' => __('Your order has been processed.'),
            ],
            storeId: (int) $order->getStoreId()
        );
    }
}
```

---

## Gửi email với CC/BCC

```php
$transport = $this->transportBuilder
    ->setTemplateIdentifier($templateId)
    ->setTemplateOptions(['area' => 'frontend', 'store' => $storeId])
    ->setTemplateVars($templateVars)
    ->setFromByScope(['email' => $senderEmail, 'name' => $senderName], $storeId)
    ->addTo($recipientEmail, $recipientName)
    ->addCc('cc@example.com', 'CC Name')
    ->addBcc('bcc@example.com')
    ->getTransport();
```

---

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento cache:clean
```

1. Admin > Marketing > Communications > Email Templates → kiểm tra template mới xuất hiện
2. Admin > Stores > Configuration → kiểm tra field chọn template
3. Trigger event/action → kiểm tra email được gửi
4. Kiểm tra log nếu có lỗi: `var/log/system.log`

---

## Liên kết

- Patterns: [config/magento-patterns.md](../../config/magento-patterns.md)
- Events/Observers: [config/references/core/events-observers.md](../../config/references/core/events-observers.md)
