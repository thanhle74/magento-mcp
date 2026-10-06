# Tham khảo: Công cụ dòng lệnh (Maintenance CLI)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cli/common-cli-commands

---

## 1. Tổng quan lệnh bin/magento
Mọi thao tác quản trị Magento đều thực hiện qua lệnh:
`php bin/magento <lệnh> [tùy chọn]`

---

## 2. Nhóm lệnh Hệ thống & Mode

### 2.1 Quản lý Mode
- `bin/magento deploy:mode:show`: Kiểm tra mode hiện tại.
- `bin/magento deploy:mode:set {developer|production}`: Chuyển đổi mode.
  - Lưu ý: Production mode sẽ yêu cầu biên dịch (compile) và tạo static content.

### 2.2 Bảo trì (Maintenance)
- `bin/magento maintenance:enable`: Bật chế độ bảo trì.
- `bin/magento maintenance:disable`: Tắt chế độ bảo trì.
- `bin/magento maintenance:allow-ips <ip1> <ip2>`: Cho phép IP cụ thể truy cập trong khi bảo trì.

---

## 3. Nhóm lệnh Cache & Indexer

### 3.1 Cache
- `bin/magento cache:clean`: Xóa các mục cache hết hạn nhưng giữ lại cấu trúc (Thường dùng nhất).
- `bin/magento cache:flush`: Xóa sạch toàn bộ cache trong vùng lưu trữ (Redis/File).
- `bin/magento cache:enable / cache:disable`: Bật/tắt các loại cache cụ thể.

### 3.2 Indexer
- `bin/magento indexer:reindex`: Chạy lại toàn bộ indexer.
- `bin/magento indexer:status`: Kiểm tra trạng thái index.
- `bin/magento indexer:set-mode {realtime|schedule}`: Đặt chế độ cập nhật index.

---

## 4. Nhóm lệnh Deploy & Biên dịch (Biên dịch Static, DI)

### 4.1 Biên dịch DI
- `bin/magento setup:di:compile`: Tạo các file interceptor và proxies (Bắt buộc trong Production).

### 4.2 Static Content
- `bin/magento setup:static-content:deploy [-f]`: Tạo file tĩnh (CSS/JS/HTML) cho các area.

---

## 5. Nhóm lệnh Kho & Dữ liệu (Inventory MSI)

- `bin/magento inventory:aggregate:all`: Tính lại số lượng Salable Qty.
- `bin/magento inventory:reservation:list-inconsistencies`: Phát hiện sai lệch kho/đơn.
- `bin/magento inventory:reservation:cleanup`: Dọn dẹp bản ghi reservation cũ.
- `bin/magento inventory-geocoordinates:import [country]`: Nạp tọa độ GPS cho thuật toán giao hàng.

---

## 6. Lệnh cho Nhà phát triển (Developer Tools)

- `bin/magento dev:source-theme:deploy`: Copy file source theme vào `pub/static`.
- `bin/magento dev:tests:run`: Chạy bộ Unit Tests.
- `bin/magento dev:template-hints:enable / disable`: Bật gợi ý template trên giao diện.

---

## 7. Tạo Custom CLI Command

### Bước 1: Tạo Command class

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Magento\Framework\Exception\LocalizedException;

class SyncDataCommand extends Command
{
    private const OPTION_STORE = 'store';

    public function __construct(
        private readonly \Vendor\Module\Service\SyncService $syncService,
        string $name = null
    ) {
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName('vendor:module:sync-data');
        $this->setDescription('Sync data from external source.');
        $this->addOption(
            self::OPTION_STORE,
            null,
            InputOption::VALUE_OPTIONAL,
            'Store ID to sync (default: all stores)'
        );

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $storeId = $input->getOption(self::OPTION_STORE);

        try {
            $output->writeln('<info>Starting sync...</info>');
            $this->syncService->sync($storeId ? (int) $storeId : null);
            $output->writeln('<info>Sync completed successfully.</info>');
            return Command::SUCCESS;  // = 0
        } catch (LocalizedException $e) {
            $output->writeln('<error>' . $e->getMessage() . '</error>');
            return Command::FAILURE;  // = 1
        }
    }
}
```

### Bước 2: Đăng ký trong di.xml

```xml
<!-- etc/di.xml -->
<type name="Magento\Framework\Console\CommandListInterface">
    <arguments>
        <argument name="commands" xsi:type="array">
            <item name="vendor_module_sync_data" xsi:type="object">
                Vendor\Module\Console\Command\SyncDataCommand
            </item>
        </argument>
    </arguments>
