# Blueprint: Gửi email bulk qua RabbitMQ — Magento 2.4.8-p5 / PHP 8.3

> Chuẩn: constitution — `declare(strict_types=1)`, DI qua constructor, không ObjectManager, không `\Exception` generic.
> Nguồn tham khảo gốc: `app/code/NullTraceX/BulkEmail` (đã generalize sang `Vendor\Module`, bổ sung DLQ + retry).

---

## Mục tiêu

Tách gửi email hàng loạt (thông báo, marketing, nhắc nợ...) khỏi request HTTP:
controller/API chỉ **publish** message; consumer chạy nền mới render template + gọi SMTP.

- 1 email SMTP mất ~0.5–2s → 5.000 email không thể chạy sync trong 1 request.
- Lỗi SMTP tạm thời (throttle, timeout) cần **retry tự động** thay vì fail cả request.
- Scale ngang: chạy thêm consumer process trên cùng queue khi cần tăng throughput.

> ⚠️ Đừng dùng MQ "cho có": nếu chỉ gửi 1–2 email sau một action, gọi `TransportBuilder` trực tiếp
> (xem `transactional-email-blueprint.md`). MQ xứng đáng khi volume lớn hoặc cần retry độc lập.

---

## Kiến trúc

```text
Controller ─publish─▶ exchange "vendor.module.email" (topic)
                       │ topic "vendor.module.email.send"
                       ▼
            queue "...send.queue" ──consumer──▶ render + SMTP
                │ throw (permanent)                │ republish (transient)
                ▼                                  ▼
    queue "...dlq" (không consumer, monitor)   queue "...retry" (TTL 60s ─DLX─▶ main queue)
```

- **Transient** (SMTP throttle/timeout — `MailException` từ `sendMessage()`): republish sang retry queue,
  sau 60s quay lại main queue, tối đa **3 lần** (poison guard).
- **Permanent** (email sai, template thiếu): throw → framework reject (`requeue=false`)
  → `x-dead-letter-exchange` đưa vào DLQ điều tra, không retry.

> Magento 2.4: exception từ handler → message bị reject. Không khai báo DLX thì message
> bị **drop mất** — luôn cấu hình DLQ trước production. Không dùng `requeue` trực tiếp:
> message quay về **đầu** queue → retry tức thời, lặp vô hạn khi broker vẫn lỗi;
> TTL retry queue cho backoff 60s giữa các lần thử.

---

## Cấu trúc file

```text
app/code/Vendor/Module/
├── registration.php                              # boilerplate chuẩn — xem module-skeleton/templates.md
├── etc/
│   ├── module.xml
│   ├── communication.xml                         # topic + schema
│   ├── queue_topology.xml                        # exchange + binding + DLX + retry TTL
│   ├── queue_publisher.xml                       # topic → connection/exchange
│   ├── queue_consumer.xml                        # consumer + handler + max-messages/sleep
│   └── di.xml                                    # log channel riêng + plugin cast TTL
├── Api/Data/
│   └── EmailMessageInterface.php                 # hợp đồng DTO trên queue
├── Model/
│   ├── Data/EmailMessage.php                     # DTO implementation (boilerplate getters/setters)
│   ├── Publisher/BulkEmailPublisher.php
│   ├── EmailSender.php
│   ├── Consumer/BulkEmailConsumer.php
│   └── Plugin/Topology/Config/CastTtlArgumentToInt.php
```

---

## 1. `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module:etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0"/>
</config>
```

---

## 2. `etc/communication.xml`

Mỗi topic khai báo schema (data interface). Topic retry dùng chung schema với topic chính.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">
    <!-- Topic chính: 1 message = 1 email -->
    <topic name="vendor.module.email.send"
           request="Vendor\Module\Api\Data\EmailMessageInterface"/>
    <!-- Topic retry: consumer republish sang đây khi lỗi tạm thời -->
    <topic name="vendor.module.email.send.retry"
           request="Vendor\Module\Api\Data\EmailMessageInterface"/>
</config>
```

