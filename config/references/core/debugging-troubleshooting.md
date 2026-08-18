# Tham khảo: Debugging & Troubleshooting Magento 2

Nguồn:
- https://magefan.com/ua/blog/magento-error-log — log files
- https://amasty.com/blog/fix-common-issues-magento2/ — common errors
- https://copyprogramming.com/howto/magento-2-500-internal-server-error — 500 error debug

---

## 1. Log files — vị trí và ý nghĩa

| File | Nội dung |
|------|---------|
| `var/log/exception.log` | Exceptions không được catch, PHP fatal errors |
| `var/log/system.log` | System messages, warnings, notices |
| `var/log/debug.log` | Debug messages (chỉ khi debug mode bật) |
| `var/log/cron.log` | Cron job execution logs |
| `var/report/<id>` | Chi tiết lỗi khi user thấy "Error processing request" |

### Bật debug logging

```php
// Trong code (chỉ dùng development)
$this->logger->debug('Debug message', ['context' => $data]);

// Bật debug log trong env.php
// 'x-magento-init' => ['debug' => 1]
```

### Đọc log hiệu quả

```bash
# Xem log realtime
tail -f var/log/exception.log

# Tìm lỗi gần nhất
tail -100 var/log/exception.log | grep -A 10 "Exception"

# Xem report cụ thể
cat var/report/1234567890
```

---

## 2. 500 error debug

### Bước 1: Bật display errors

```php
// pub/index.php — thêm tạm thời (KHÔNG để trên production)
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### Bước 2: Kiểm tra log

```bash
# Magento exception log
tail -50 var/log/exception.log

