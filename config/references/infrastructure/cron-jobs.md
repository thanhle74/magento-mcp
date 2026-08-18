# Tham khảo: Cron Jobs (Tự động hóa tác vụ)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/crons/custom-cron

---

## 1. Cấu hình crontab (crontab.xml)

Định nghĩa các tác vụ chạy ngầm.

**`etc/crontab.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/crontab.xsd">
    <group id="default">
        <job name="my_custom_cron_job" instance="Vendor\Module\Cron\MyTask" method="execute">
            <!-- Cách 1: Hardcode lịch chạy -->
            <schedule>0 * * * *</schedule>
            
            <!-- Cách 2: Lấy từ cấu hình Admin (Khuyên dùng) -->
            <!-- <config_path>my_module/cron/schedule</config_path> -->
        </job>
    </group>
</config>
```

---

## 2. Tạo Group riêng (cron_groups.xml)

Dùng khi tác vụ nặng, cần cấu hình thời gian chờ hoặc chạy tiến trình riêng.

**`etc/cron_groups.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/cron_groups.xsd">
    <group id="custom_group">
        <schedule_generate_every>1</schedule_generate_every>
        <schedule_ahead_for>4</schedule_ahead_for>
        <schedule_lifetime>2</schedule_lifetime>
        <history_cleanup_every>10</history_cleanup_every>
        <history_success_lifetime>60</history_success_lifetime>
        <history_failure_lifetime>600</history_failure_lifetime>
        <use_separate_process>1</use_separate_process>
    </group>
</config>
```

---

## 3. Class thực thi (PHP)

```php
namespace Vendor\Module\Cron;

class MyTask {
    public function execute() {
        // Logic xử lý tự động ở đây
    }
}
```

---

## 4. Cron Groups mặc định của Magento

| Group | Mô tả |
|-------|-------|
| `default` | Tác vụ chung: email, sitemap, currency rates, catalog price rules |
| `index` | Reindex indexers |
| `consumers` | Message queue consumers |

---

## 5. Lệnh CLI hỗ trợ

```bash
# Chạy tất cả cron groups
bin/magento cron:run

# Chỉ chạy group cụ thể
bin/magento cron:run --group="default"
bin/magento cron:run --group="index"

# Cài đặt crontab hệ thống
bin/magento cron:install [--force]

# Xóa crontab
bin/magento cron:remove
```

**Lưu ý:** Phải chạy cron **2 lần** — lần 1 để discover tasks, lần 2 để thực thi.

---

## 6. cron_schedule table

Magento lưu lịch sử cron vào bảng `cron_schedule`:

| Cột | Mô tả |
|-----|-------|
| `job_code` | Tên job (từ `crontab.xml`) |
| `status` | `pending`, `running`, `success`, `missed`, `error` |
| `scheduled_at` | Thời gian dự kiến chạy |
| `executed_at` | Thời gian thực tế chạy |
| `finished_at` | Thời gian hoàn thành |
| `messages` | Error message nếu có |

```bash
# Xem lịch sử cron
SELECT * FROM cron_schedule ORDER BY scheduled_at DESC LIMIT 20;
```

---

## 7. Logging

Cron log mặc định: `var/log/cron.log`

- Job `ERROR` → ghi vào `var/log/exception.log` (CRITICAL level)
- Job `MISSED` → ghi vào `var/log/debug.log` (developer mode)
- Tất cả exceptions → `var/log/support_report.log`

---

## 8. Cấu hình lịch chạy từ Admin

```xml
<!-- etc/crontab.xml — dùng config_path thay vì hardcode schedule -->
<job name="my_custom_cron_job" instance="Vendor\Module\Cron\MyTask" method="execute">
    <config_path>my_module/cron/schedule</config_path>
</job>
```

```xml
<!-- etc/adminhtml/system.xml — field để admin cấu hình -->
<field id="schedule" translate="label" type="text" sortOrder="10"
       showInDefault="1" showInWebsite="0" showInStore="0">
    <label>Cron Schedule</label>
    <comment>Cron expression, e.g. 0 * * * * (every hour)</comment>
</field>
```

---

## Liên kết
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Indexer & Mview: xem [indexing-mview.md](./indexing-mview.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
