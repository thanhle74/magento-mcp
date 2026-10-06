# Deploy Troubleshooting — Post-deploy & Schema Drift Playbook

> Từ khóa tra cứu: Cannot instantiate interface sau deploy, DI config cache Redis, zc:k GLOBAL__DICONFIG, setup:upgrade lỗi 1061 duplicate key, 1091 drop foreign key, schema drift, db_schema.xml lệch DB, destructive module reset, app:config:import configuration file has changed, ElasticSuite reindex thiếu, FPC key sống sót cache:flush, cache module riêng, migration validate tăng dần, baseline test fail pre-existing

---

## 1. Stale DI config cache sau deploy (lặp >= 3 lần)

### Triệu chứng

Sau deploy có `di.xml`/preference mới, **mọi lệnh `bin/magento` chết ngay** khi boot:

```
Fatal error: Uncaught RuntimeException: Cannot instantiate interface Vendor\Module\Api\SomeInterface
```

Trong khi file interface + preference đều đúng trong codebase.

### Root cause

DI config cache nằm trong **Redis**, không phải trong `generated/`. Deploy đẩy code mới nhưng cache DI cũ (serialize layout object-manager theo config snapshot cũ) vẫn còn — ObjectManager đọc cache stale nên không thấy preference mới.

- Key thực tế trong Redis: `zc:k:69d_GLOBAL__DICONFIG` — Zend cache normalize ID thành **UPPERCASE** và `::` → `__`; `69d` là prefix 3 ký tự cache instance của site. Grep `*DiConfig*` (chữ thường) sẽ KHÔNG tìm thấy.
- **Fallback file cache**: nếu env không cấu hình Redis cho cache, DI cache nằm ở `var/cache/mage--*/mage---<prefix>_DICONFIG` — khi đó `DEL` Redis hay `rm -rf generated/*` đều vô hiệu, phải xóa đúng file var/cache.
- **`bin/magento cache:flush` KHÔNG dùng được** — CLI đã chết ngay khi boot.
- **`rm -rf generated/*` cũng vô dụng** — generated code không chứa DI config cache này.

### Fix

```bash
docker exec <redis-container> redis-cli -n 0 DEL "zc:k:69d_GLOBAL__DICONFIG"
```

Sau khi key được DEL, chuỗi chuẩn để đóng gói trạng thái:

```bash
bin/magento setup:upgrade
bin/magento setup:static-content:deploy
bin/magento setup:di:compile
bin/magento cache:clean
```

> Dấu hiệu nhận biết nhanh: lỗi "Cannot instantiate interface" xuất hiện NGAY SAU deploy có thay đổi DI, và xóa `generated/` không hết → nghĩ đến Redis DI cache trước khi nghi code.

---

## 2. Schema drift playbook (lỗi 1061 / 1091 khi `setup:upgrade`)

### Triệu chứng

```
SQLSTATE[42000]: Syntax error ... 1061 Duplicate key name 'IDX_...'
SQLSTATE[42000]: ... 1091 Can't DROP 'FK_...'; check that column/key exists
```

Lặp lại >= 3 lần, mỗi lần mất nửa ngày. **Gần như luôn là DB drift so với `db_schema.xml`**: DB thực tế lệch khỏi schema khai báo — do restore snapshot cũ, hoặc do một module được cài ngoài luồng `setup_module` (chạy SQL tay tạo sẵn index/constraint).

### Playbook 6 bước

**(a) Audit owner file + whitelist** — xác định index/constraint bị lỗi thuộc module nào trong `db_schema.xml`, đối chiếu `db_schema_whitelist.json` có entry đó không.

**(b) Audit DB state** — dump cấu trúc bảng liên quan và so với schema khai báo:

```bash
docker exec <mysql> mysqldump -uroot -p"$PASS" --no-data magento \
  | grep -E "CREATE TABLE|KEY \`|CONSTRAINT" > /tmp/db-state.sql
```

**(c) Backup dump + verify checksum trước khi đụng tay vào DB:**

```bash
docker exec <mysql> sh -c 'mysqldump -uroot -p"$PASS" magento | gzip' > /tmp/backup-$(date +%F).sql.gz
sha256sum /tmp/backup-*.sql.gz | tee /tmp/backup.sha256
gunzip -t /tmp/backup-*.sql.gz && echo "Gzip OK"
```

**(d) Atomic ALTER** — với UNIQUE key cần đổi: drop + add trong **1 statement** để không có window trạng thái nửa vời:

```sql
ALTER TABLE flash_sale_quota
  DROP INDEX UNQ_ORDER_ITEM,
  ADD UNIQUE KEY UNQ_ORDER_ITEM (order_item_id);
```

**(e) Chạy `setup:upgrade` LẦN 2 phải pass** — lần 1 fix drift xong chạy lại; lần 2 pass là bằng chứng patch idempotent, không còn drift tiềm ẩn đằng sau.

**(f) KHÔNG regenerate whitelist casually** — `bin/magento setup:db-schema:upgrade --convert-warnings` hay regenerate whitelist chỉ khi chắc chắn schema hiện tại là đích đúng; regenerate bừa sẽ "hợp lệ hóa" drift và đánh mất khả năng phát hiện lần sau.

