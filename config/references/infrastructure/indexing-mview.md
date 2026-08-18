# Tham khảo: Indexer & Mview

Nguồn: https://developer.adobe.com/commerce/php/development/components/indexing/

---

## Tổng quan

Indexer chuyển đổi dữ liệu gốc (catalog, price, customer...) thành dạng tối ưu cho storefront. Thay vì tính toán on-the-fly mỗi request, Magento pre-compute và lưu vào index tables.

Ví dụ: `catalog_product_price` pre-tính giá sau khi áp dụng tier price, catalog rule, special price — tránh tính lại mỗi lần load trang.

---

## Indexing modes

| Mode | Mô tả | Khi nào dùng |
|------|-------|--------------|
| **Update on Save** | Reindex ngay khi entity được lưu | Dev environment, catalog nhỏ |
| **Update by Schedule** | Reindex theo cron job (mặc định từ 2.4.8) | Production — khuyến nghị |

**Lưu ý 2.4.8:** Default mode đổi sang `Update by Schedule` cho tất cả indexer mới, kể cả `customer_grid` (trước đây chỉ hỗ trợ `Update on Save`).

Đặt mode qua Admin: `System > Tools > Index Management` hoặc CLI:

```bash
bin/magento indexer:set-mode schedule catalog_product_price
bin/magento indexer:set-mode realtime catalog_product_price
```

---

## Indexer status

| DB Status | Admin Status | Ý nghĩa |
|-----------|-------------|---------|
| `valid` | Ready | Dữ liệu đồng bộ, không cần reindex |
| `invalid` | Reindex Required | Dữ liệu gốc thay đổi, cần reindex |
| `working` | Processing | Đang reindex |

Kiểm tra:
```bash
bin/magento indexer:status
bin/magento indexer:info
```

---

## Mview (Materialized View)

Mview theo dõi thay đổi DB cho entity cụ thể và trigger partial reindex chỉ cho những entity đã thay đổi.

### Cơ chế hoạt động

1. Khi `Update by Schedule` được bật, Magento tạo **MySQL AFTER triggers** trên các bảng được subscribe.
2. Mỗi INSERT/UPDATE/DELETE ghi `entity_id` vào **changelog table** (`<indexer_table>_cl`).
3. Cron job `indexer_reindex_all_invalid` chạy mỗi phút, đọc changelog và gọi `execute($ids)` của indexer.

### Cấu trúc mview.xml

```xml
<!-- <Vendor>/<Module>/etc/mview.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Mview/etc/mview.xsd">
    <view id="vendor_module_entity" class="Vendor\Module\Model\Indexer\Entity" group="indexer">
        <subscriptions>
            <!-- Theo dõi bảng này, khi thay đổi sẽ trigger reindex -->
            <table name="vendor_module_entity" entity_column="entity_id" />
            <!-- Có thể subscribe nhiều bảng -->
            <table name="vendor_module_entity_int" entity_column="entity_id" />
        </subscriptions>
    </view>
</config>
```

Changelog table tự động tạo theo quy tắc: `<view_id>_cl` (ví dụ: `vendor_module_entity_cl`).

---

## Indexer mặc định của Magento

| Indexer | Class | Mô tả |
|---------|-------|-------|
| `catalog_category_product` | `Magento\Catalog\Model\Indexer\Category\Product` | Liên kết category/product |
| `catalog_product_category` | `Magento\Catalog\Model\Indexer\Product\Category` | Liên kết product/category |
| `catalog_product_price` | `Magento\Catalog\Model\Indexer\Product\Price` | Pre-tính giá sản phẩm |
| `catalog_product_attribute` | `Magento\Catalog\Model\Indexer\Product\Flat` | EAV → flat structure |
| `inventory` | MSI indexer | Salable quantity |
| `customer_grid` | `Magento\Customer\Model\Indexer\Source` | Customer grid trong Admin |

---

## Tạo Custom Indexer

### Bước 1: Khai báo indexer.xml

```xml
<!-- <Vendor>/<Module>/etc/indexer.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Indexer/etc/indexer.xsd">
    <indexer id="vendor_module_entity_index"
             view_id="vendor_module_entity"
             class="Vendor\Module\Model\Indexer\Entity"
             primary="vendor_module_entity">
        <title translate="true">Vendor Module Entity Index</title>
        <description translate="true">Reindexes vendor module entity data</description>
    </indexer>
</config>
```

### Bước 2: Tạo Indexer class

```php
<?php

declare(strict_types=1);

namespace Vendor\Module\Model\Indexer;

use Magento\Framework\Indexer\ActionInterface;
use Magento\Framework\Mview\ActionInterface as MviewActionInterface;

class Entity implements ActionInterface, MviewActionInterface
{
    /**
     * Full reindex — chạy khi bin/magento indexer:reindex
     */
    public function executeFull(): void
    {
        // Reindex toàn bộ
    }

    /**
     * Partial reindex theo danh sách IDs — chạy khi Update on Save
     */
    public function executeList(array $ids): void
    {
        $this->execute($ids);
    }

    /**
     * Reindex 1 entity — chạy khi Update on Save cho 1 entity
     */
    public function executeRow($id): void
    {
        $this->execute([$id]);
    }

    /**
     * Partial reindex — được gọi bởi Mview (Update by Schedule)
     */
    public function execute($ids): void
    {
        // Reindex chỉ các entity trong $ids
    }
}
```

### Bước 3: Khai báo mview.xml (nếu dùng Update by Schedule)

Xem cấu trúc mview.xml ở phần trên.

---

## Application Lock Mode (từ 2.4.3)

Bật để có trạng thái indexer chính xác hơn khi reindex thất bại:

```php
// app/etc/env.php
return [
    'indexer' => [
        'use_application_lock' => true
    ]
];
```

Lợi ích: Khi indexer fail, cron job sẽ tự retry thay vì phải reset thủ công.

---

## CLI commands

```bash
# Xem danh sách indexer
bin/magento indexer:info

# Kiểm tra trạng thái
bin/magento indexer:status

# Reindex tất cả
bin/magento indexer:reindex

# Reindex indexer cụ thể
bin/magento indexer:reindex catalog_product_price

# Đặt mode
bin/magento indexer:set-mode schedule
bin/magento indexer:set-mode realtime catalog_product_price

# Reset indexer về trạng thái invalid (để force reindex)
bin/magento indexer:reset
```

---

## Lưu ý quan trọng

- **Không chạy `indexer:reindex` trên Production** trong giờ cao điểm — dùng `Update by Schedule` thay thế.
- Khi `Update on Save`, indexer class phải tự trigger reindex qua plugin/event — không tự động.
- Changelog table có thể tích lũy lớn nếu cron không chạy — monitor `<indexer>_cl` table size.
- `--safe-mode=1` khi `setup:upgrade` để tránh mất dữ liệu khi disable module có indexer.

---

## Liên kết

- Cron Jobs: xem [cron-jobs.md](./cron-jobs.md)
- Cache Management: xem [cache-management.md](./cache-management.md)
- Maintenance CLI: xem [../ops/maintenance-cli.md](../ops/maintenance-cli.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
