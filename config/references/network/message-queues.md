# Tham khảo: Message Queues (MQF)

Nguồn: https://developer.adobe.com/commerce/php/development/components/message-queues/

---

## 1. Cơ chế hoạt động

1. **Publisher:** Gửi một tin nhắn (Message) kèm theo một tên chủ đề (Topic).
2. **Exchange:** Nhận tin nhắn và điều hướng nó vào các Queue dựa trên cấu hình Topology.
3. **Queue:** Nơi lưu trữ tin nhắn tạm thời (trong RabbitMQ hoặc DB).
4. **Consumer:** Một tiến trình chạy ngầm liên tục lắng nghe Queue và thực thi logic xử lý.

---

## 2. Các file cấu hình bắt buộc

### A. etc/communication.xml
Khai báo Topic và Interface của dữ liệu.
```xml
<topic name="nulltracex.order.processed" schema="NullTraceX\Module\Api\Data\OrderMessageInterface" />
```

### B. etc/queue_publisher.xml
Khai báo ánh xạ Topic vào Connection (nên dùng config trong env.php để linh hoạt).
```xml
<publisher topic="nulltracex.order.processed">
    <connection name="amqp" exchange="magento" />
    <connection name="db" disabled="true" />
</publisher>
```

### C. etc/queue_topology.xml (Cho RabbitMQ)
Định nghĩa việc nối Topic vào Queue cụ thể. Từ 2.4.5+, có thể lược bỏ thuộc tính `connection` để dùng mặc định từ env.php.
```xml
<exchange name="magento" type="topic">
    <binding id="orderProcessedBinding" topic="nulltracex.order.processed" destinationType="queue" destination="order_processed_queue" />
</exchange>
```

### D. etc/queue_consumer.xml
Định nghĩa class thực hiện xử lý.
```xml
<consumer name="orderProcessedConsumer" queue="order_processed_queue" handler="NullTraceX\Module\Model\OrderProcessorConsumer::process" />
```

---

## 3. Cách gửi tin nhắn (PHP)

Inject `Magento\Framework\MessageQueue\PublisherInterface` vào class của bạn.

```php
public function __construct(
    private \Magento\Framework\MessageQueue\PublisherInterface $publisher
) {}

public function execute(\NullTraceX\Module\Api\Data\OrderMessageInterface $message)
{
    // Gửi tin nhắn vào hàng đợi
    $this->publisher->publish('nulltracex.order.processed', $message);
}
```

---

## 4. Các lệnh CLI quan trọng

| Lệnh | Mô tả |
|------|-------|
| `bin/magento queue:consumers:list` | Liệt kê các consumer có sẵn. |
| `bin/magento queue:consumers:start <name>` | Chạy một consumer (thường dùng trong Supervisor). |
| `bin/magento queue:config:show` | Xem cấu hình queue hiện tại. |

---

## 5. Tự động hóa với Asynchronous Web API

Nếu bạn muốn thực thi một Service Contract hiện có dưới dạng bất đồng bộ, bạn **KHÔNG CẦN** cấu hình 4 file XML trên. Magento đã làm sẵn:

- **Hàng đợi chung:** `async.operations.all`
- **Consumer chung:** `async.operations.all`
- **Cơ chế:** Mọi request gửi đến đầu số `/async/V1/...` sẽ tự động được đưa vào hàng đợi này.

### Quy tắc đặt tên Topic tự động:
Magento tự sinh tên Topic cho Async API theo công thức:
`async.<lowercased_service_class>.<lowercased_method>.<lowercased_http_method>`

- **Ví dụ:** `async.magento.catalog.api.productrepositoryinterface.save.post`

Biết quy tắc này giúp bạn dễ dàng theo dõi (monitor) các message cụ thể trong RabbitMQ hoặc bảng `queue_message`.

**Cách chạy Consumer này:**
```bash
bin/magento queue:consumers:start async.operations.all
```

---

## 6. Bulk Operations (Xử lý hàng loạt & Theo dõi)

Khi cần xử lý hàng nghìn bản ghi, hãy dùng Bulk Operations để có khả năng theo dõi tiến độ trong Admin.

### Cơ chế:
- Sử dụng `Magento\AsynchronousOperations\Api\BulkManagementInterface` để lên lịch.
- Mỗi lô (Batch) có một **Bulk UUID** duy nhất.
- Tiến độ được lưu vào bảng `magento_bulk` và hiển thị tại **System > Tools > Bulk Actions Log**.