---

## 3. Destructive module reset playbook (staging CÓ data)

Khi bắt buộc reinstall module trên staging đang có dữ liệu thật:

1. **Backup full dump + SHA256 trước** (như bước 2c) — đây là điều kiện tiên quyết, không thoái thác.
2. **GIỮ nguyên `patch_list` và `setup_module`** — xóa 2 bảng này là Magento chạy lại toàn bộ data patch/schema patch từ đầu, phá cả các module khác.
3. Chỉ DROP đúng bảng của module + DELETE đúng config rows của module:

```sql
DROP TABLE IF EXISTS flash_sale_campaign, flash_sale_quota;
DELETE FROM core_config_data WHERE path LIKE 'flash_sale/%';
```

4. Chạy `setup:upgrade` để module tạo lại bảng theo `db_schema.xml`.
5. **Verify sau reset:** danh sách bảng khớp `db_schema.xml`, dữ liệu của module khác (orders, customers, products) nguyên vẹn, response API của module đúng shape.

---

## 4. Sau restore DB / up stack

Restore DB từ snapshot khác version (hoặc up stack gắn DB mới) thì **chưa xong** ở bước restore:

```bash
# 1. Import config — nếu bỏ qua sẽ thấy "configuration file has changed"
bin/magento app:config:import

# 2. Reindex các indexer thiếu (indexer tồn tại trong code nhưng không có trạng thái trong DB restored)
#    VD ElasticSuite: indexer livesafe của nó không nằm trong bộ core_indexer
bin/magento indexer:reindex catalog_product
bin/magento indexer:reindex catalogsearch_fulltext
```

Kiểm tra **version skew module** giữa DB restored và code: so `setup_module.version` với `composer.json`/`module.xml` của từng module custom — lệch version sẽ khiến patch cũ chạy lại hoặc patch mới bị bỏ qua âm thầm.

---

## 5. Module-specific cache trước live-verify

Module có **cache type riêng (tag riêng)** thì phải clean riêng trước khi verify response mới:

```bash
bin/magento cache:status                    # xác nhận cache type module đang enabled
bin/magento cache:clean <module_cache_type>
```

Ví dụ thực chiến: module `secomm_ai_commerce` có cache type + tag riêng — sau deploy, `cache:flush` toàn cục **không đủ** để verify payload mới vì FPC key sống sót sau `cache:flush` trong **Redis db1**. Khi nghi ngờ, DEL trực tiếp key trong db1 theo tag:

```bash
docker exec <redis> redis-cli -n 1 keys "*<tag>*"      # khảo sát (không dùng trên prod lớn)
docker exec <redis> redis-cli -n 1 del "<key>"
```

Quy tắc live-verify: clean cache module → request thật với header `Cache-Control: no-cache` → so response shape/schema mới → mới kết luận deploy OK.

---

## 6. Validate migration tăng dần khi đổi schema

Không chỉ test fresh install — fresh install tạo schema mới từ đầu nên che hết lỗi migration từ schema CŨ:

1. **DB mới install ở BASE (schema cũ)** — install codebase cũ trước.
2. **Copy module mới vào** codebase.
3. `bin/magento setup:upgrade` — để data patch/schema patch chạy từ trạng thái cũ.
4. So sánh schema cuối với fresh install của code mới.

### Baseline test discipline

- Chạy **bộ test TRƯỚC KHI đổi code** để chốt baseline — fail có sẵn (module bên thứ ba như Mageplaza) **không tính vào kết quả của mình**.
- Nhưng phải **chứng minh độc lập**: test fail baseline đó vẫn fail y nguyên sau khi mình đổi code (không fail thêm, không fail mới).
- Sau khi đổi code: so sánh số/kinds of failure với baseline — chỉ delta mới là trách nhiệm của mình.

---

## 7. `setup:config:set` non-interactive âm thầm ghi đè `env.php` + STOP CRON trước deploy

Hai bẫy deploy-script đi cùng nhau:

1. `bin/magento setup:config:set` chạy **non-interactive** (script/CI, Enter = default)
   nhận **default answer là "y"** (`ConfigSetCommand` core) → overwrite `app/etc/env.php`
   staging/prod mà không hỏi. Deploy script truyền đủ tham số + không gọi lệnh này
   "phòng khi" — hoặc confirm trước khi chạy.
2. Deploy script có `rm -rf generated/code/*` **đua với cron container** đang chạy
   (`rm: cannot remove 'generated/code/Magento'`) — cron boot giữa lúc generation bị xóa
   → lỗi/class lạ nửa chừng. **STOP cron trước deploy**, start lại sau khi compile xong
   (thứ tự chuẩn xem [deployment-pipeline.md](deployment-pipeline.md)).

---

## 8. Lỗi 1061 variant — plain KEY trong DB vs UNIQUE trong schema + MySQL version skew

§2 xử lý drift chung; 3 chi tiết bổ sung từ case thật:

