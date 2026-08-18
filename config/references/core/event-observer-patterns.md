# Tham khảo: Event/Observer Patterns (Thực chiến)

Nguồn:
- https://developer.adobe.com/commerce/php/development/components/events-and-observers/ — đã refactor theo constitution
- https://magento.stackexchange.com/questions/327132 — sales_order_place_after
- https://magento.stackexchange.com/questions/263683 — observer debugging

---

## 1. Observer chuẩn

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Psr\Log\LoggerInterface;

class OrderPlaceAfterObserver implements ObserverInterface
{
    public function __construct(
        private readonly LoggerInterface $logger
    ) {}

    public function execute(Observer $observer): void
    {
        /** @var \Magento\Sales\Model\Order $order */
        $order = $observer->getEvent()->getOrder();

        if ($order === null) {
            return;
        }

        $this->logger->info('Order placed', [
            'order_id' => $order->getId(),
            'increment_id' => $order->getIncrementId(),
            'customer_id' => $order->getCustomerId(),
            'grand_total' => $order->getGrandTotal(),
        ]);
    }
}
```

---

## 2. sales_order_place_after — data available

**Event:** `sales_order_place_after`
**Area:** `frontend`, `webapi_rest`
**Dispatch:** Sau khi order được tạo và lưu vào DB

### Data available

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Sales\Model\Order $order */
    $order = $observer->getEvent()->getOrder();

    // Order data
    $orderId = $order->getId();                    // int
    $incrementId = $order->getIncrementId();       // string "000000001"
    $status = $order->getStatus();                 // 'pending', 'processing'...
    $state = $order->getState();                   // 'new', 'processing'...
    $grandTotal = $order->getGrandTotal();         // float
    $customerId = $order->getCustomerId();         // int|null (null nếu guest)
    $customerEmail = $order->getCustomerEmail();   // string
    $storeId = $order->getStoreId();               // int

    // Items
    foreach ($order->getAllItems() as $item) {
        $sku = $item->getSku();
        $qty = $item->getQtyOrdered();
        $price = $item->getPrice();
    }

    // Shipping address
    $shippingAddress = $order->getShippingAddress();
    if ($shippingAddress) {
        $city = $shippingAddress->getCity();
        $country = $shippingAddress->getCountryId();
    }

    // Payment
    $payment = $order->getPayment();
    $paymentMethod = $payment->getMethod();
}
```

### events.xml

```xml
<!-- etc/frontend/events.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_order_place_after">
        <observer name="vendor_module_order_place_after"
                  instance="Vendor\Module\Observer\OrderPlaceAfterObserver" />
    </event>
</config>
```

---

## 3. catalog_product_save_after — product save hook, reindex trigger

**Event:** `catalog_product_save_after`
**Area:** `adminhtml`, `global`

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Catalog\Model\Product $product */
    $product = $observer->getEvent()->getProduct();

    $productId = $product->getId();
    $sku = $product->getSku();
    $typeId = $product->getTypeId();

    // Kiểm tra data thay đổi
    $origData = $product->getOrigData();
    $newStatus = $product->getStatus();
    $oldStatus = $origData['status'] ?? null;

    if ($newStatus !== $oldStatus) {
        // Status thay đổi — trigger custom logic
        $this->handleStatusChange($product, (int)$oldStatus, (int)$newStatus);
    }

    // Trigger reindex thủ công nếu cần
    // (Magento tự reindex sau save, chỉ cần khi có custom index)
}
```

---

## 4. customer_login — session data, redirect logic

**Event:** `customer_login`
**Area:** `frontend`

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Customer\Model\Customer $customer */
    $customer = $observer->getEvent()->getCustomer();

    $customerId = $customer->getId();
    $email = $customer->getEmail();
    $groupId = $customer->getGroupId();

    // Lấy session
    // Không inject CustomerSession trong observer — dùng event data
    // Session đã được set trước khi event dispatch

    // Log login
    $this->logger->info('Customer logged in', [
        'customer_id' => $customerId,
        'email' => $email,
    ]);
}
```

---

## 5. checkout_cart_add_product_complete — cart modification

**Event:** `checkout_cart_add_product_complete`
**Area:** `frontend`

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Catalog\Model\Product $product */
    $product = $observer->getEvent()->getProduct();

    /** @var \Magento\Framework\App\RequestInterface $request */
    $request = $observer->getEvent()->getRequest();

    $productId = $product->getId();
    $qty = $request->getParam('qty', 1);

    // Không thể modify cart ở đây — event đã xong
    // Dùng để: log, analytics, notification
}
```

---

## 6. controller_action_predispatch — request intercept, redirect

**Event:** `controller_action_predispatch`
**Area:** `frontend`, `adminhtml`

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Framework\App\Action\Action $controller */
    $controller = $observer->getEvent()->getControllerAction();

    $request = $controller->getRequest();
    $moduleName = $request->getModuleName();
    $actionName = $request->getActionName();

    // Redirect nếu cần
    if ($this->shouldRedirect($moduleName, $actionName)) {
        $response = $controller->getResponse();
        $response->setRedirect('/new-url');
        $request->setDispatched(true); // Ngăn controller execute
    }
}
```