---

## 3. `etc/queue_topology.xml`

3 queue trên 1 exchange kiểu `topic`: main gắn DLX, retry gắn TTL + DLX quay về main,
DLQ không có consumer (chỉ monitor).

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="vendor.module.email" type="topic" connection="amqp">

        <!-- Main queue: message bị reject chảy vào DLQ qua dead-letter exchange -->
        <binding id="bulkEmailSendBinding"
                 topic="vendor.module.email.send"
                 destinationType="queue"
                 destination="vendor.module.email.send.queue">
            <arguments>
                <argument name="x-dead-letter-exchange" xsi:type="string">vendor.module.email</argument>
                <argument name="x-dead-letter-routing-key" xsi:type="string">vendor.module.email.send.dlq</argument>
            </arguments>
        </binding>

        <!-- DLQ: không khai báo consumer — chỉ monitor + replay tay sau khi fix dữ liệu -->
        <binding id="bulkEmailDlqBinding"
                 topic="vendor.module.email.send.dlq"
                 destinationType="queue"
                 destination="vendor.module.email.dlq"/>

        <!-- Retry queue: nằm TTL 60s rồi dead-letter trở lại main queue -->
        <binding id="bulkEmailRetryBinding"
                 topic="vendor.module.email.send.retry"
                 destinationType="queue"
                 destination="vendor.module.email.retry">
            <arguments>
                <argument name="x-dead-letter-exchange" xsi:type="string">vendor.module.email</argument>
                <argument name="x-dead-letter-routing-key" xsi:type="string">vendor.module.email.send</argument>
                <argument name="x-message-ttl" xsi:type="string">60000</argument>
            </arguments>
        </binding>
    </exchange>
</config>
```

---

## 4. `etc/queue_publisher.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">
    <publisher topic="vendor.module.email.send">
        <connection name="amqp" exchange="vendor.module.email" disabled="false"/>
    </publisher>
    <publisher topic="vendor.module.email.send.retry">
        <connection name="amqp" exchange="vendor.module.email" disabled="false"/>
    </publisher>
</config>
```

---

## 5. `etc/queue_consumer.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="vendor.module.bulk_email.consumer"
              queue="vendor.module.email.send.queue"
              handler="Vendor\Module\Model\Consumer\BulkEmailConsumer::execute"
              connection="amqp"
              maxMessages="1000"
              maxIdleTime="60"
              sleep="5"
              onlySpawnWhenMessageAvailable="1"/>
</config>
```

`maxMessages` — exit sau N message (hạn chế memory leak của long-running process).
`maxIdleTime` — chỉ có tác dụng khi có `maxMessages`. `onlySpawnWhenMessageAvailable` —
không spawn khi queue rỗng (quan trọng khi chạy qua cron).

---

## 6. Plugin cast `x-message-ttl` (bắt buộc cho retry queue)

Parser topology XML trả mọi argument dạng **string**, RabbitMQ yêu cầu `x-message-ttl`
là **int** — không cast thì `queue.declare` bị từ chối (`PRECONDITION_FAILED: invalid arg type`).

`Model/Plugin/Topology/Config/CastTtlArgumentToInt.php`:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Topology\Config;

use Magento\Framework\MessageQueue\Topology\Config\Data as TopologyConfig;

/**
 * Cast numeric AMQP queue arguments to int after topology config load.
 *
 * RabbitMQ validates argument types on queue.declare; the topology XML parser
 * returns every argument as string, so x-message-ttl/x-expires must be cast
 * before the declaration reaches the broker.
 */
class CastTtlArgumentToInt
{
    /**
     * @var array
     */
    private const ARGUMENTS_TYPES = [
        'x-message-ttl' => 'int',
        'x-expires' => 'int',
    ];

    /**
     * Force declared argument types on every amqp binding.
     *
     * @param TopologyConfig $subject
     * @param mixed $result
     * @param mixed $path
     * @param mixed $default
     * @return mixed
     */
    public function afterGet(TopologyConfig $subject, mixed $result, $path = null, $default = null): mixed
    {
        if (!is_array($result)) {
            return $result;
        }

        foreach ($result as $exchangeKey => $exchangeConfig) {
            $bindings = $exchangeConfig['bindings'] ?? null;
            if (!is_array($bindings)) {
                continue;
            }
            foreach ($bindings as $bindingKey => $binding) {
                foreach ($binding['arguments'] ?? [] as $argument => $value) {
                    if (isset(self::ARGUMENTS_TYPES[$argument])) {
                        $result[$exchangeKey]['bindings'][$bindingKey]['arguments'][$argument] = (int) $value;
                    }
                }
            }
        }

        return $result;
    }
}
```