- **Drift nguồn**: staging DB có plain `KEY` trong khi `db_schema.xml` khai `UNIQUE`
  (staging MySQL 5.7 vs local 8.4 khác hành vi normalize index) — check version MySQL
  giữa môi trường khi drift "khó hiểu".
- **Bare `DROP INDEX` bị ERROR 1553** khi index đang đỡ FK → phải là **một câu ALTER
  nguyên tử** `DROP INDEX k, ADD UNIQUE KEY k (col)` (như §2d).
- **Pre-check duplicate data trước khi ADD UNIQUE** — unique hóa bảng đang có row trùng
  chết giữa chừng; `SELECT ... GROUP BY col HAVING COUNT(*) > 1` phải PASS trước.

---

## 9. Audit runtime tree trước khi đổ lỗi cache

"Đã sync branch mà vẫn ra output cũ" — trước khi nghi cache:

1. **`docker inspect` là nguồn authoritative cho mount mapping** — đừng assume
   `compose/src → /var/www/html` vẫn đúng; xem `Mounts` thực tế.
2. **Grep trực tiếp file bên trong container** (`docker exec <c> grep <marker> <file>`)
   xác nhận code mới/cũ đang nằm trong tree được mount.
3. Sync branch local (`git fetch origin branch:branch`) **không đổi working tree** mà
   container mount — nếu tree là bản cũ thì HTTP output chính là **kết quả thực thi của
   tree cũ**, không phải cache serve lệch.

Cache (cache type module riêng, cache id per store, HTTP `max-age`) chỉ là suspect thứ
cấp sau khi loại mismatch tree.

---

## 10. Crash "We can't save the credit memo" — phép cộng chuỗi theo locale

Vendor module cộng tiền trong form credit memo bằng PHP `+` trên chuỗi prefill từ
`formatPrecision` → locale `vi_VN` render `"10.000,00"` → PHP 8
`"A non-numeric value encountered"` → exception **trước khi** chạm refund gateway
(gateway vô tội). Locale `en_US` không bao giờ crash → bug ẩn đến khi store dùng vi_VN.

- **Probe**: `formatPrecision(10000)` dưới locale thật + thử `float + '10.000,00'`.
- **Fix dài hạn**: plugin normalize — xuất số canonical
  `number_format($v, 2, '.', '')` hoặc parse qua `Magento\Framework\Math\Locale` trước
  khi tính; tạm thời: gõ số thô `10000`.

---

## 11. Console 403/500 hai gốc độc lập — tách bạch bằng header

Triệu chứng chung: console storefront lỗi 403/500, requirejs/Knockout đổ domino. Hai gốc
cần tách ngay từ đầu:

1. **WAF/edge challenge**: Cloudflare rule match `uri.path contains "login"` action
   Managed Challenge → **403 kèm header `cf-mitigated: challenge`** cho mọi URL có chữ
   "login" trên mọi subdomain của zone. Fix expression:
   `... and not starts_with(http.host, "<subdomain>")`. Luôn check
   `cf-mitigated` trước khi kết luận lỗi Magento.
2. **Magento thật**: `customer/section/load` trả 400 `Private key signing failed` — từ
   JWT signing của module Adobe Services Connector khi **Payment Services chưa
   onboarding** → disable sạch cả family module liên quan; check `sequence`/`depends`
   trước khi disable lẻ tẻ.

---

## 12. `config.php` churn thuần reorder — đừng commit artifact môi trường

`bin/magento` CLI (`module:enable`, `setup:upgrade`) thường xuyên rewrite
`app/etc/config.php` **chỉ để reorder dòng module** (giữ nguyên tập module):

1. Verify diff là thuần reorder: không mất/thêm module, chỉ đổi thứ tự.
2. Khi đó **restore** file — giữ worktree đúng scope, không lẫn artifact môi trường vào
   commit feature.
3. Ngược lại, trước khi vứt diff `config.php` phải verify "thuần reorder" — module có
   trong composer nhưng thiếu `config.php` (và config flag default 0) là module **inert**:
   remove khỏi config.php là thay đổi hành vi thật, không phải noise.

---

## Verify bắt buộc

1. Sau mọi deploy có thay đổi DI: chạy 1 lệnh `bin/magento` bất kỳ pass ngay không cần DEL Redis.
2. `setup:upgrade` chạy 2 lần liên tiếp, lần 2 sạch lỗi 1061/1091.
3. Sau restore: `app:config:import` idempotent (chạy lại không báo changed), indexer status `ready`.
4. Live-verify response mới sau khi clean đúng cache type module.

---

## Liên kết

- Chạy multi-stack Docker: xem [docker-compose-multi-project.md](docker-compose-multi-project.md)
- Cache/Magento cache types: xem [../infrastructure/cache-management.md](../infrastructure/cache-management.md)
- Redis & cache key: xem [../infrastructure/redis.md](../infrastructure/redis.md)
- Declarative schema & data patch: xem [../core/data-schema-patch.md](../core/data-schema-patch.md)
- Deploy pipeline: xem [deployment-pipeline.md](deployment-pipeline.md)
