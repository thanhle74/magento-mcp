# Checklist - Kiểm tra trước khi hoàn thành

> Chi tiết rule: `constitution.md` | Chi tiết pattern: đọc reference tương ứng trong `magento-patterns.md`

**Áp dụng:** Mọi module custom trong `app/code/`, mọi task implement/review — kể cả khi spec nghiệp vụ của dự án **không** nhắc lại từng mục (spec chỉ mô tả AC nghiệp vụ; chuẩn code nằm ở đây).

---

## 0. Spec & review scope

- [ ] Spec nghiệp vụ của dự án có tham chiếu `constitution.md` + file này (section "Tuân thủ chuẩn chung" hoặc tương đương)
- [ ] Review/DoD đối chiếu **toàn bộ checklist** các section liên quan — **không** chỉ tick AC trong spec feature
- [ ] Completion report ghi rõ: `Checklist sections reviewed: <danh sách số section>`

---

## 1. Code Quality

- [ ] `declare(strict_types=1)` mọi file PHP
- [ ] Return type mọi method
- [ ] **Docblock bắt buộc** (xem `constitution.md` §1 + §4 — PHPDoc):
  - Mọi **class**: 1 dòng mô tả mục đích (tiếng Anh)
  - Mọi **constructor**: `@param` cho từng dependency inject
  - Mọi method **public/protected**: mô tả ngắn + `@param` / `@return` / `@throws` khi có
  - **Model implement `Api\Data\*`**: getter/setter có thể chỉ `@inheritdoc` (không bắt mô tả lặp lại)
  - **Bắt buộc đầy đủ** (không chỉ `@inheritdoc`): Controller, Plugin, Observer, `Model/Service/*`, `Model/Webapi/*`, GraphQL Resolver, UI Component PHP (`Column`, `DataProvider`, `Modifier`)
  - Không chỉ lặp type hint; không bỏ docblock vì “code đã rõ”
- [ ] Không có `ObjectManager::getInstance()`
- [ ] Không có code chết, comment out, `exit`, `die`, `var_dump`, `print_r`
- [ ] Không có `new` trong business code — dùng factory/DI
- [ ] Logger: `Psr\Log\LoggerInterface`
- [ ] Constructor DI type-hint khớp parent class
- [ ] Exception cụ thể, không dùng `\Exception` chung
- [ ] Core capability đã kiểm tra trước khi tạo custom

## 2. Module Structure

- [ ] `registration.php` + `etc/module.xml` với sequence đúng
- [ ] Không có folder rỗng
- [ ] Namespace: `<Vendor>\<Module>`
- [ ] **Repository implementation**: `Model/<Entity>Repository.php` (ngang hàng `Model/<Entity>.php`). KHÔNG đặt tại `Model/<Entity>/Repository.php`. Subfolder `Model/<Entity>/` chỉ chứa concept con của entity (Status, Source, Validator, value object…) — Repository là orchestrator, không phải concept con
- [ ] **Tên class self-descriptive**: nếu mọi consumer đều phải `use ... as <X>` để rename khi import → tên class gốc sai. Sửa class, không sửa consumer
- [ ] **Module-wide config reader** (ScopeConfigInterface wrapper, decrypt secrets, build URL theo mode…): đặt tại `Model/Config.php` (theo `Magento\Paypal\Model\Config`). KHÔNG đặt vào `Gateway/Config/` (chỉ dành cho gateway-specific như `Magento\Payment\Gateway\Config\Config` cho ValueHandlerPool/CommandPool). KHÔNG đặt vào `Helper/` (anti-pattern legacy M1)
- [ ] **Helper/ folder**: tránh tạo class mới ở đây. Modern Magento ưu tiên class chuyên trách (Service, Config, ViewModel) thay vì helper "dumping ground". `Helper/Data.php` cũ nếu chỉ là thin wrapper → đề xuất xoá

## 3. Database

- [ ] `etc/db_schema.xml` (không dùng InstallSchema; **không** đặt trong `Setup/`)
- [ ] `etc/db_schema_whitelist.json`
- [ ] Tên bảng: `<vendor>_<module>_<entity>`
- [ ] Data Patch cho seed data

## 4. API / Service Contract