# PHP error log (vị trí tùy server)
tail -50 /var/log/php-fpm/error.log
tail -50 /var/log/nginx/error.log
tail -50 /var/log/apache2/error.log
```

### Bước 3: Bật developer mode

```bash
bin/magento deploy:mode:set developer
# Lỗi sẽ hiển thị trực tiếp trên trang
```

### Nguyên nhân phổ biến

| Nguyên nhân | Dấu hiệu | Fix |
|------------|---------|-----|
| File permissions | "Permission denied" trong log | `chmod -R 777 var/ pub/` |
| Memory limit | "Allowed memory size exhausted" | Tăng `memory_limit` trong php.ini |
| DI compile lỗi | "Class not found" | `bin/magento setup:di:compile` |
| Cache corruption | Lỗi ngẫu nhiên | `bin/magento cache:flush` |
| Missing module | "Module not found" | `bin/magento setup:upgrade` |
| DB connection | "SQLSTATE" errors | Kiểm tra `app/etc/env.php` |

---

## 3. White Screen of Death (WSOD)

### Nguyên nhân và fix

```bash
# 1. Xóa cache
bin/magento cache:flush
rm -rf var/cache/* var/page_cache/*

# 2. Xóa generated code
rm -rf generated/code/* generated/metadata/*

# 3. Recompile
bin/magento setup:di:compile

# 4. Deploy static content
bin/magento setup:static-content:deploy -f

# 5. Kiểm tra file permissions
find var generated pub/static pub/media -type f -exec chmod 664 {} \;
find var generated pub/static pub/media -type d -exec chmod 775 {} \;
```

### Kiểm tra PHP syntax error

```bash
# Tìm file PHP có syntax error
find app/code -name "*.php" -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```

---

## 4. DI compile error — common errors, how to fix

### "Cannot instantiate interface"

```
Error: Cannot instantiate interface Vendor\Module\Api\MyInterface
```

**Fix:** Thêm preference trong di.xml:
```xml
<preference for="Vendor\Module\Api\MyInterface"
            type="Vendor\Module\Model\MyModel" />
```

### "Impossible to process constructor argument"

```
Error: Impossible to process constructor argument $logger of type: Magento\Psr\Log\LoggerInterface
```

**Fix:** Dùng đúng interface:
```php
// ❌ Sai
use Magento\Psr\Log\LoggerInterface;

// ✅ Đúng
use Psr\Log\LoggerInterface;
```

### "Class not found" sau khi thêm plugin

```bash
# Xóa generated code của class bị ảnh hưởng
rm -rf generated/code/Vendor/Module/

# Recompile
bin/magento setup:di:compile
```

### "Circular dependency"

```
Error: Circular dependency: ClassA depends on ClassB and ClassB depends on ClassA
```

**Fix:** Dùng Proxy cho một trong hai:
```xml
<type name="Vendor\Module\Service\ServiceA">
    <arguments>
        <argument name="serviceB" xsi:type="object">
            Vendor\Module\Service\ServiceB\Proxy
        </argument>
    </arguments>
</type>
```

### "Plugin for virtual type cannot be generated"

Virtual type không thể có plugin. Plugin trên class/interface gốc thay thế.

---

## 5. Plugin conflict — debug interceptor chain

```bash
# Xem tất cả plugin đang active cho class
bin/magento dev:di:info "Magento\Catalog\Model\Product"

# Output:
# Plugins:
# +------------------------------------------+---------+--------+
# | Plugin                                   | Method  | Type   |
# +------------------------------------------+---------+--------+
# | Vendor\Module\Plugin\ProductPlugin       | getName | before |
# | Vendor\Module\Plugin\ProductPlugin       | getName | after  |
# +------------------------------------------+---------+--------+
```

### Identify conflicting plugin

```php
// Thêm log vào plugin để trace
public function beforeSetName(Product $subject, string $name): array
{
    $this->logger->debug('Plugin beforeSetName called', [
        'class' => static::class,
        'name' => $name,
        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5),
    ]);
    return [$name];
}
```

---

## 6. Observer infinite loop — detect, prevent

### Nguyên nhân

Observer A dispatch event X → Observer B lắng nghe event X → Observer B dispatch event X → vòng lặp vô tận.

### Detect

```bash
# Kiểm tra memory usage tăng liên tục
# PHP fatal: "Maximum execution time exceeded"
# PHP fatal: "Allowed memory size exhausted"
```

### Prevent

```php
// Dùng flag để tránh loop
class MyObserver implements ObserverInterface
{
    private bool $isProcessing = false;

    public function execute(Observer $observer): void
    {
        if ($this->isProcessing) {
            return; // Tránh recursive call
        }

        $this->isProcessing = true;
        try {
            // Logic của observer
            // Nếu dispatch event khác ở đây, không gây loop
        } finally {
            $this->isProcessing = false;
        }
    }
}
```

### Area restriction

```xml
<!-- Chỉ lắng nghe event trong frontend area -->
<!-- etc/frontend/events.xml -->
<event name="catalog_product_save_after">
    <observer name="vendor_module_product_save"
              instance="Vendor\Module\Observer\ProductSaveObserver" />
</event>

<!-- Không khai báo trong etc/events.xml (global) -->
```

---

## 7. Cache corruption — symptoms, flush strategy

### Symptoms

- Trang hiển thị nội dung cũ sau khi update
- Lỗi ngẫu nhiên không tái hiện được
- "Invalid cache" errors trong log
- Layout/block không update sau khi sửa

### Flush strategy

```bash
# Flush theo loại (nhanh hơn, ít ảnh hưởng hơn)
bin/magento cache:clean config      # Config cache
bin/magento cache:clean layout      # Layout cache
bin/magento cache:clean block_html  # Block HTML cache
bin/magento cache:clean full_page   # Full page cache

# Flush tất cả (chậm hơn, rebuild từ đầu)
bin/magento cache:flush

# Xóa thủ công (khi cache:flush không đủ)
rm -rf var/cache/*
rm -rf var/page_cache/*
rm -rf var/view_preprocessed/*
```

### Cache backend check

```bash
# Kiểm tra Redis connection
redis-cli ping  # Phải trả về PONG

# Kiểm tra Redis memory
redis-cli info memory | grep used_memory_human

# Flush Redis (cẩn thận — xóa tất cả)
redis-cli flushall
```

---

## 8. Query log — enable, slow query, EXPLAIN

### Enable query log trong Magento

```php
// Trong code (chỉ development)
$connection = $this->resource->getConnection();
$connection->query('SET GLOBAL general_log = 1');
$connection->query("SET GLOBAL general_log_file='/var/log/mysql/general.log'");
```

### Enable slow query log

```sql
-- MySQL config hoặc runtime
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 1;  -- Log query > 1 giây
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
```

### EXPLAIN query trong Magento

```php
// Debug collection query
$collection = $this->collectionFactory->create();
$collection->addFieldToFilter('status', 1);

// Lấy SQL query
$sql = $collection->getSelect()->__toString();
$this->logger->debug('Collection SQL: ' . $sql);

// EXPLAIN
$connection = $this->resource->getConnection();
$explain = $connection->fetchAll('EXPLAIN ' . $sql);
$this->logger->debug('EXPLAIN: ', $explain);
```

---

## 9. Magento profiler — enable/disable, HTML output

```bash
# Bật profiler qua env variable
MAGE_PROFILER=html php bin/magento ...

# Hoặc trong pub/index.php
$_SERVER['MAGE_PROFILER'] = 'html';  # html, csvfile, firebug
```

```php
// Custom profiler trong code
\Magento\Framework\Profiler::start('VENDOR_MODULE_OPERATION');
// ... code cần profile
\Magento\Framework\Profiler::stop('VENDOR_MODULE_OPERATION');
```

---

## 10. Memory leak — common causes

| Nguyên nhân | Dấu hiệu | Fix |
|------------|---------|-----|
| Collection không clear trong loop | Memory tăng dần | `$collection->clear()` sau mỗi batch |
| Event observer giữ reference | Memory không giải phóng | Tránh giữ reference trong observer |
| Circular reference | Memory không GC | Dùng `WeakReference` hoặc refactor |
| Large dataset load toàn bộ | Memory spike | Dùng batch processing |

```php
// Fix: clear collection trong batch loop
do {
    $collection = $this->collectionFactory->create();
    $collection->setPageSize(1000)->setCurPage($page);
    $collection->load();

    foreach ($collection as $item) {
        $this->process($item);
    }

    $lastPage = $collection->getLastPageNumber();
    $page++;

    $collection->clear();
    unset($collection);
    gc_collect_cycles(); // Force garbage collection

} while ($page <= $lastPage);
```

---

## 11. Xdebug — step debug với PhpStorm

### Cài đặt Xdebug

```bash
# Kiểm tra Xdebug đã cài chưa
php -v | grep Xdebug

# Cài qua PECL
pecl install xdebug

# php.ini config (Xdebug 3.x)
[xdebug]
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.client_host=host.docker.internal  # Docker
xdebug.client_port=9003
xdebug.idekey=PHPSTORM
```

### DDEV setup

```bash
# Enable Xdebug trong DDEV
ddev xdebug on

# Disable (tắt khi không debug để tránh chậm)
ddev xdebug off

# Kiểm tra status
ddev xdebug status
```

### Docker (markshust/docker-magento)

```bash
# Enable Xdebug
bin/xdebug enable

# Disable
bin/xdebug disable
```

### PhpStorm Configuration

1. `Preferences > PHP > Servers`
2. Thêm server mới:
   - Name: `magento_cloud_docker` (phải khớp với `PHP_IDE_CONFIG`)
   - Host: `localhost`
   - Port: `80`
   - Debugger: `Xdebug`
3. Bật **Use path mappings**:
   - Local path: `/path/to/project`
   - Remote path: `/app` (hoặc `/var/www/html`)
4. `Preferences > PHP > Debug > Xdebug > Debug Port`: `9003`

### Debug Web Request

1. Click **Start Listening for PHP Debug Connections** trong PhpStorm
2. Cài [Xdebug Helper](https://chrome.google.com/webstore/detail/xdebug-helper) extension cho Chrome
3. Bật debug trong extension (chọn IDE Key: PhpStorm)
4. Đặt breakpoint trong code
5. Reload trang → PhpStorm sẽ dừng tại breakpoint

### Debug CLI Command

```bash
# Chạy CLI với Xdebug
XDEBUG_SESSION=PHPSTORM php bin/magento cache:clean

# Hoặc với DDEV
ddev xdebug on
ddev exec php bin/magento cache:clean
```

### Xdebug Profiling (không phải step debug)

```bash
# php.ini
xdebug.mode=profile
xdebug.output_dir=/tmp/xdebug
xdebug.profiler_output_name=cachegrind.out.%p

# Chạy và phân tích với KCachegrind/QCacheGrind
```

---

## Liên kết

- Logging: xem [../infrastructure/logging.md](../infrastructure/logging.md)
- Plugin patterns: xem [plugin-patterns.md](./plugin-patterns.md)
- DI & Generated code: xem [object-manager-generated.md](./object-manager-generated.md)