### PHP Example (Publish Bulk):
```php
// 1. Tạo danh sách các Operation
foreach ($items as $item) {
    $data = [
        'data' => [
            'bulk_uuid' => $bulkUuid,
            'topic_name' => 'nulltracex.custom.topic',
            'serialized_data' => json_encode([
                'entity_id' => $item->getId(),
                'meta_information' => 'Processing item: ' . $item->getSku()
            ]),
            'status' => OperationInterface::STATUS_TYPE_OPEN,
        ]
    ];
    $operations[] = $this->operationFactory->create($data);
}

// 2. Schedule cho cả lô
$this->bulkManagement->scheduleBulk($bulkUuid, $operations, "Mô tả tính năng", $userId);
```

### Quản lý trạng thái trong Consumer:
Khi Consumer xử lý xong hoặc lỗi, nó phải báo cáo lại trạng thái thông qua `OperationManagementInterface::changeOperationStatus`. 

**Quy tắc phân loại lỗi:**
- `RETRIABLY_FAILED`: Lỗi tạm thời (LockWait, Deadlock). Magento sẽ thử lại.
- `NOT_RETRIABLY_FAILED`: Lỗi logic, dữ liệu sai. Sẽ dừng lại và báo lỗi trong Admin.

---

## 7. Cấu hình môi trường (Deployment)

Cấu hình thực tế cho các tiến trình chạy ngầm nằm trong `app/etc/env.php`.

### Cấu hình RabbitMQ (Khuyên dùng):
```php
'queue' => [
    'amqp' => [
        'host' => 'localhost',
        'port' => '5672',
        'user' => 'guest',
        'password' => 'guest'
    ],
    'default_connection' => 'amqp',
    'consumers_wait_for_messages' => 1 // Giúp worker chờ tin nhắn, tiết kiệm CPU
]
```

### Tự động chạy Consumer (Cron):
Magento có một cron job mặc định là `consumers_runner` chạy mỗi phút một lần. Nó sẽ kiểm tra file `env.php` để quyết định khởi động những consumer nào.

Bạn có thể giới hạn danh sách consumer chạy qua cron trong `env.php`:
```php
'cron_consumers_runner' => [
    'cron_run' => true,
    'max_messages' => 2000,
    'consumers' => [
        'async.operations.all',
        'nulltracex.custom.consumer'
    ]
]
```

---

## 8. Cơ chế Poison Pill (Làm mới bộ nhớ)

Do các Consumer là tiến trình chạy lâu dài (Long-running processes), chúng có thể gặp tình trạng dữ liệu trong bộ nhớ (In-memory) bị lỗi thời so với cấu hình (System Config) trong Admin.

### Nguyên lý:
1. Khi có thay đổi quan trọng (ví dụ: Lưu Website, Store, hoặc Config), Magento gọi `PoisonPillPutInterface::put()` để đánh dấu một phiên bản mới.
2. Consumer kiểm tra phiên bản này qua `PoisonPillCompareInterface::isLatestVersion()`.
3. Nếu phát hiện phiên bản cũ, Consumer sẽ **tự dừng (exit)** để tránh xử lý sai dữ liệu.
4. Hệ thống quản lý (Cron/Supervisor) sẽ khởi động lại một Consumer mới với bộ nhớ sạch.

**Lưu ý:** Điều này giải thích tại sao bạn thấy các tiến trình Consumer thỉnh thoảng tự tắt - đó thường là cơ chế tự bảo vệ của Magento.

---

## 9. Context của Store (Store Isolation)

Khi chạy các tác vụ liên quan đến đa website/đa cửa hàng, việc xác định đúng Store Context là cực kỳ quan trọng (để lấy đúng giá, ngôn ngữ, tiền tệ).

- **Cơ chế tự động:** Khi sử dụng RabbitMQ, Magento tự động đính kèm `store_id` vào header của tin nhắn.
- **Tự động phục hồi:** Trước khi Consumer thực thi logic, hệ thống sẽ tự động gọi `setCurrentStore($storeId)`.
- **Lợi ích:** Bạn có thể tin tưởng vào `$storeManager->getStore()` trong code của Consumer mà không cần truyền `store_id` thủ công trong nội dung tin nhắn.

---

## 10. Tóm tắt: MySQL adapter vs AMQP

| | MySQL adapter | AMQP (RabbitMQ) |
|--|--------------|----------------|
| Cài đặt | Không cần thêm | Cần RabbitMQ server |
| Scalability | Thấp | Cao |
| Reliability | Cơ bản | Cao (undelivered message store) |
| Dùng cho | Dev/staging, tải thấp | Production |
| Tables | `queue`, `queue_message`, `queue_message_status` | N/A |
| Consumer trigger | Cron job | Persistent process |

**Khuyến nghị:** Không dùng MySQL adapter cho Production với tải cao.

---

## Liên kết

- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Web API (Async): xem [web-api.md](./web-api.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