- [ ] Repository Interface trong `Api/` (kể cả khi internal-only, không expose REST — cho phép mock/swap, đúng convention Magento)
- [ ] Data Interface trong `Api/Data/` — chỉ bắt buộc khi entity expose REST/SOAP/GraphQL; internal-only có thể type-hint Model class (FQCN) tạm thời
- [ ] Implementation đặt tại `Model/<Entity>Repository.php` (xem section 2)
- [ ] Preference trong `di.xml` (`<preference for="...Api\<Entity>RepositoryInterface" type="...Model\<Entity>Repository"/>`)
- [ ] `webapi.xml` nếu expose REST
- [ ] Interface có `@api` + `@since`; `@param`/`@return` dùng FQCN

## 5. Frontend

- [ ] Logic trong ViewModel, không trong template
- [ ] Layout XML khai báo block đúng
- [ ] JS dùng RequireJS, CSS dùng LESS
- [ ] Admin form Save and Continue: xem [references/frontend/admin-save-and-continue.md](./references/frontend/admin-save-and-continue.md)

## 6. Plugin / Observer

- [ ] Plugin có `sortOrder`, tên đúng convention
- [ ] Hạn chế `around` plugin
- [ ] `before` plugin: không `unset()` tham số trong return array
- [ ] Observer chỉ làm 1 việc
- [ ] Observer dùng `strpos()` để filter: kiểm tra method code có bị nhận nhầm không (ví dụ `laybyland_` bắt đầu bằng `layby`)

## 7. Config (`system.xml`)

- [ ] Section riêng `<vendor>_<module>`, không nhét vào section core
- [ ] `resource` ACL hợp lệ
- [ ] `config_path` nếu đổi vị trí UI nhưng giữ key cũ
- [ ] Input type phù hợp nghiệp vụ (không mặc định `text`)
- [ ] `source_model` core ưu tiên trước custom
- [ ] Giá trị mặc định trong `config.xml`
- [ ] `cache:clean config` + `cache:flush` + verify menu path Admin

## 8. Payment Gateway (bổ sung)

- [ ] `<is_gateway>1</is_gateway>` trong `config.xml` — bắt buộc cho `Magento\Payment\Model\Method\Adapter`
- [ ] `CompositeConfigProvider` đăng ký trong `etc/frontend/di.xml`, không phải `etc/di.xml`
- [ ] `Magento\Checkout\Block\Cart\Sidebar` plugin đăng ký trong `etc/frontend/di.xml`
- [ ] `checkout_index_index.xml`: node `billing-step` có `<item name="component" xsi:type="string">uiComponent</item>`
- [ ] Nếu dùng Mageplaza OSC: tạo thêm `onestepcheckout_index_index.xml`

## 9. Testing & static analysis

- [ ] Task có business logic: unit test viết trước (TDD), đặt tại `Test/Unit/`
- [ ] Cover happy path + ít nhất 1 edge/negative case
- [ ] Mock qua `createMock()`, không dùng ObjectManager trong test
- [ ] `./vendor/bin/phpunit` → all pass
- [ ] `setup:di:compile` sau khi sửa DI
- [ ] **PHPCS** (`Magento2` standard) trên scope module: **0 errors**
  - Warnings thiếu docblock / `@param` / `@return`: **xử lý hết** trên code custom `app/code/` (không coi “chỉ warning” là pass review)
  - Copyright header: theo convention repo (nếu `app/code/` hiện không dùng copyright block → ghi nhận trong spec/status của dự án, không tự thêm lẻ tẻ một module)
- [ ] Custom carrier: verify checkout method đúng điều kiện
- [ ] Custom thay core: verify so sánh behavior

## 10. Cron + Async Payment Pitfalls (rút kinh nghiệm PaySquad)

- [ ] Cron UX rõ nghĩa với business: nếu chạy hourly thì config theo `minute` (00-59), không dùng `time` dễ gây hiểu nhầm
- [ ] `config_path` dùng cho `crontab.xml` luôn phải là cron expression hợp lệ (`* * * * *`), không lưu raw value kiểu `HH,MM,SS`
- [ ] Backend model config phải convert value UI -> cron expression, và xử lý cả format array/string
- [ ] Cron class có guard theo flag enable (defense-in-depth), không phụ thuộc hoàn toàn vào scheduler
- [ ] Verify cron bằng DB (`core_config_data`, `cron_schedule`) + lưu ý window generate (`system/cron/default/schedule_ahead_for`)
- [ ] Với API async (refund 202 Accepted): xác nhận cả request đã gửi + trạng thái eventual consistency, không kết luận fail chỉ từ UI tức thời
- [ ] Sau rename module/table: luôn có checklist migrate data cũ (ví dụ `laybyland_*` -> `secomm_*`) trước khi kết luận grid "không có dữ liệu"