---

## 7. `Api/Data/EmailMessageInterface.php`

MQF tự serialize/deserialize theo schema: mọi property phải có getter/setter khớp tên,
chỉ chứa scalar/array — không chứa object. DTO implementation (`Model/Data/EmailMessage.php`)
là boilerplate thuần: class implements interface, private typed properties, getter/setter
cho từng field theo đúng pattern dưới đây — không có logic gì thêm.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

/**
 * DTO carried on the queue for a single email to send.
 *
 * @api
 * @since 1.0.0
 */
interface EmailMessageInterface
{
    /** Main send topic name. */
    public const TOPIC_SEND = 'vendor.module.email.send';

    /** Delayed-retry topic name. */
    public const TOPIC_RETRY = 'vendor.module.email.send.retry';

    /**
     * Get recipient email address.
     */
    public function getTo(): string;

    /**
     * Set recipient email address.
     */
    public function setTo(string $to): EmailMessageInterface;

    /**
     * Get template identifier (email_templates.xml name or DB template id).
     */
    public function getTemplateId(): string;

    /**
     * Set template identifier.
     */
    public function setTemplateId(string $templateId): EmailMessageInterface;

    /**
     * Get template variables (scalar values only — must survive serialization).
     */
    public function getTemplateVars(): array;

    /**
     * Set template variables.
     */
    public function setTemplateVars(array $templateVars): EmailMessageInterface;

    /**
     * Get store id for template rendering (locale, sender identity).
     */
    public function getStoreId(): int;

    /**
     * Set store id.
     */
    public function setStoreId(int $storeId): EmailMessageInterface;

    /**
     * Get delivery attempt counter (poison-message guard).
     */
    public function getAttempt(): int;

    /**
     * Set delivery attempt counter.
     */
    public function setAttempt(int $attempt): EmailMessageInterface;
}
```

> Trong `Api/` mọi interface cần `@api` + `@since`; docblock đầy đủ FQCN theo constitution §4
> khi expose qua Web API (mục đích ở đây chỉ là schema cho MQF).

---

## 8. `Model/Publisher/BulkEmailPublisher.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Publisher;

use Magento\Framework\MessageQueue\PublisherInterface;
use Vendor\Module\Api\Data\EmailMessageInterface;

/**
 * Enqueues bulk-email messages. Only publishes — never renders or sends here,
 * the consumer owns the SMTP part so failures can be retried asynchronously.
 */
class BulkEmailPublisher
{
    /**
     * @param PublisherInterface $publisher Connection/exchange resolution happens
     *        via queue_publisher.xml — no extra DI wiring needed.
     */
    public function __construct(
        private readonly PublisherInterface $publisher
    ) {}

    /**
     * Enqueue one email.
     */
    public function publish(EmailMessageInterface $message): void
    {
        $this->publisher->publish(EmailMessageInterface::TOPIC_SEND, $message);
    }

    /**
     * Enqueue a batch — one AMQP message per recipient so each fails/retries independently.
     * Need per-item progress tracking in Admin (Bulk Actions Log)? Use the Bulk
     * Operations framework instead of this simple fan-out.
     */
    public function publishBulk(array $messages): void
    {
        foreach ($messages as $message) {
            $this->publish($message);
        }
    }

