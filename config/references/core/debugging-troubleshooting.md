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

## 12. Prod investigation protocol (prod của khách)

Prod của khách = **READ-ONLY tuyệt đối**: chỉ SELECT và đọc log. Không UPDATE, không flush cache, không restart service.

- Output của phiên điều tra = **runbook + lệnh config** đưa owner tự chạy ngoài khung cron — không tự tay chạy thay đổi trên prod.
- Report cho PM theo bảng 3 cột — ít thuật ngữ kỹ thuật:

| Khách báo | Thực tế | Bằng chứng (ngày giờ, log) |
|-----------|---------|---------------------------|
| "Đơn không tạo được" | Payment callback trả 502 do timeout gateway | `exception.log` 2026-03-14 10:32:11, trace ... |

- Kèm **draft tiếng Anh** cho khách (PM duyệt rồi mới gửi).
- Trước khi hứa gì: phân biệt **bug-fix (warranty)** vs **new-dev (báo giá)** — điều tra xong mới kết luận thuộc loại nào, không hứa trước khi có bằng chứng root cause.

### Self-check bắt buộc trước khi kết luận (lỗi thật từng gặp)

1. **Log format sai là kết luận sai**: `error_log` dùng format `[Wed Sep 29 08:19:46]` trong khi `access_log` dùng `29/Sep/2026` — grep error_log bằng format của access_log cho ra "log trống" vô nghĩa. Grep đúng format trước khi kết luận "không có lỗi".
2. **Verify hostname TRƯỚC khi sửa config** — dễ sửa nhầm server khác trong cụm (`*-admin` vs `*-prod`); chạy `hostname` + `nginx -T` để xác nhận server/target đang đứng.
3. **Kích thước response là dấu vân tay**: 503 trả đúng **299 bytes** = error page mặc định Apache — request chưa chạm Magento; lỗi thuộc FPM/mod_security/proxy layer (xem [../ops/web-server-config.md](../ops/web-server-config.md) §3).

---

## 13. Config semantics: `null` vs `''` (allowlist config)

`ScopeConfigInterface::getValue()` trả về **`null`** → chưa cấu hình ở scope này → **default trong `config.xml` được áp**. Ngược lại lưu tường minh **`''`** (chuỗi rỗng) → giá trị rỗng **THẬT** — ví dụ allowlist trống nghĩa là chặn hết.

Hai trạng thái khác nhau hoàn toàn về nghiệp vụ. Bug hay gặp với config allowlist: code kiểm tra `empty($value)` thay vì `$value === null`, khiến "allowlist trống" bị nuốt thành "dùng default" — hành vi ngược đời với admin đã chủ động để trống. Khi đọc config allowlist: phân biệt `null` (fallback default) và `''` (rỗng có chủ đích).

---

## 14. `phpcs:disable` directive phải bare

```php
// ❌ Sai — prose sau sniff name làm directive bị IGNORE
// phpcs:disable Generic.Files.LineLength vì report cần ghi dòng dài

// ✅ Đúng — directive bare, giải thích đặt dòng riêng
// phpcs:disable Generic.Files.LineLength
```

PHP_CodeSniffer parse directive dạng chính xác `phpcs:disable <sniff...>`; chữ prose ngay sau tên sniff làm cả directive bị ignore — file vẫn bị báo lỗi dòng dài dù "đã disable". Cmt giải thích đặt ở dòng riêng bên trên/dưới.

---

## 15. PageBuilder content biến mất âm thầm — PCRE backtrack

Triệu chứng: content PageBuilder (`~47KB`) render **rỗng hoàn toàn**, không lỗi 500, không exception rõ ràng.

Root cause: plugin third-party (vd Mirasvit SeoAutolink `addLinks()`) chạy `preg_replace_callback` với pattern thiếu delimiter space (vd `#<a(.+)((\s)+(.+))+\/a>#iU` — khớp cả `<article`) → **backtrack limit nổ** trên content lớn → `preg_replace_callback` trả **NULL** → content rỗng, im lặng.

Diagnostic & fix:

