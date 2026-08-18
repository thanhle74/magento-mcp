# Order Management nâng cao trong Magento 2

Nguồn:
- [Order Management Interface](https://developer.adobe.com/commerce/php/module-reference/module-sales/) — developer.adobe.com
- [Magento StackExchange: cancel order programmatically](https://magento.stackexchange.com/questions/115272/programatically-cancel-the-order-using-order-id-magento-2) — stackexchange.com
- [Cancel Order Programmatically](https://bsscommerce.com/blog/magento-2-cancel-order-programmatically/) — bsscommerce.com — đã refactor theo constitution

---

## 1. OrderManagementInterface

`Magento\Sales\Api\OrderManagementInterface` là service contract chính để quản lý order:

```php
interface OrderManagementInterface
{
    public function cancel(int $id): bool;
    public function hold(int $id): bool;
    public function unHold(int $id): bool;
    public function place(OrderInterface $order): OrderInterface;
    public function notify(int $id): bool;
    public function getStatus(int $id): string;
    public function getCommentsList(int $id): OrderStatusHistorySearchResultInterface;
    public function addComment(int $id, OrderStatusHistoryInterface $statusHistory): bool;
}
```

---

## 2. Hold / Unhold Order

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Sales\Api\OrderManagementInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Framework\Exception\LocalizedException;
use Psr\Log\LoggerInterface;

class OrderHoldService
{
    public function __construct(
        private readonly OrderManagementInterface $orderManagement,
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly LoggerInterface $logger
    ) {}

    public function holdOrder(int $orderId): bool
    {
        try {
            $order = $this->orderRepository->get($orderId);

            if (!$order->canHold()) {
                throw new LocalizedException(__('Order #%1 cannot be held.', $order->getIncrementId()));
            }

            return $this->orderManagement->hold($orderId);
        } catch (LocalizedException $e) {
            $this->logger->error('Hold order failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function unholdOrder(int $orderId): bool
    {
        try {
            $order = $this->orderRepository->get($orderId);

            if (!$order->canUnhold()) {
                throw new LocalizedException(__('Order #%1 is not on hold.', $order->getIncrementId()));
            }

            return $this->orderManagement->unHold($orderId);
        } catch (LocalizedException $e) {
            $this->logger->error('Unhold order failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
```

**Lưu ý quan trọng:** Phải dùng `OrderManagementInterface::hold()` thay vì set state trực tiếp. Set state trực tiếp (`$order->setState('holded')`) sẽ không cập nhật đúng `sales_order_grid` và gây lỗi "order was not on hold" khi unhold từ Admin.

---

## 3. Cancel Order

```php
public function cancelOrder(int $orderId): bool
{
    $order = $this->orderRepository->get($orderId);

    if (!$order->canCancel()) {
        throw new LocalizedException(
            __('Order #%1 cannot be cancelled. Current state: %2', 
               $order->getIncrementId(), 
               $order->getState())
        );
    }

    return $this->orderManagement->cancel($orderId);
}
```

**Các state có thể cancel:** `new`, `pending_payment`, `payment_review`, `holded` (sau khi unhold).
**Không thể cancel:** `complete`, `closed`, `canceled`.

---

## 4. Reorder

Reorder tạo quote mới từ order cũ:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Reorder\Reorder;

class ReorderService
{
    public function __construct(
        private readonly Reorder $reorder,
        private readonly OrderRepositoryInterface $orderRepository
    ) {}

    public function reorder(string $orderIncrementId, int $storeId): array
    {
        // Reorder trả về array với 'cart' và 'userInputErrors'
        $result = $this->reorder->execute($orderIncrementId, $storeId);

        return [
            'cart'   => $result->getCart(),
            'errors' => $result->getErrors(),
        ];
    }
}
```

---

## 5. Partial Invoice (Invoice một phần)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Service\InvoiceService;
use Magento\Framework\DB\Transaction;

class PartialInvoiceService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly InvoiceService $invoiceService,
        private readonly Transaction $transaction
    ) {}

    /**
     * @param int $orderId
     * @param array<int, float> $qtys [orderItemId => qty]
     */
    public function createPartialInvoice(int $orderId, array $qtys): void
    {
        $order = $this->orderRepository->get($orderId);

        if (!$order->canInvoice()) {
            throw new \Magento\Framework\Exception\LocalizedException(
                __('Order #%1 cannot be invoiced.', $order->getIncrementId())
            );
        }

        $invoice = $this->invoiceService->prepareInvoice($order, $qtys);
        $invoice->setRequestedCaptureCase(\Magento\Sales\Model\Order\Invoice::CAPTURE_ONLINE);
        $invoice->register();

        $this->transaction
            ->addObject($invoice)
            ->addObject($invoice->getOrder())
            ->save();
    }
}
```

---

## 6. Partial Shipment (Giao hàng một phần)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\ShipmentRepositoryInterface;
use Magento\Sales\Model\Order\ShipmentFactory;

class PartialShipmentService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly ShipmentFactory $shipmentFactory,
        private readonly ShipmentRepositoryInterface $shipmentRepository
    ) {}

    /**
     * @param int $orderId
     * @param array<int, float> $qtys [orderItemId => qty]
     * @param array<array{carrier_code: string, title: string, number: string}> $tracks
     */
    public function createPartialShipment(int $orderId, array $qtys, array $tracks = []): void
    {
        $order = $this->orderRepository->get($orderId);

        if (!$order->canShip()) {
            throw new \Magento\Framework\Exception\LocalizedException(
                __('Order #%1 cannot be shipped.', $order->getIncrementId())
            );
        }

        $shipment = $this->shipmentFactory->create($order, $qtys, $tracks);
        $shipment->register();

        $this->shipmentRepository->save($shipment);
        $this->orderRepository->save($order);
    }
}
```

---

## 7. Add Order Comment

```php
use Magento\Sales\Api\OrderManagementInterface;
use Magento\Sales\Api\Data\OrderStatusHistoryInterfaceFactory;

public function addComment(int $orderId, string $comment, bool $visibleToCustomer = false): void
{
    $history = $this->historyFactory->create();
    $history->setComment($comment);
    $history->setIsVisibleOnFront($visibleToCustomer ? 1 : 0);
    $history->setIsCustomerNotified($visibleToCustomer ? 1 : 0);

    $this->orderManagement->addComment($orderId, $history);
}
```

---

## 8. Custom Order Status

Tạo custom status và gán vào state:

```php
// Data Patch để tạo custom status
<?php
declare(strict_types=1);

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Sales\Model\Order\StatusFactory;
use Magento\Sales\Model\ResourceModel\Order\Status as StatusResource;

class AddCustomOrderStatus implements DataPatchInterface
{
    public function __construct(
        private readonly StatusFactory $statusFactory,
        private readonly StatusResource $statusResource
    ) {}

    public function apply(): self
    {
        $status = $this->statusFactory->create();
        $status->setData([
            'status' => 'vendor_processing',
            'label'  => 'Vendor Processing',
        ]);
        $this->statusResource->save($status);

        // Gán status vào state 'processing'
        $status->assignState('processing', false, true);

        return $this;
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

---

## 9. Kiểm tra trạng thái order

```php
use Magento\Sales\Model\Order;

// Các state constants
Order::STATE_NEW              // 'new'
Order::STATE_PENDING_PAYMENT  // 'pending_payment'
Order::STATE_PROCESSING       // 'processing'
Order::STATE_COMPLETE         // 'complete'
Order::STATE_CLOSED           // 'closed'
Order::STATE_CANCELED         // 'canceled'
Order::STATE_HOLDED           // 'holded'
Order::STATE_PAYMENT_REVIEW   // 'payment_review'

// Kiểm tra khả năng thực hiện action
$order->canCancel()
$order->canHold()
$order->canUnhold()
$order->canInvoice()
$order->canShip()
$order->canCreditmemo()
$order->canReorder()
```

---

## Liên kết

- Order Lifecycle: xem [order-lifecycle.md](./order-lifecycle.md)
- Quote Totals: xem [quote-totals.md](./quote-totals.md)
- Service Contracts: xem [../core/service-contracts.md](../core/service-contracts.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
