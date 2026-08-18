# Magento Module Blueprint: `NullTraceX_BulkEmail` (Message Queue / RabbitMQ)

Nguồn chuẩn: `app/code/NullTraceX/BulkEmail`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/communication.xml`
- `etc/queue_topology.xml`
- `etc/queue_publisher.xml`
- `etc/queue_consumer.xml`
- `Model/Publisher/TestPublisher.php`
- `Model/Consumer/TestConsumer.php`

## Pattern module

- Define topic (`test.message`) trong `communication.xml`.
- Bind topic -> queue trong `queue_topology.xml`.
- Khai báo publisher connection trong `queue_publisher.xml`.
- Khai báo consumer trong `queue_consumer.xml`.
- Publisher publish payload, consumer xử lý logic (hiện tại log message test).

## Khi nào dùng

- Async processing (email, export, integration sync).
- Tách request HTTP khỏi tác vụ nặng.

## Verify nhanh

- Đảm bảo RabbitMQ/AMQP connection hoạt động.
- Publish message bằng publisher class.
- Chạy consumer tương ứng và kiểm tra log.
- Xác nhận message đi đúng queue và được consume.
