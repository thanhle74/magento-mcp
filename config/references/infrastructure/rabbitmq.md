# RabbitMQ trong Magento 2

Nguồn:
- [Configure Message Queues](https://developer.adobe.com/commerce/php/development/components/message-queues/configuration/) — developer.adobe.com
- [Message Queues Overview](https://developer.adobe.com/commerce/php/development/components/message-queues/) — developer.adobe.com
- [Dead Letter and Retry Queues](https://pmclain.com/magento2/2021/08/23/magento-2-dead-letter-and-retry-queues.html) — pmclain.com
- [RabbitMQ Prerequisites](https://experienceleague.adobe.com/en/docs/commerce-operations/installation-guide/prerequisites/rabbitmq) — adobe.com

---

## 1. Tổng quan

Magento Message Queue Framework (MQF) hỗ trợ:
- **RabbitMQ (AMQP)** — khuyến nghị cho production, scalable
- **ActiveMQ Artemis (STOMP)** — từ Magento 2.4.5+
- **MySQL (db)** — fallback khi không có message broker

RabbitMQ dùng **AMQP 0.9** protocol. Bulk API mặc định dùng RabbitMQ.

---

## 2. Cấu hình env.php

```php
// app/etc/env.php
return [
    'queue' => [
        'amqp' => [
            'host' => 'rabbitmq',
            'port' => '5672',
            'user' => 'guest',
            'password' => 'guest',
            'virtualhost' => '/',
            'ssl' => false,
        ],
        'consumers_wait_for_messages' => 1,
        'only_spawn_when_message_available' => 1,
    ],
];
```

---

## 3. Các file cấu hình

| File | Vai trò |
|------|---------|
| `etc/communication.xml` | Khai báo topic (message type, handler) |
| `etc/queue_topology.xml` | Khai báo exchange và binding (routing rules) |
| `etc/queue_publisher.xml` | Khai báo exchange để publish topic |
| `etc/queue_consumer.xml` | Khai báo consumer cho queue |

---

## 4. communication.xml

```xml
<!-- etc/communication.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">
    <!-- Async topic (không có response) -->
    <topic name="vendor.module.entity.created"
           request="Vendor\Module\Api\Data\EntityInterface"/>

    <!-- Sync topic (có response) -->
    <topic name="vendor.module.entity.process"
           request="Vendor\Module\Api\Data\EntityInterface"
           response="string">
        <handler name="processEntity"
                 type="Vendor\Module\Model\EntityProcessor"
                 method="process"/>
    </topic>
</config>
```

---

## 5. queue_topology.xml

```xml
<!-- etc/queue_topology.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="vendor.module.exchange" type="topic" connection="amqp">
        <binding id="entityCreatedBinding"
                 topic="vendor.module.entity.created"
                 destinationType="queue"
                 destination="vendor.module.entity.created.queue"/>
    </exchange>
</config>
```

---

## 6. queue_publisher.xml

```xml
<!-- etc/queue_publisher.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">
    <publisher topic="vendor.module.entity.created">
        <connection name="amqp" exchange="vendor.module.exchange" disabled="false"/>
    </publisher>
</config>
```

---

## 7. queue_consumer.xml

```xml
<!-- etc/queue_consumer.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="vendor.module.entity.created.consumer"
              queue="vendor.module.entity.created.queue"
              handler="Vendor\Module\Model\EntityConsumer::processMessage"
              connection="amqp"
              maxMessages="100"
              maxIdleTime="60"
              sleep="5"
              onlySpawnWhenMessageAvailable="1"/>
</config>
```

**Các thuộc tính consumer:**
- `maxMessages` — số message tối đa trước khi consumer exit
- `maxIdleTime` — giây chờ message mới trước khi exit (chỉ áp dụng khi có `maxMessages`)
- `sleep` — giây sleep giữa các lần check queue
- `onlySpawnWhenMessageAvailable` — chỉ spawn consumer khi có message

---

## 8. Publisher (gửi message)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\MessageQueue\PublisherInterface;
use Vendor\Module\Api\Data\EntityInterface;

class EntityService
{
    public function __construct(
        private readonly PublisherInterface $publisher
    ) {}

    public function publishEntityCreated(EntityInterface $entity): void
    {
        $this->publisher->publish(
            'vendor.module.entity.created',
            $entity
        );
    }
}
```

---

## 9. Consumer Handler

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Psr\Log\LoggerInterface;
use Vendor\Module\Api\Data\EntityInterface;

class EntityConsumer
{
    public function __construct(
        private readonly LoggerInterface $logger
    ) {}

    public function processMessage(EntityInterface $entity): void
    {
        try {
            // Xử lý message
            $this->logger->info('Processing entity: ' . $entity->getId());

            // Business logic ở đây

        } catch (\Exception $e) {
            $this->logger->error('Failed to process entity: ' . $e->getMessage());
            // Throw để message bị reject và vào DLQ (nếu có)
            throw $e;
        }
    }
}
```

---

## 10. Dead Letter Queue (DLQ) và Retry

Topology 3 queue: main → dlq (rejected) + retry (timed retry):

```xml
<!-- etc/queue_topology.xml -->
<exchange name="vendor.module.exchange" type="topic" connection="amqp">
    <!-- Main queue với DLQ config -->
    <binding id="mainBinding"
             topic="vendor.module.entity.topic"
             destinationType="queue"
             destination="vendor.module.entity.queue">
        <arguments>
            <argument name="x-dead-letter-exchange" xsi:type="string">vendor.module.exchange</argument>
            <argument name="x-dead-letter-routing-key" xsi:type="string">vendor.module.entity.topic.dlq</argument>
        </arguments>
    </binding>

    <!-- DLQ - không có consumer, chỉ để monitor -->
    <binding id="dlqBinding"
             topic="vendor.module.entity.topic.dlq"
             destinationType="queue"
             destination="vendor.module.entity.dlq"/>

    <!-- Retry queue với TTL (60 giây) -->
    <binding id="retryBinding"
             topic="vendor.module.entity.topic.retry"
             destinationType="queue"
             destination="vendor.module.entity.retry">
        <arguments>
            <argument name="x-dead-letter-exchange" xsi:type="string">vendor.module.exchange</argument>
            <argument name="x-dead-letter-routing-key" xsi:type="string">vendor.module.entity.topic</argument>
            <!-- x-message-ttl cần plugin để fix type (xem §11) -->
        </arguments>
    </binding>
</exchange>
```

**Lưu ý quan trọng:** `x-message-ttl` argument có vấn đề type trong Magento XML. Cần plugin để fix:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Topology\Config;

class Data
{
    private const ARGUMENTS_TYPES = [
        'x-message-ttl' => 'int',
    ];

    public function afterGet(
        \Magento\Framework\MessageQueue\Topology\Config\Data $subject,
        mixed $result
    ): mixed {
        if (!is_array($result)) {
            return $result;
        }

        foreach ($result as $exchangeKey => $exchangeConfig) {
            if ($exchangeConfig['connection'] !== 'amqp') {
                continue;
            }

            foreach ($exchangeConfig['bindings'] as $bindingKey => $binding) {
                foreach ($binding['arguments'] ?? [] as $argument => $value) {
                    if (isset(self::ARGUMENTS_TYPES[$argument])) {
                        $result[$exchangeKey]['bindings'][$bindingKey]['arguments'][$argument]
                            = (int) $value;
                    }
                }
            }
        }

        return $result;
    }
}
```

---

## 11. Chạy Consumer

```bash
# Chạy consumer thủ công
bin/magento queue:consumers:start vendor.module.entity.created.consumer

# Chạy với giới hạn message
bin/magento queue:consumers:start vendor.module.entity.created.consumer --max-messages=100

# Liệt kê consumers
bin/magento queue:consumers:list

# Chạy tất cả consumers (dùng trong cron)
bin/magento queue:consumers:start --all
```

---

## 12. Cron để spawn consumers

```xml
<!-- etc/crontab.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/crontab.xsd">
    <group id="default">
        <job name="vendor_module_consumer"
             instance="Magento\MessageQueue\Model\Cron\ConsumersRunner"
             method="run">
            <schedule>* * * * *</schedule>
        </job>
    </group>
</config>
```

---

## 13. MySQL vs RabbitMQ

| Tiêu chí | MySQL (db) | RabbitMQ (amqp) |
|----------|-----------|-----------------|
| Setup | Không cần cài thêm | Cần cài RabbitMQ |
| Performance | Thấp hơn | Cao hơn |
| Scalability | Giới hạn | Horizontal scale |
| Dead letter | Không hỗ trợ | Hỗ trợ |
| Retry | Manual | Native TTL |
| Monitoring | SQL query | Management UI |
| Phù hợp | Dev/staging, low volume | Production, high volume |

---

## Liên kết

- Message Queues tổng quan: xem [message-queues.md](./message-queues.md)
- Cron Jobs: xem [cron-jobs.md](./cron-jobs.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