```php
$result = preg_replace_callback($pattern, $cb, $content);
if ($result === null) {
    // preg_last_error() = PREG_BACKTRACK_LIMIT_ERROR (2)
    var_dump(preg_last_error()); // chỉ chạy local/staging
}
```

1. Check `preg_last_error()` ngay sau hàm preg — `NULL` return là dấu hiệu kinh điển.
2. Fix: đổi tag trong pattern cho hợp lệ (`article` → `div` content bọc ngoài) hoặc sửa pattern (thêm space delimiter `<a\s`, giảm nested group).
3. **Kiểm chứng trên content MỚI trước khi đẩy vào DB** — đừng verify trên content đã bị cắt.

---

## 16. Cloudflare edge cache khi debug FPC

Trước khi kết luận "cache Magento serving stale", check response header **`CF-Cache-Status`**:

- `HIT` — edge Cloudflare serve bản cached, request **chưa chạm origin** → Magento FPC sạch vẫn thấy nội dung cũ.
- `MISS` — request đi tới origin, khi đó mới là chuyện của Magento FPC/varnish.

Quy trình debug cache sai nội dung: bật chế độ dev/purge edge cache Cloudflare trước, rồi mới flush FPC Magento — nếu chỉ flush Magento mà quên edge, sẽ chốt sai root cause.

---

## 17. PHP-FPM slow log — phân biệt nạn nhân và thủ phạm

Bật `request_slowlog_timeout 10s` rồi **phân loại trace theo signature + timestamp**,
đừng quy kết theo trực giác hay tải tổng:

Case thực chiến (sập 14:30): **73 slow traces cùng signature** CatalogWidget "Products by
SKU" (`FIND_IN_SET` full scan bảng EAV text ~4.4GB/2.7M rows không index) bùng phát đúng
khung giờ campaign email — đây là **thủ phạm cấp tính**. Trong khi resolver khác chạy
~300ms × 29,450 calls/ngày — tải nền mạn tính — có **0 slow trace** → chỉ là nạn nhân bị
quy kết oan.

Quy tắc triage:

1. Gom slow trace theo signature (file+line) và đối chiếu timestamp với sự kiện bên ngoài
   (campaign, cron burst, deploy) — thủ phạm = signature bùng phát đồng thời.
2. Trace tần suất cao nhưng không vượt slow-log threshold = tải nền; đừng chữa trước khi
   chữa thủ phạm cấp tính.
3. Symptom thường gặp cấp thứ cấp (đừng chốt là root cause): query `url_rewrite` dồn dập,
   Redis session lock (`Cm\RedisSession\Handler.php`).

---

## 18. Category `setPath` thiếu suffix `/{id}` — menu sập toàn trang

`$category->setPath($parent->getPath())` trước `categoryRepository->save()` lưu path
`1/2/31` **thiếu đuôi `/{id}`**. Hệ quả dây chuyền:

```
path sai → getChildren() (chạy bằng path LIKE 'parent/%') trả ""
         → explode(',', "") ra ['']  (mảng 1 phần tử chuỗi rỗng!)
         → categoryRepository->get('') → NoSuchEntityException
         → uncaught trong block render → production nuốt exception, render block rỗng
```

→ mất trắng cả menu/main navigation, không có 500 để thấy (developer mode thì 500).

Quy tắc:

1. **Không bao giờ tự set path thủ công** — để core sinh path khi save.
2. Block render gọi repository `get()`: bọc try/catch + check rỗng
   (`trim($children) === ''` → trả về sớm) — không tin dữ liệu category "luôn đúng shape".
3. Khi so sánh path trong script data-fix: idempotent bằng
   `WHERE path NOT LIKE CONCAT('1/2/', ?, '/%')` (pattern script xem
   [../ops/maintenance-cli.md](../ops/maintenance-cli.md) §11).

---

## Liên kết

- Logging: xem [../infrastructure/logging.md](../infrastructure/logging.md)
- Plugin patterns: xem [plugin-patterns.md](./plugin-patterns.md)
- DI & Generated code: xem [object-manager-generated.md](./object-manager-generated.md)