    /**
     * Re-enqueue a failed message onto the delayed-retry topic.
     */
    public function republishForRetry(EmailMessageInterface $message): void
    {
        $this->publisher->publish(EmailMessageInterface::TOPIC_RETRY, $message);
    }
}
```

Cách dùng trong controller/service (inject `BulkEmailPublisher` qua constructor):

```php
$message = $this->emailMessageFactory->create() // generated factory — không `new`
    ->setTo($recipient)
    ->setTemplateId('vendor_module_bulk_notice')
    ->setTemplateVars(['customerName' => $name])
    ->setStoreId((int) $store->getId());
$this->bulkEmailPublisher->publish($message);
```

---

## 9. `Model/EmailSender.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\App\Area;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Mail\Exception\MailException;
use Magento\Framework\Mail\Template\TransportBuilder;
use Magento\Framework\Phrase;
use Vendor\Module\Api\Data\EmailMessageInterface;

/**
 * Renders the transactional template and sends it through the mail transport.
 *
 * Kept separate from the consumer so the queue handler stays thin and this class
 * can be unit-tested (mock TransportBuilder) or reused synchronously.
 */
class EmailSender
{
    /** Sender identity from Stores > Configuration > General > Store Email Addresses. */
    private const DEFAULT_FROM_IDENTITY = 'general';

    public function __construct(
        private readonly TransportBuilder $transportBuilder
    ) {}

    /**
     * Render and send one email.
     *
     * TransportBuilder is stateful — always set identifier → options → vars → from → to
     * in this order for every send; never reuse state between two sends.
     *
     * @throws LocalizedException Invalid recipient address (permanent failure).
     * @throws MailException SMTP delivery failed (transient failure candidate) or
     *         template/render/sender-identity problem.
     */
    public function send(EmailMessageInterface $message): void
    {
        $to = trim($message->getTo());
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new LocalizedException(new Phrase('Invalid recipient email: "%1"', [$to]));
        }

        $this->transportBuilder
            ->setTemplateIdentifier($message->getTemplateId())
            ->setTemplateOptions([
                'area' => Area::AREA_FRONTEND,
                'store' => $message->getStoreId(),
            ])
            ->setTemplateVars($message->getTemplateVars())
            ->setFromByScope(self::DEFAULT_FROM_IDENTITY, $message->getStoreId())
            ->addTo($to)
            ->getTransport()
            ->sendMessage();
    }
}
```

> Template phải tồn tại: khai báo trong `etc/email_templates.xml` của module hoặc trỏ sang
> template DB. Cách viết template + `email_templates.xml`: xem `transactional-email-blueprint.md`.

---

## 10. `Model/Consumer/BulkEmailConsumer.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Consumer;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Mail\Exception\MailException;
use Magento\Framework\Phrase;
use Psr\Log\LoggerInterface;
use Vendor\Module\Api\Data\EmailMessageInterface;
use Vendor\Module\Model\EmailSender;
use Vendor\Module\Model\Publisher\BulkEmailPublisher;

/**
 * Queue handler for topic "vendor.module.email.send" — delivers one email per message.
 *
 * Error policy:
 * - MailException (SMTP failure) → re-enqueue onto the TTL retry queue (max MAX_ATTEMPTS).
 * - Anything else → throw: the framework rejects the message (requeue=false)
 *   and the dead-letter exchange routes it to the DLQ.
 *
 * The handler class is instantiated by the queue framework, but every dependency
 * is constructor-injected — never reach for ObjectManager here.
 */
class BulkEmailConsumer
{
    /**
     * Poison-message guard: once the budget is spent the message is dead-lettered
     * instead of bouncing between retry and main queue forever.
     *
     * @var int
     */
    private const MAX_ATTEMPTS = 3;