## 11. Magento custom — rút kinh nghiệm triển khai

> Bổ sung từ các feature thực tế (vd. order attribute meta table). Thêm mục mới khi phát hiện lỗi lặp lại qua review.

- [ ] **Admin grid + dữ liệu động / meta table**: tránh N+1 — batch load (repository method theo danh sách ID), không query từng row trong `Column::prepareDataSource`
- [ ] **Khóa nghiệp vụ immutable sau tạo** (vd. `attribute_code`, mã định danh): disable field trên form edit (UI Component modifier), không chỉ validate khi save
- [ ] **Attribute/field do admin định nghĩa runtime**: ưu tiên bảng definition + value; **không** add/drop cột `sales_order` (hoặc bảng core) theo từng attribute
- [ ] **GraphQL tách module** (optional): resolver-only module phụ thuộc core; core vẫn chạy khi disable GraphQL module
- [ ] **Hard delete có cascade**: transaction + confirm admin; soft delete mặc định nếu nghiệp vụ cần

## 12. Review gate (trước khi báo task/feature done)

- [ ] Unit test pass (nếu task có business logic)
- [ ] Đối chiếu **checklist này** (không chỉ AC trong spec)
- [ ] Không còn issue **Critical/High** từ review
- [ ] PHPCS 0 errors; docblock warnings đã xử lý (§1, §9)
- [ ] Verify steps trong spec/task contract của dự án đã chạy — ghi Pass/Fail
- [ ] Blockers cập nhật trong spec/task contract của dự án hoặc báo cáo cuối

### Phân loại severity khi review

| Severity | Ý nghĩa | Hành động |
|---|---|---|
| **P0 / BLOCKER** | Sai correctness, security hole, mất tiền/dữ liệu, sai hợp đồng framework (vd cache no-op, callback chưa verify chữ ký) | Phải sửa trước khi merge |
| **P1 / RECOMMENDATION** | Nên sửa trong scope task — perf (N+1), thiếu invalidation một nguồn dữ liệu, thiếu runtime proof cho thay đổi framework-sensitive | Sửa hoặc ghi follow-up có owner |
| **P2 / INFORMATIONAL** | Ghi nhận, không chặn — style, naming, cải tiến infra (edge config) | Note trong báo cáo |

> Quy ước: đánh cả hai nhãn (P0/P1/P2 và BLOCKER/RECOMMENDATION/INFORMATIONAL) để client
> nào sort theo nhãn nào cũng đọc được.

## 13. Root-cause & runtime evidence (bổ sung 2026-08)

- [ ] Trước khi patch một hành vi sai: phân loại **data-vs-code** — trace dữ liệu persisted
  thật (config theo scope → entity → eligibility → rewrite → cache) trước khi kết luận code sai;
  nếu là data issue → báo data fix, không "bù" bằng code
- [ ] Module có response/DTO cache tự build: invalidation phủ **mọi nguồn dữ liệu** đi vào
  entry (product, pricing, MSI stock qua `clean_cache_by_tags`, url_rewrite, config, CMS);
  nguồn không chứng minh được → TTL có giới hạn + ghi rõ tradeoff (xem
  `references/infrastructure/cache-management.md` §10)
- [ ] Gọi `CacheInterface::clean()` luôn truyền **mảng tag thuần** (hợp đồng
  `App\Cache\Proxy`) — cấm cú pháp Zend `clean($mode, $tags)`
- [ ] Unit test dùng fixture đúng **dạng persisted thực** (category path `1/<root>/<child>`,
  url_rewrite per-store, config scope/scope_id) — không tự chế format
- [ ] Thay đổi framework-sensitive (cache/event/DI/indexer): sau unit test, có **runtime
  proof bounded** (thay đổi do mình tạo + cleanup hết) — không chỉ bằng mock
- [ ] Admin UI: tái dùng component core (ui-select cho picker category/website...), không
  tự dựng widget tree riêng

---

> Khi có dấu hỏi về cách implement: tra `magento-patterns.md` → đọc reference tương ứng.
