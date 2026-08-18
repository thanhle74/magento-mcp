# Tham khảo: Order Lifecycle

Nguồn: https://docs.magento-opensource.com/merchant/handle-orders/explanation-understanding-the-order-lifecycle

---

## 1. Order State vs Order Status

> Xem thêm định nghĩa trong [glossary.md](../../glossary.md)

| | State | Status |
|--|-------|--------|
| **Định nghĩa** | Trạng thái kỹ thuật nội bộ, cố định | Nhãn hiển thị, có thể tùy chỉnh |
| **Ai định nghĩa** | Magento core | Admin có thể tạo thêm |
| **Mapping** | 1 state → nhiều status | Nhiều status → 1 state |
| **Dùng trong code** | Filter theo `state` | Hiển thị cho user |

### States cố định của Magento

| State | Mô tả | Status mặc định |
|-------|-------|----------------|
| `new` | Đơn mới, chưa thanh toán | `pending` |
| `pending_payment` | Đang chờ xác nhận thanh toán | `pending_payment` |
| `processing` | Đã thanh toán hoặc đã ship (chưa cả hai) | `processing` |
| `complete` | Đã invoice VÀ đã ship đầy đủ | `complete` |
| `closed` | Đã hoàn tiền (creditmemo) | `closed` |
| `canceled` | Đã hủy | `canceled` |
| `holded` | Đang tạm giữ | `holded` |
| `payment_review` | Đang review thanh toán (fraud check) | `payment_review` |

### Quy tắc filter trong code

```php
// ĐÚNG — dùng state để filter
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('state', \Magento\Sales\Model\Order::STATE_PROCESSING)
    ->create();

// SAI — status có thể khác nhau giữa các store
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 'processing')
    ->create();
```

---

## 2. Order Flow

```
Đặt hàng
    ↓
state: new / status: pending
    ↓ (thanh toán xác nhận)
state: processing / status: processing
    ↓ (tạo invoice)
Invoice created
    ↓ (tạo shipment)
Shipment created
    ↓ (invoice + shipment đầy đủ)
state: complete / status: complete
```

**Nhánh hủy:**
```
state: new/processing → (hủy) → state: canceled
```

**Nhánh hoàn tiền:**
```
state: complete → (creditmemo) → state: closed
```

---

## 3. Invoice (Chứng từ thanh toán)

Invoice xác nhận đã nhận tiền. Tạo invoice chuyển order sang `processing`.

### Tạo Invoice programmatically

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Service\InvoiceService;
use Magento\Framework\DB\Transaction;
use Magento\Sales\Api\InvoiceRepositoryInterface;

class InvoiceCreator
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly InvoiceService $invoiceService,
        private readonly Transaction $transaction,
        private readonly InvoiceRepositoryInterface $invoiceRepository
    ) {
    }

    public function createInvoice(int $orderId): void
    {
        $order = $this->orderRepository->get($orderId);

        if (!$order->canInvoice()) {
            throw new \RuntimeException('Order cannot be invoiced.');
        }

        $invoice = $this->invoiceService->prepareInvoice($order);
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

## 4. Shipment (Chứng từ vận chuyển)

Shipment xác nhận đã giao hàng. Tạo shipment đầy đủ + invoice đầy đủ → order `complete`.

### Tạo Shipment programmatically

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\ShipmentRepositoryInterface;
use Magento\Sales\Model\Order\ShipmentFactory;
use Magento\Sales\Api\Data\ShipmentTrackInterfaceFactory;

class ShipmentCreator
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly ShipmentFactory $shipmentFactory,
        private readonly ShipmentRepositoryInterface $shipmentRepository,
        private readonly ShipmentTrackInterfaceFactory $trackFactory
    ) {
    }

    public function createShipment(int $orderId, string $trackingNumber, string $carrier): void
    {
        $order = $this->orderRepository->get($orderId);

        if (!$order->canShip()) {
            throw new \RuntimeException('Order cannot be shipped.');
        }

        // Chuẩn bị items để ship (tất cả items)
        $shipmentItems = [];
        foreach ($order->getAllItems() as $orderItem) {
            if (!$orderItem->getQtyToShip() || $orderItem->getIsVirtual()) {
                continue;
            }
            $shipmentItems[$orderItem->getId()] = $orderItem->getQtyToShip();
        }

        $shipment = $this->shipmentFactory->create($order, $shipmentItems);
        $shipment->setPackages([]);

        // Thêm tracking
        $track = $this->trackFactory->create();
        $track->setNumber($trackingNumber)
              ->setCarrierCode($carrier)
              ->setTitle($carrier);
        $shipment->addTrack($track);

        $shipment->register();
        $shipment->getOrder()->setIsInProcess(true);

        $this->shipmentRepository->save($shipment);
        $this->orderRepository->save($shipment->getOrder());
    }
}
```

---

## 5. Credit Memo (Phiếu hoàn tiền)

Creditmemo hoàn tiền cho khách. Tạo creditmemo chuyển order sang `closed`.

### Tạo Credit Memo programmatically

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Order\CreditmemoFactory;
use Magento\Sales\Model\Service\CreditmemoService;

class CreditmemoCreator
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly CreditmemoFactory $creditmemoFactory,
        private readonly CreditmemoService $creditmemoService
    ) {
    }

    public function createCreditmemo(int $orderId, bool $returnToStock = true): void
    {
        $order = $this->orderRepository->get($orderId);

        if (!$order->canCreditmemo()) {
            throw new \RuntimeException('Order cannot be refunded.');
        }

        $creditmemo = $this->creditmemoFactory->createByOrder($order, [
            'do_offline' => 1,  // Offline refund (không gọi payment gateway)
        ]);

        $this->creditmemoService->refund($creditmemo, $returnToStock);
    }
}
```

---

## 6. MSI và Order Lifecycle

Với MSI enabled:

| Sự kiện | Tác động MSI |
|---------|-------------|
| Order placed | Tạo Reservation `-qty` (trừ salable qty tạm) |
| Order canceled | Tạo Reservation `+qty` (hoàn lại salable qty) |
| Shipment created | Xóa Reservation + trừ `source_item.quantity` thực tế |
| Creditmemo (return to stock) | Tạo Reservation `+qty` |

---

## 7. Events quan trọng trong Order Lifecycle

| Event | Khi nào |
|-------|---------|
| `sales_order_place_before` | Trước khi đặt hàng |
| `sales_order_place_after` | Sau khi đặt hàng thành công |
| `sales_order_save_after` | Sau khi lưu order (bất kỳ thay đổi nào) |
| `sales_order_invoice_save_after` | Sau khi lưu invoice |
| `sales_order_shipment_save_after` | Sau khi lưu shipment |
| `sales_order_creditmemo_save_after` | Sau khi lưu creditmemo |
| `order_cancel_after` | Sau khi hủy order |

---

## 8. Lấy Order theo increment_id

```php
// ĐÚNG — dùng SearchCriteria
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('increment_id', $incrementId)
    ->create();
$orders = $this->orderRepository->getList($searchCriteria)->getItems();
$order = reset($orders);

// SAI — get() nhận entity_id, không phải increment_id
$order = $this->orderRepository->get($incrementId);
```

---

## Liên kết

- Inventory MSI: xem [../inventory/inventory-msi.md](../inventory/inventory-msi.md)
- Quote Totals: xem [quote-totals.md](./quote-totals.md)
- Glossary: xem [../../glossary.md](../../glossary.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