    /**
     * @param EmailSender $emailSender
     * @param BulkEmailPublisher $publisher
     * @param LoggerInterface $logger Dedicated "bulkEmail" channel wired in di.xml (var/log/bulk_email.log).
     */
    public function __construct(
        private readonly EmailSender $emailSender,
        private readonly BulkEmailPublisher $publisher,
        private readonly LoggerInterface $logger
    ) {}

    /**
     * Process one queued email. Returning normally = ack.
     * Throwing = reject → routed to the DLQ by x-dead-letter-exchange.
     *
     * @throws LocalizedException When the message must be dead-lettered.
     */
    public function execute(EmailMessageInterface $message): void
    {
        if (!filter_var($message->getTo(), FILTER_VALIDATE_EMAIL)) {
            // Poison message: no retry can fix a malformed recipient.
            throw new LocalizedException(
                new Phrase('Poison message rejected: invalid recipient "%1".', [$message->getTo()])
            );
        }

        try {
            $this->emailSender->send($message);
        } catch (MailException $e) {
            $this->retryOrFail($message, $e);
            return;
        }

        $this->logger->info('Bulk email sent.', [
            'to' => $message->getTo(),
            'template' => $message->getTemplateId(),
            'attempt' => $message->getAttempt(),
        ]);
    }

    /**
     * Retry with backoff, or dead-letter once the attempt budget is exhausted.
     *
     * @param EmailMessageInterface $message
     * @param MailException $cause
     * @return void
     * @throws LocalizedException When attempts are exhausted (routes the message to the DLQ).
     */
    private function retryOrFail(EmailMessageInterface $message, MailException $cause): void
    {
        $attempt = $message->getAttempt() + 1;

        if ($attempt >= self::MAX_ATTEMPTS) {
            $this->logger->error('Bulk email permanently failed, dead-lettering.', [
                'to' => $message->getTo(),
                'attempts' => $attempt,
                'reason' => $cause->getMessage(),
            ]);
            throw new LocalizedException(
                new Phrase('Email delivery failed after %1 attempts: %2', [$attempt, $cause->getMessage()]),
                $cause
            );
        }

        $message->setAttempt($attempt);
        // Requeue via the retry queue: it sits for x-message-ttl seconds, then the
        // dead-letter exchange of that queue feeds it back into the main queue.
        $this->publisher->republishForRetry($message);
        $this->logger->warning('Bulk email delivery failed, requeued for retry.', [
            'to' => $message->getTo(),
            'attempt' => $attempt,
            'reason' => $cause->getMessage(),
        ]);
    }
}
```

> Store context: với RabbitMQ, Magento tự đính kèm `store_id` vào header message và
> `setCurrentStore()` trước khi handler chạy — `StoreManagerInterface` trong consumer luôn
> thấy đúng store của message mà không cần truyền tay.

---

## 11. `etc/di.xml`

Publisher + connection đã được wire qua `queue_publisher.xml` — ở đây chỉ cần log channel
riêng và đăng ký plugin cast TTL (mục 6).

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Dedicated log channel: var/log/bulk_email.log (không lẫn vào system.log) -->
    <virtualType name="Vendor\Module\Logger\BulkEmailHandler" type="Magento\Framework\Logger\Handler\Base">
        <arguments>
            <argument name="fileName" xsi:type="string">/var/log/bulk_email.log</argument>
            <argument name="filesystem" xsi:type="object">Magento\Framework\Filesystem\Driver\File</argument>
        </arguments>
    </virtualType>
    <virtualType name="Vendor\Module\Logger\BulkEmail" type="Magento\Framework\Logger\Monolog">
        <arguments>
            <argument name="name" xsi:type="string">bulkEmail</argument>
            <argument name="handlers" xsi:type="array">
                <item name="system" xsi:type="object">Vendor\Module\Logger\BulkEmailHandler</item>
            </argument>
        </arguments>
    </virtualType>
    <type name="Vendor\Module\Model\Consumer\BulkEmailConsumer">
        <arguments>
            <argument name="logger" xsi:type="object">Vendor\Module\Logger\BulkEmail</argument>
        </arguments>
    </type>

    <!-- RabbitMQ cần argument kiểu int; XML parser trả string → cast qua plugin -->
    <type name="Magento\Framework\MessageQueue\Topology\Config\Data">
        <plugin name="vendor_module_cast_queue_arguments"
                type="Vendor\Module\Plugin\Topology\Config\CastTtlArgumentToInt"/>
    </type>
</config>
```

