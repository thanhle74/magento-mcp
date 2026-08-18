# Async REST API & Bulk Endpoints trong Magento 2

Nguồn:
- [Asynchronous web endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/asynchronous-web-endpoints/) — developer.adobe.com
- [Bulk endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/bulk-endpoints) — developer.adobe.com
- [Bulk operation status endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/operation-status-endpoints/) — developer.adobe.com

---

## 1. Tổng quan

Magento hỗ trợ 2 loại async API:

| Loại | Route (PaaS) | Mô tả |
|------|-------------|-------|
| **Async single** | `/async/V1/<endpoint>` | 1 request → queue → UUID |
| **Async bulk** | `/async/bulk/V1/<endpoint>` | Array requests → queue → UUID |

Cả hai đều:
- Ghi message vào queue (RabbitMQ hoặc MySQL)
- Trả về `bulk_uuid` ngay lập tức
- Xử lý bất đồng bộ bởi consumer `async.operations.all`

---

## 2. Async Single Request

```bash
# Thay đổi giá product bất đồng bộ
PUT https://store.com/rest/default/async/V1/products/24-MB01
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "product": {
    "price": 29
  }
}
```

**Response:**
```json
{
    "bulk_uuid": "fbfca270-7a90-4c4e-9f32-d6cf3728cdc7",
    "request_items": [
        {
            "id": 0,
            "data_hash": "9c1bd4bfd8defcc856ddf129cc01d172625d139d5f7dcf53b6cb09a0e9a843a3",
            "status": "accepted"
        }
    ],
    "errors": false
}
```

---

## 3. Bulk Request

```bash
# Tạo nhiều customers cùng lúc
POST https://store.com/rest/default/async/bulk/V1/customers
Authorization: Bearer <admin_token>
Content-Type: application/json

[
    {
        "customer": {
            "email": "user1@example.com",
            "firstname": "User",
            "lastname": "One"
        },
        "password": "Password123!"
    },
    {
        "customer": {
            "email": "user2@example.com",
            "firstname": "User",
            "lastname": "Two"
        },
        "password": "Password123!"
    }
]
```

**Route với path parameters:** Thay `:param` bằng `byParam`:
```
PUT /async/bulk/V1/products/:sku/media/:entryId
→ PUT /async/bulk/V1/products/bySku/media/byEntryId
```

---

## 4. Tracking Operation Status

### Lấy status tóm tắt
```bash
GET /V1/bulk/{bulkUuid}/status
```

**Response:**
```json
{
    "operations_list": [
        {
            "id": 12,
            "status": 1,
            "result_message": "Service execution success ...",
            "error_code": null
        }
    ],
    "bulk_id": "fbfca270-7a90-4c4e-9f32-d6cf3728cdc7",
    "description": "Topic async.magento.catalog.api...",
    "start_time": "2024-01-15 10:30:00",
    "operation_count": 5
}
```

### Status codes
| Code | Nghĩa |
|------|-------|
| 1 | Complete |
| 2 | Failed |
| 3 | Open (chưa xử lý) |
| 4 | Retriably Failed |
| 5 | Rejected |

### Lấy số lượng theo status
```bash
GET /V1/bulk/{bulkUuid}/operation-status/{status}
```

### Lấy detailed status
```bash
GET /V1/bulk/{bulkUuid}/detailed-status
```

---

## 5. Store Scope

```bash
# Chỉ update store cụ thể
POST /rest/en_us/async/bulk/V1/products

# Update tất cả stores
POST /rest/all/async/bulk/V1/products
```

---

## 6. Consumer Management

```bash
# Start consumer thủ công
bin/magento queue:consumers:start async.operations.all

# Với giới hạn message
bin/magento queue:consumers:start async.operations.all --max-messages=1000

# Cron tự động (khuyến nghị cho production)
# Consumer được spawn bởi cron mỗi phút
```

---

## 7. Custom Bulk Operation

Để tạo custom bulk operation:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\AsynchronousOperations\Api\Data\OperationInterface;
use Magento\AsynchronousOperations\Api\Data\OperationInterfaceFactory;
use Magento\Framework\Bulk\BulkManagementInterface;
use Magento\Framework\DataObject\IdentityGeneratorInterface;
use Magento\Framework\Serialize\SerializerInterface;

class BulkEntityProcessor
{
    public function __construct(
        private readonly BulkManagementInterface $bulkManagement,
        private readonly OperationInterfaceFactory $operationFactory,
        private readonly IdentityGeneratorInterface $identityGenerator,
        private readonly SerializerInterface $serializer
    ) {}

    /**
     * @param array<int, array<string, mixed>> $entities
     */
    public function scheduleBulk(array $entities, int $userId): string
    {
        $bulkUuid = $this->identityGenerator->generateId();
        $operations = [];

        foreach ($entities as $index => $entityData) {
            $operation = $this->operationFactory->create();
            $operation->setBulkUuid($bulkUuid);
            $operation->setTopicName('vendor.module.entity.process');
            $operation->setSerializedData($this->serializer->serialize($entityData));
            $operation->setStatus(OperationInterface::STATUS_TYPE_OPEN);
            $operation->setOperationKey($index);
            $operations[] = $operation;
        }

        $this->bulkManagement->scheduleBulk(
            $bulkUuid,
            $operations,
            __('Process %1 entities', count($entities)),
            $userId
        );

        return $bulkUuid;
    }
}
```

---

## 8. Lưu ý

- Async API yêu cầu RabbitMQ hoặc MySQL queue được cấu hình
- Consumer `async.operations.all` phải đang chạy để xử lý messages
- Không dùng async API cho operations cần kết quả ngay lập tức
- `bulk_uuid` là UUID v4, lưu lại để track status sau
- Trên Adobe Commerce Cloud (SaaS), queue tự động quản lý

---

## Liên kết

- Message Queues: xem [message-queues.md](./message-queues.md)
- RabbitMQ: xem [../infrastructure/rabbitmq.md](../infrastructure/rabbitmq.md)
- REST API: xem [rest/overview.md](./rest/overview.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