---

## 7. layout_generate_blocks_after — dynamic block injection

**Event:** `layout_generate_blocks_after`
**Area:** `frontend`, `adminhtml`

```php
public function execute(Observer $observer): void
{
    /** @var \Magento\Framework\View\Layout $layout */
    $layout = $observer->getEvent()->getLayout();

    // Thêm block động vào layout
    $block = $layout->createBlock(
        \Vendor\Module\Block\CustomBlock::class,
        'vendor.module.custom.block'
    );

    $layout->setChild('content', 'vendor.module.custom.block', 'vendor_custom');
}
```

> **Lưu ý:** Ưu tiên dùng layout XML thay vì observer cho việc thêm block. Observer chỉ dùng khi cần logic động phức tạp.

---

## 8. clean_cache_by_tags — custom cache invalidation

**Event:** `clean_cache_by_tags`
**Area:** `global`

```php
public function execute(Observer $observer): void
{
    $object = $observer->getEvent()->getObject();

    // Thêm custom cache tags để invalidate
    if ($object instanceof \Vendor\Module\Model\CustomEntity) {
        $tags = $object->getIdentities();
        // Magento sẽ invalidate cache với các tags này
    }
}
```

---

## 9. Custom event dispatch — best practices

### Dispatch event

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Framework\Event\ManagerInterface;

class OrderService
{
    public function __construct(
        private readonly ManagerInterface $eventManager
    ) {}

    public function processOrder(array $orderData): void
    {
        // Logic xử lý order...

        // Dispatch event sau khi xử lý xong
        $this->eventManager->dispatch(
            'vendor_module_order_processed',  // snake_case, lowercase
            [
                'order_data' => $orderData,
                'processed_at' => date('Y-m-d H:i:s'),
            ]
        );
    }
}
```

### Naming convention

```
<vendor>_<module>_<entity>_<action>

Ví dụ:
vendor_module_order_processed
vendor_module_product_imported
vendor_module_customer_registered
```

### Observer nhận custom event

```php
public function execute(Observer $observer): void
{
    $orderData = $observer->getEvent()->getOrderData();
    $processedAt = $observer->getEvent()->getProcessedAt();
    // getData() cũng hoạt động
    $orderData = $observer->getEvent()->getData('order_data');
}
```

---

## 10. Observer gửi email sau order place

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Mail\Template\TransportBuilder;
use Magento\Framework\Translate\Inline\StateInterface;
use Psr\Log\LoggerInterface;

class SendOrderNotificationObserver implements ObserverInterface
{
    public function __construct(
        private readonly TransportBuilder $transportBuilder,
        private readonly StateInterface $inlineTranslation,
        private readonly LoggerInterface $logger
    ) {}

    public function execute(Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();

        if ($order === null) {
            return;
        }

        try {
            $this->inlineTranslation->suspend();

            $transport = $this->transportBuilder
                ->setTemplateIdentifier('vendor_module_order_notification')
                ->setTemplateOptions([
                    'area' => \Magento\Framework\App\Area::AREA_FRONTEND,
                    'store' => $order->getStoreId(),
                ])
                ->setTemplateVars([
                    'order' => $order,
                    'order_id' => $order->getIncrementId(),
                ])
                ->setFromByScope('sales')
                ->addTo($order->getCustomerEmail(), $order->getCustomerName())
                ->getTransport();

            $transport->sendMessage();
        } catch (\Exception $e) {
            $this->logger->error('Failed to send order notification: ' . $e->getMessage(), [
                'order_id' => $order->getId(),
            ]);
        } finally {
            $this->inlineTranslation->resume();
        }
    }
}
```

---

## 11. Observer sync data sang external API

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Vendor\Module\Service\ExternalApiService;
use Psr\Log\LoggerInterface;

class SyncOrderToExternalApiObserver implements ObserverInterface
{
    public function __construct(
        private readonly ExternalApiService $apiService,
        private readonly LoggerInterface $logger
    ) {}

    public function execute(Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();

        if ($order === null) {
            return;
        }

        try {
            // Sync bất đồng bộ qua message queue (khuyến nghị)
            // Không gọi API trực tiếp trong observer — ảnh hưởng checkout performance
            $this->apiService->queueOrderSync($order->getId());
        } catch (\Exception $e) {
            // Log nhưng không throw — không muốn block checkout
            $this->logger->error('Failed to queue order sync: ' . $e->getMessage(), [
                'order_id' => $order->getId(),
            ]);
        }
    }
}
```

> **Best practice:** Không gọi external API trực tiếp trong observer. Dùng message queue để xử lý bất đồng bộ, tránh ảnh hưởng performance của checkout.

---

## Liên kết

- Events & Observers cơ bản: xem [events-observers.md](./events-observers.md)
- Message Queue: xem [../network/message-queues.md](../network/message-queues.md)
- Plugin patterns: xem [plugin-patterns.md](./plugin-patterns.md)