---

## 12. Vận hành (README ops)

### `app/etc/env.php`

```php
'queue' => [
    'amqp' => [
        'host' => 'rabbitmq',
        'port' => '5672',
        'user' => 'magento',
        'password' => '***',
        'virtualhost' => '/',
    ],
    'consumers_wait_for_messages' => 1,           // worker chờ message — tiết kiệm CPU
    'only_spawn_when_message_available' => 1,
],
```

### Chạy consumer

```bash
bin/magento queue:consumers:list | grep bulk_email
# → vendor.module.bulk_email.consumer

bin/magento queue:consumers:start vendor.module.bulk_email.consumer --max-messages=1000
bin/magento queue:config:show    # xem cấu hình queue đang hiệu lực
```

### Supervisor (khuyến nghị production)

```ini
[program:magento_bulk_email_consumer]
command=/usr/bin/php /var/www/magento/bin/magento queue:consumers:start vendor.module.bulk_email.consumer --max-messages=2000
process_name=%(program_name)s_%(process_num)02d
numprocs=2                     ; 2 consumer song song trên cùng queue = throughput x2
autostart=true
autorestart=true
user=magento
stdout_logfile=/var/log/magento_bulk_email_consumer.log
```

Không có Supervisor: dùng cron runner có sẵn, giới hạn consumer được spawn trong `env.php`:

```php
'cron_consumers_runner' => [
    'cron_run' => true,
    'max_messages' => 1000,
    'consumers' => ['vendor.module.bulk_email.consumer'],
],
```

### Monitor DLQ

```bash
rabbitmqctl list_queues name messages messages_unacknowledged
```

Queue `vendor.module.email.dlq` tăng = có message permanent-fail. Replay: fix dữ liệu trước,
rồi Get Messages trong Management UI → publish lại vào topic `vendor.module.email.send`
(hoặc plugin `rabbitmq_shovel` để move hàng loạt).

---

## 13. Verify

```bash
bin/magento setup:upgrade && bin/magento setup:di:compile
bin/magento queue:consumers:list | grep vendor.module.bulk_email   # thấy consumer
tail -f var/log/bulk_email.log
```

| Kịch bản | Bước | Kết quả mong đợi |
|---|---|---|
| Happy path | Publish message hợp lệ, chạy consumer | Log `Bulk email sent.`, nhận email |
| Retry | SMTP trỏ host unreachable | Log `requeued for retry`, sau ~60s quay lại main queue, attempt tăng |
| Poison guard | Để retry fail đến lần 3 | Log `dead-lettering`, message xuất hiện trong `...dlq` |
| Poison message | `to` sai định dạng | Vào DLQ ngay, không retry |

---

## Liên kết

- Message Queue Framework (lý thuyết + Bulk Operations + poison pill): [config/references/network/message-queues.md](../../config/references/network/message-queues.md)
- RabbitMQ (topology, DLQ, env.php): [config/references/infrastructure/rabbitmq.md](../../config/references/infrastructure/rabbitmq.md)
- Viết template email + `email_templates.xml`: [transactional-email-blueprint.md](transactional-email-blueprint.md)
- Email vận hành/thông báo: [config/references/infrastructure/notification-transactional-email.md](../../config/references/infrastructure/notification-transactional-email.md)
- Custom log channel (virtual type pattern chi tiết): [magento-module-custom-logger-blueprint.md](magento-module-custom-logger-blueprint.md)
- Lệnh CLI queue: [config/references/ops/maintenance-cli.md](../../config/references/ops/maintenance-cli.md)