</type>
```

### Naming convention

Format: `group:[subject:]action`

| Ví dụ | Giải thích |
|-------|-----------|
| `vendor:module:sync-data` | group=vendor:module, action=sync-data |
| `catalog:product:reindex` | group=catalog:product, action=reindex |
| `cache:clean` | group=cache, action=clean |

**Quy tắc:**
- Dùng kebab-case cho action
- Group nên là `<vendor>:<module>` để tránh conflict
- Tên phải unique trong toàn hệ thống

### Output styling

```php
$output->writeln('<info>Success message</info>');     // Xanh lá
$output->writeln('<comment>Comment message</comment>'); // Vàng
$output->writeln('<error>Error message</error>');      // Đỏ
$output->writeln('<question>Question?</question>');    // Cyan
```

---

## 8. Chạy CLI dưới user web server — không bao giờ root

Chạy `bin/magento` bằng root (hoặc `docker exec -u 0`) khiến `generated/code` mới sinh ra
**root-owned** → php-fpm (www-data) không đọc được → `ReflectionException: Class
...Interceptor does not exist` ở runtime **dù code hoàn toàn đúng** — triệu chứng trông
giống bug code, thật ra là permission.

```bash
# ✅ ĐÚNG
docker exec -u www-data <php-container> bash -c "bin/magento cache:flush"
su -s /bin/bash www-data -c "php bin/magento indexer:reindex"

# Lỡ chạy root rồi — trả quyền lại
find generated/ -user root -exec chown www-data:www-data {} +
```

---

## 9. Runbook `setup:static-content:deploy` tối ưu (theme Hyvä)

Không deploy blanket (đủ 6 theme khi chỉ cần 2):

```bash
bin/magento setup:upgrade --keep-generated
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f en_US vi_VN \
    --theme Magento/backend \
    --theme Hyva/default \
    --jobs 4
bin/magento cache:flush
```

- **Skip luma trên storefront Hyvä**: adminhtml dùng `Magento/backend`, KHÔNG dùng luma
  → bỏ luma tiết kiệm ~430MB/~29,000 files mỗi lần deploy.
- `--jobs 4` là option core (`vendor/magento/module-deploy/Console/DeployStaticOptions.php`
  — default 0 = sequential); luôn chạy dưới www-data (§8).
- Kiểm tra trước: config `design/theme/theme_id` phải set ở scope **Global** — để scope
  default có nguy cơ fallback về luma.

---

## 10. Sizing PHP-FPM — công thức `max_children ≈ RAM / RSS p95`

Mỗi worker Magento PHP 8.3 chiếm **~200–240MB RSS**. `pm.max_children = 40` trên máy
3.7GB RAM (0 swap) cho phép cấp phát ~8.8GB → OOM killer bắn php-fpm ngay khi
**14–16 request đồng thời** → Apache `AH01067/AH01075` → 503 hàng loạt. Burst thường dồn
khung **00:00–00:07** khi nhiều cron nặng chạy cùng nhau.

- Công thức: `pm.max_children ≈ RAM khả dụng / RSS p95` (vd 3.7GB → **16–20**).
- Bật swap dự phòng; đo RSS p95 từ `ps` lúc tải thật, không đo lúc rảnh.
- Sau OOM: MySQL connection `Sleep`/`Aborted_clients` là **hậu quả**, không phải nguyên
  nhân DB — đừng đi tối ưu MySQL trước.

---

## 11. Pattern script data-fix trên prod

Script hotfix data (`fix_xxx.php` chạy bằng CLI) theo bộ quy tắc cứng:

1. **3 mode**: `--dry-run` (chỉ đếm/báo, 0 ghi) / `--test-one` (đúng 1 record, không
   disable, không redirect) / `--apply`.
2. **Idempotent**: điều kiện WHERE loại những row đã fix
   (`WHERE path NOT LIKE CONCAT('1/2/', ?, '/%')`) — chạy lại vô hại.
3. **Disable-không-delete**: chuyển product sang category mới bằng
   `INSERT IGNORE INTO catalog_category_product (SELECT ...)`, category cũ chỉ
   `is_active = 0` — indexer tự gỡ sạch khỏi bảng index; **KHÔNG DELETE**.
4. SEO: tạo **URL rewrite 301** cho path đổi.
5. Backup cục bộ trước apply: `mysqldump --where="id IN (...)"` — không dump cả DB lớn.
6. Sau khi chạy xong: **xóa script** — không để lại code one-off trong codebase.

---

## 12. `setup:di:compile` cố ý xóa `generated/code` — CompilerPreparation

`CompilerPreparation::handleCompilerEnvironment()` **cố ý xóa** `generated/code` +
`generated/di` khi `setup:di:compile` chạy (chuẩn Magento, để compile sạch). Hệ quả:

- Trong sandbox/copy môi trường một lần, các bước generation phía sau có thể không kịp
  tái tạo đầy đủ → crash giữa chừng (thiếu proxy/vd `Design\Proxy`) — đừng đốt giờ "fix"
  sandbox; chứng minh bằng chứng thay thế trung thực (targeted proof `class_exists` toàn
  bộ class + check di.xml wiring; `MISSING` với virtualType tự tham chiếu là hợp lệ).
- Sau compile trên prod: file generation mới có thể đổi owner nếu compile chạy sai user
  (§8) — đây là lý do runbook luôn compile dưới www-data.

---

## Liên kết
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Quản lý Kho (MSI): xem [inventory-msi.md](../inventory/inventory-msi.md)
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
