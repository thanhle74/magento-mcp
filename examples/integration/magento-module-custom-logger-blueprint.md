# Blueprint: Custom Logger (Monolog) — Magento 2.4.8 / PHP 8.3

> Chuẩn: constitution v1.1.0 — strict types, typed properties, virtual type pattern.
> Nguồn tham khảo gốc: https://webkul.com/blog/magento2-custom-log-file-using-monolog/ (đã refactor lại cho đúng chuẩn)

---

## Mục tiêu

Tạo custom log file riêng cho module (ví dụ: `var/log/vendor_module.log`) thay vì ghi chung vào `system.log` / `exception.log`.

---

## Cấu trúc file

```
app/code/<Vendor>/<Module>/
├── etc/
│   └── di.xml              # Khai báo virtual type cho Logger + Handler
└── Logger/
    ├── Handler.php          # Định nghĩa file log + log level
    └── Logger.php           # Extend Monolog\Logger (marker class)
```

---

## 1. `etc/di.xml` — Virtual type pattern (không tạo file PHP thừa)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Handler: gắn filesystem driver -->
    <type name="Vendor\Module\Logger\Handler">
        <arguments>
            <argument name="filesystem" xsi:type="object">Magento\Framework\Filesystem\Driver\File</argument>
        </arguments>
    </type>

    <!-- Logger: đặt tên channel + gắn handler -->
    <type name="Vendor\Module\Logger\Logger">
        <arguments>
            <argument name="name" xsi:type="string">vendor_module</argument>
            <argument name="handlers" xsi:type="array">
                <item name="system" xsi:type="object">Vendor\Module\Logger\Handler</item>
            </argument>
        </arguments>
    </type>

</config>
```

---

## 2. `Logger/Handler.php`

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Logger;

use Magento\Framework\Logger\Handler\Base;
use Monolog\Logger as MonologLogger;

class Handler extends Base
{
    /**
     * @var int
     */
    protected $loggerType = MonologLogger::DEBUG;

    /**
     * @var string
     */
    protected $fileName = '/var/log/vendor_module.log';
}
```

> Lưu ý: `$loggerType` và `$fileName` giữ `protected` không có type declaration vì đây là convention của `Magento\Framework\Logger\Handler\Base` — override typed property sẽ gây lỗi.

---

## 3. `Logger/Logger.php` — Marker class

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Logger;

use Monolog\Logger as MonologLogger;

/**
 * Custom logger channel cho Vendor_Module.
 * Inject interface \Psr\Log\LoggerInterface khi có thể;
 * chỉ inject class này khi cần ghi vào file log riêng của module.
 */
class Logger extends MonologLogger
{
}
```

---

## 4. Cách inject và sử dụng

### Inject qua constructor (đúng chuẩn DI)

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Service;

use Psr\Log\LoggerInterface;
use Vendor\Module\Logger\Logger as ModuleLogger;

class SomeService
{
    public function __construct(
        private readonly ModuleLogger $logger,
    ) {}

    public function process(array $data): void
    {
        $this->logger->info('Processing started', ['data' => $data]);

        try {
            // ... business logic
            $this->logger->debug('Processing completed', ['result' => 'ok']);
        } catch (\RuntimeException $e) {
            $this->logger->error('Processing failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
```

### Các log level dùng được

```php
$this->logger->debug('Chi tiết debug', ['context' => $value]);
$this->logger->info('Thông tin thông thường');
$this->logger->notice('Đáng chú ý nhưng không lỗi');
$this->logger->warning('Cảnh báo');
$this->logger->error('Lỗi xử lý được', ['exception' => $e->getMessage()]);
$this->logger->critical('Lỗi nghiêm trọng');
```

---

## 5. Những điều KHÔNG làm

```php
// ❌ Không dùng print_r trong logger
$this->logger->info(print_r($data, true));

// ✅ Dùng context array thay thế
$this->logger->info('Data received', ['data' => $data]);

// ❌ Không inject trực tiếp vào template/block
// ✅ Inject vào Service/Repository/Observer, không phải ViewModel

// ❌ Không dùng \Psr\Log\LoggerInterface nếu muốn ghi vào file riêng
// (PSR logger mặc định ghi vào system.log)
// ✅ Inject Vendor\Module\Logger\Logger khi cần file log riêng
```

---

## 6. Verify

```bash
# Sau khi thêm di.xml mới
bin/magento setup:di:compile
bin/magento cache:flush

# Kiểm tra log xuất hiện đúng file
tail -f var/log/vendor_module.log
```

---

## Liên kết

- `config/references/infrastructure/logging.md`
- `config/constitution.md` — mục 5 (Xử lý lỗi)
- `config/checklist.md` — mục 1 (Code Quality)
