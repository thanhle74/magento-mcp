# Tham khảo: Custom Flat-Index Table (index phẳng tự quản cho hot-path)

> Từ khóa tra cứu: flat index table, custom index, EAV lookup chậm, event-driven index, observer reindex, sku validator index, catalog_product_index_price mirror, reindex console command, fail-safe observer.

---

## 1. Khi nào cần — và khi nào KHÔNG

API/resolver được gọi **hàng chục nghìn lần/ngày** với filter nhiều điều kiện trên EAV
(vd GraphQL `ValidateSkus` filter 4 điều kiện) → đừng tối ưu câu query EAV runtime; hãy
**bake các điều kiện vào một bảng index phẳng** lúc reindex — mirror pattern của core
`catalog_product_index_price`.

Case đo thực tế: EAV query ~109ms DB time → flat index ~0.37ms (**≈300x**), HTTP
200–230ms → 37–42ms; đồng thời sửa luôn bug ngữ nghĩa đếm (xem
[../network/web-api.md](../network/web-api.md) §12).

**KHÔNG cần** khi: query chạy theo batch nội bộ, tần suất thấp, hoặc 1 index MySQL đơn
giản trên bảng flat có sẵn giải quyết được. Flat index là chi phí duy trì (observer +
reindex) — chỉ đáng khi hot-path.

---

## 2. Khung chuẩn

```xml
<!-- etc/db_schema.xml — điều kiện nghiệp vụ "baked in" lúc reindex, KHÔNG filter runtime -->
<table name="vendor_module_sku_validator_index" resource="default" engine="innodb"
       comment="Flat index for hot-path SKU validation">
    <column xsi:type="varchar" name="mp_sku" nullable="false" length="64" comment="PK-first: SKU"/>
    <column xsi:type="int" name="entity_id" unsigned="true" nullable="false"/>
    <column xsi:type="int" name="store_id" unsigned="true" nullable="false"/>
    <column xsi:type="boolean" name="is_eligible" nullable="false" default="false"/>
    <constraint xsi:type="primary" referenceId="PRIMARY">
        <column name="mp_sku"/><column name="store_id"/>
    </constraint>
    <index referenceId="VENDOR_SKU_VALIDATOR_ENTITY_ID" indexType="btree">
        <column name="entity_id"/>
    </index>
</table>
```

Thành phần module:

| Thành phần | Vai trò |
|---|---|
| `db_schema.xml` + whitelist | Bảng index, UNIQUE/PK theo natural key truy vấn |
| ResourceModel + `insertOnDuplicate` | Nạp full/partial (xem [php8-data-idioms.md](./php8-data-idioms.md) §6) |
| Observers | Cập nhật dòng theo event thay đổi dữ liệu nguồn |
| Console command `vendor:index:reindex` | Reindex full (deploy, fix dữ liệu) |
| Data patch Backfill | Nạp lần đầu trên bản cài có sẵn |

Truy vấn hot-path chỉ là: `SELECT ... WHERE mp_sku = ? AND store_id = ?` — 1 điểm tìm
PK, không join EAV.

---

## 3. Duy trì event-driven — KHÔNG phải TTL cache

Quan sát thực chiến: toggle stock → dòng index biến mất/xuất hiện lại ngay. Index phải
**luôn đúng tại mọi thời điểm**, không có khái niệm "hết hạn sau N phút":

```xml
<!-- etc/events.xml -->
<event name="catalog_product_save_after">
    <observer name="vendor_module_sku_index_save" instance="Vendor\Module\Observer\ReindexSku"/>
</event>
<event name="cataloginventory_stock_item_save_after">
    <observer name="vendor_module_sku_index_stock" instance="Vendor\Module\Observer\ReindexSku"/>
</event>
```

Observer cập nhật **chỉ dòng bị ảnh hưởng** (partial reindex per-entity), bọc fail-safe —
lỗi index không được làm vỡ thao tác nghiệp vụ chính (save product):

```php
public function execute(Observer $observer): void
{
    try {
        $this->indexUpdater->updateFor((int) $observer->getProduct()->getId());
    } catch (\Throwable $e) {
        $this->logger->critical($e); // + flag để cron reconciliation quét lại
    }
}
```

Cron reconciliation định kỳ đối chiếu count giữa bảng nguồn ↔ index để bắt dòng lệch
do observer fail — thay vì dựa TTL.

---

## 4. Reindex full command

Console command chuẩn (khung CLI xem [../ops/maintenance-cli.md](../ops/maintenance-cli.md) §7):

- `TRUNCATE`/`DELETE` + nạp lại bằng **1 batch `insertOnDuplicate`** — không insert từng row.
- Chạy dưới user web server (xem [../ops/maintenance-cli.md](../ops/maintenance-cli.md) §8).
- Sau reindex full: so count bảng nguồn ↔ index làm bước verify.

---

## 5. Gotchas liên quan

- **Collection vs raw SQL không đổi được tốc độ**: cùng execution plan thì chỉ khác
  ~25MB RAM/request. Cái đổi tốc độ DB là **index/execution plan**, không phải cách gọi
  ORM — đừng "tối ưu" bằng chuyển Collection sang raw SQL trên cùng bảng EAV.
- **`getSize()` đếm product, không đếm SKU** — logic validate "đếm khớp" trên collection
  EAV sai ngầm mà không văng lỗi; viết unit test cho đếm per-SKU (xem
  [../network/web-api.md](../network/web-api.md) §12).
- Bảng index thuộc sở hữu **1 module duy nhất**, khai trong `db_schema.xml` của module đó
  (quy tắc ownership xem [declarative-schema.md](./declarative-schema.md)).

---

## Liên kết

- Upsert idempotent: xem [php8-data-idioms.md](./php8-data-idioms.md)
- Schema + ownership bảng: xem [declarative-schema.md](./declarative-schema.md)
- Indexer/MView core: xem [../infrastructure/indexing-mview.md](../infrastructure/indexing-mview.md)
- CLI command: xem [../ops/maintenance-cli.md](../ops/maintenance-cli.md)
