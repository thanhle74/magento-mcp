# Constitution - Quy tắc phát triển chung

> version: 1.3.1 | last_updated: 2026-08-18  
> Thuộc **thư viện trung tâm** [`config/`](README.md) — đọc cùng `checklist.md` + `magento-patterns.md` trước mọi feature spec / code.

## Thông tin project

- Magento: 2.4.8-p5
- PHP: 8.3
- Vendor: Theo module thực tế (ví dụ: `Secomm`, `NullTraceX`)
- Namespace gốc: `<Vendor>\<ModuleName>`

---

## 1. Coding Standard

### PHP

- PHP 8.3, sử dụng typed properties, union types, named arguments khi cần
- Tuân theo PSR-1, PSR-4, PSR-12
- Strict types bắt buộc: `declare(strict_types=1);` ở mọi file PHP
- Không dùng `@suppress`, không dùng `@codingStandardsIgnore`
- Return type bắt buộc cho mọi method (kể cả `: void`)
- **Docblock bắt buộc** cho mọi class và mọi method public/protected — không được bỏ qua kể cả khi type hint đã rõ. Tối thiểu phải có mô tả ngắn 1 dòng giải thích mục đích (tiếng Anh). Không được chỉ lặp lại type hint mà không có mô tả.
- **Phân tầng docblock** (áp dụng khi review / PHPCS):
  - **Luôn đầy đủ**: class docblock; constructor `@param`; Controller, Plugin, Observer, Service, Webapi facade, GraphQL Resolver, UI Component PHP
  - **`@inheritdoc` được phép**: method public/protected của Model/Repository **chỉ** implement method đã có docblock trên `Api/` interface tương ứng
  - **Api folder**: `@api`, `@since`, `@param`/`@return` FQCN (§4)
- Spec nghiệp vụ của dự án **không** miễn trừ các rule trên — spec chỉ mô tả AC nghiệp vụ; chi tiết kiểm tra tại `checklist.md`

### Nguyên tắc thiết kế (Technical Guidelines)

- **SOLID bắt buộc:**
  - S: Mỗi class chỉ làm 1 việc.
  - O: Mở rộng bằng plugin/event, không sửa core.
  - L: Subclass phải thay thế được parent.
  - I: Interface nhỏ, cụ thể, không ép implement method thừa.
  - D: Inject dependency qua constructor, không `new` trực tiếp trong code nghiệp vụ.
- **Object Readiness:** Object phải sẵn sàng sử dụng ngay sau khi `__construct`. Không dùng hàm `init()` hoặc `load()` công khai.
- **Constructor Logic:** Chỉ chứa phép gán (assignment) và kiểm soát tham số. Không thực hiện logic nghiệp vụ hay dispatch Event trong constructor.
- **Exceptions (Ngoại lệ):**
  - Không ném generic `\Exception`. Luôn dùng loại cụ thể (vd: `LocalizedException`).
  - Không được `catch` ngoại lệ ngay trong chính hàm vừa ném nó ra.
  - Không dùng Exception để điều khiển luồng logic nghiệp vụ.
  - Khi dùng tài nguyên (file, stream), bắt buộc có `finally` để giải phóng.
- **DI (Dependency Injection):** Qua `di.xml`, KHÔNG dùng ObjectManager trực tiếp.
- **No direct instantiation policy (bắt buộc):**
  - Cấm `new` trong `Model/`, `Service/`, `Plugin/`, `Observer/`, `Controller/`, `Resolver/`, `ViewModel/`.
  - Nếu cần tạo object theo runtime data (vd secret key/token/input động), phải tạo qua factory/wrapper được inject bằng DI.
  - Ngoại lệ duy nhất: class factory/wrapper chuyên dụng của chính module để tạo object bên thứ ba; không đặt logic nghiệp vụ trong factory đó.
- **Composition hơn inheritance.**
- **::class Keyword:** Luôn dùng `ClassName::class` thay vì dùng chuỗi string cho tên class.

---

## 2. Những điều KHÔNG được làm

- KHÔNG sửa file core Magento
- KHÔNG dùng ObjectManager::getInstance() trong code (chỉ cho trong factory tạo bởi Magento)
- KHÔNG hardcode store ID, website ID, customer group ID
- KHÔNG viết logic trong template (.phtml)
- KHÔNG dùng `<preference>` khi có thể dùng plugin
- KHÔNG để code chết, code comment out
- KHÔNG dùng `exit`, `die`, `var_dump`, `print_r` trong code chính thức
- KHÔNG tạo bảng DB mà không có `etc/db_schema.xml` + `etc/db_schema_whitelist.json` (hai file này **phải** nằm dưới `etc/`, không đặt trong `Setup/`)
- KHÔNG dùng `json_encode` / `json_decode` / `serialize()` / `unserialize()` PHP trực tiếp cho JSON hoặc chuỗi hóa dữ liệu nghiệp vụ — dùng `Magento\Framework\Serialize\Serializer\Json` (inject qua DI)
- KHÔNG tạo thủ công các Factory class mà Magento tự generate (ví dụ: `ModelNameFactory`, `CollectionFactory`) — chỉ cần inject vào constructor, Magento sẽ tự tạo trong `generated/code/` khi chạy `setup:di:compile`
- KHÔNG tạo Message Queue (communication.xml, queue_publisher.xml, queue_topology.xml, queue_consumer.xml) cho webhook handler nếu không thực sự cần async — xử lý sync trong controller là đủ cho hầu hết trường hợp
- KHÔNG tạo `Observer/DataAssignObserver.php` + `events.xml` cho payment method nếu checkout không có form input cần lưu vào `additional_information` — PaySquad và các redirect-based payment không cần
- KHÔNG đặt `db_schema.xml` trong `Setup/` — phải đặt trong `etc/`; sau khi tạo hoặc sửa schema phải chạy `bin/magento setup:db-declaration:generate-whitelist --module-name=<Vendor_Module>` để tạo `etc/db_schema_whitelist.json`

---

## 3. Cấu trúc Module bắt buộc

Mỗi module  phải có tối thiểu:

```
app/code/<Vendor>/<TênModule>/
├── registration.php
├── etc/
│   └── module.xml
├── composer.json           (không bắt buộc nhưng nên có)
```

Chỉ tính năng nào cần, mới thêm folder tương ứng. Không tạo folder rỗng.

---

## 4. Ngôn ngữ và Format

- Tên class, method, variable: tiếng Anh
- Comment giải thích logic: tiếng Anh
- Commit message: tiếng Anh
- Spec, plan, task: tiếng Việt có dấu
- **Document Tags (PHPDoc):**
  - `@api`: Bắt buộc cho mọi Public Interface (`Api/`).
  - `@since`: Bắt buộc cho Interface và Method trong Api folder (ví dụ: `@since 1.0.0`).
  - `@inheritdoc`: Dùng trong class thực thi (Implementation) để kế thừa docblock từ interface.
  - **Lưu ý đặc biệt cho Web API:** Mọi `@param` và `@return` trong Public Interface phải sử dụng **Fully Qualified Class Name** (ví dụ: `\Vendor\Module\Api\Data\MyInterface` thay vì `Data\MyInterface`) để hệ thống REST/SOAP tự động nhận diện đúng kiểu dữ liệu.

---

## 5. Xử lý lỗi

- Dùng exception cụ thể (LocalizedException, NoSuchEntityException...), không dùng \Exception chung
- Log lỗi bằng Psr\Log\LoggerInterface, không dùng echo hay file_put_contents
- Validate input đầu vào, không tin tưởng dữ liệu từ frontend

---

## 6. Database

- Dùng Declarative Schema: file **`etc/db_schema.xml`** (và **`etc/db_schema_whitelist.json`** sau khi đổi schema), KHÔNG dùng InstallSchema/UpgradeSchema; KHÔNG đặt `db_schema.xml` trong `Setup/` dù URN XSD có chứa `Setup` trong tên
- Đặt tên bảng: `<vendor>_<module>_<entity>` (ví dụ: `<vendor>_employee_record`)
- Tạo Data Patch cho dữ liệu mặc định, KHÔNG dùng InstallData/UpgradeData
- Index cho các column thường query
- Biểu thức SQL trong `ResourceConnection::update()` (vd. `NOW()`, `COALESCE(...)`): dùng **`Magento\Framework\DB\Sql\Expression`**, không import trực tiếp `\Zend_Db_Expr`
- Data patch **không** ghi access token ra log/git; integration token = bước vận hành một lần/env (Admin Activate hoặc provisioner tạo token trong DB — copy vào `.env` Node)

---

## 7. Frontend

- Dùng UI Component / KnockoutJS theo chuẩn Magento
- Layout XML để khai báo block, không hardcode trong template
- CSS dùng LESS, đặt trong `view/frontend/web/css/source/`
- JS dùng RequireJS, khai báo trong `requirejs-config.js`

---

## 8. API và Service Contract

- Cung cấp API interface trong `Api/` cho mọi entity chính
- Repository pattern: `Api/<Entity>RepositoryInterface.php`
- Data interface: `Api/Data/<Entity>Interface.php`
- Search Results: `Api/Data/<Entity>SearchResultsInterface.php`
- Khai báo trong `etc/di.xml` và `etc/webapi.xml` (nếu cần expose REST/GraphQL)

---

## 9. Scope Governance (bắt buộc)

- Trước khi code, phải chốt rõ phạm vi file/module được phép sửa.
- KHÔNG sửa ngoài scope đã chốt nếu chưa được xác nhận lại.
- Nếu phát sinh sửa ngoài scope (do dependency/bug liên quan), phải báo và xin xác nhận trước khi sửa.
- Core-first rule: trước khi tạo module mới / plugin mới / API mới, bắt buộc kiểm tra Magento core hoặc module đã cài có hỗ trợ sẵn hay không.
- Nếu core đã hỗ trợ đủ yêu cầu, ưu tiên cấu hình/tích hợp lại thay vì build mới.
- Nếu vẫn cần custom mới, phải ghi rõ trong spec/plan: `vì sao core không đáp ứng` + phạm vi phần cần custom thêm.

---

## 10. Testing Policy

### Unit Test (TDD — bắt buộc cho task có business logic)

- Áp dụng TDD: **viết test trước (sẽ fail) → implement → chạy lại test (phải pass) → code review**.
- Sau khi test pass: đối chiếu **toàn bộ** `config/checklist.md` (các section liên quan scope), **không** chỉ AC trong `spec.md`.
- PHPCS (`Magento2`) trên module scope: 0 errors; warnings docblock trên `app/code/` custom phải xử lý trước khi báo done (xem `checklist.md` §9, §12).

### Blocking rules (không được bỏ qua)

- Test fail → **DỪNG**. Phân tích root cause → sửa implementation (không sửa test để "cheat") → chạy lại. Tối đa **3 lần**; nếu vẫn fail thì dừng hẳn, báo người dùng kèm phân tích nguyên nhân.
- Review còn Critical/High issue → **DỪNG**. Sửa implementation → chạy lại test → review lại. Tối đa **3 lần**; nếu vẫn còn issue thì dừng hẳn, báo người dùng kèm danh sách issue còn lại.
- Chỉ được báo task hoàn thành khi: test pass **VÀ** không còn Critical/High issue từ review.
- Framework: Magento's `\PHPUnit\Framework\TestCase` (extend từ `\Magento\TestFramework\TestCase\AbstractController` hoặc `\PHPUnit\Framework\TestCase` tùy loại).
- Đặt test tại: `Test/Unit/<mirror-path-của-class>.php`.
- **Bắt buộc unit test** cho các class có business logic:
  - `Service/`, `Model/` (logic), `Validator/`, `Plugin/`, `Observer/`, `Carrier/collectRates`
  - Config reader có transform/normalize logic
- **Không bắt buộc unit test** cho:
  - Scaffold (registration, module.xml), Controller routing, Layout/Template, i18n, Data Patch đơn giản
- Mỗi unit test phải cover tối thiểu: happy path + 1 edge/negative case.
- Mock dependency qua `createMock()` / `getMockBuilder()`; không dùng ObjectManager trong test.

### Verify steps (mọi task)

- Mỗi task phải có verify steps rõ ràng (command + manual steps nếu có).
- Với feature thay đổi behavior nghiệp vụ, bắt buộc có testcase tối thiểu theo nhóm:
  - Happy path
  - Edge case
  - Negative case
- Kết quả verify phải được báo theo testcase: Pass/Fail + ghi chú ngắn.

---

## 11. Definition of Done (DoD)

Task chỉ được xem là hoàn thành khi đạt đủ:

1. Đúng acceptance criteria trong spec/task contract.
2. Không vi phạm rule trong constitution + magento-patterns.
3. Unit test đã viết (nếu task thuộc nhóm bắt buộc) và pass.
4. **checklist.md** đã chạy đủ section liên quan (§0, §1, §2, …) — không còn issue Critical/High.
5. Đã chạy verify steps và báo kết quả rõ ràng.
6. Báo cáo cuối có đủ:
  - Files changed
  - Lý do thay đổi
  - Verify steps đã chạy
  - Kết quả testcase

---

## 12. Git/PR Convention

- Branch name (khuyến nghị): `<type>/<feature-kebab-case>` (ví dụ: `feat/product-shipping-method`).
- Commit message: tiếng Anh, ngắn gọn, nêu rõ ý nghĩa thay đổi.
- PR description tối thiểu:
  - Mục tiêu business
  - Scope thay đổi
  - Test/verify đã chạy
  - Rủi ro còn lại (nếu có)

---

## 13. Security & Performance Baseline

- Không log dữ liệu nhạy cảm (token, password, secret key, PII không cần thiết).
- Luôn validate input nhận từ frontend/API trước khi xử lý.
- Tránh N+1 query và query không có index ở các luồng đọc lớn.
- Chỉ thêm cache khi có lợi ích rõ ràng và có invalidation strategy phù hợp.
- Với external integration/API call: có timeout hợp lý và xử lý lỗi rõ ràng.

---

## 14. Versioning & Backward Compatibility

- Tránh breaking changes trên interface/public API nếu không có kế hoạch migration.
- Nếu buộc phải thay đổi behavior public:
  - Ghi rõ impact trong spec/task
  - Nêu phương án tương thích hoặc migration
  - Cập nhật tài liệu liên quan

---

## 15. Proactive Analysis & Advisory (bắt buộc)

- Trước khi code: nêu rõ hiểu biết requirement (requirement understanding), rủi ro thấy trước, và các phương án (nếu có nhiều cách làm).
- Chủ động cảnh báo rủi ro / edge case, không chờ được hỏi.
- Thiếu thông tin để quyết định → hỏi lại, không tự đoán.
- Sau mỗi bước lớn: đề xuất next best action tiếp theo.

## 16. Payment Method — Quy tắc riêng

- **Redirect-based payment** (PaySquad, Afterpay, Humm...): không cần `DataAssignObserver` + `events.xml` vì không có form input ở checkout.
- **Factory auto-generated**: `ModelNameFactory`, `CollectionFactory` — KHÔNG tạo thủ công, Magento tự generate khi `setup:di:compile`.
- **Webhook handler**: ưu tiên xử lý sync trong controller trước. Chỉ dùng Message Queue khi có yêu cầu rõ ràng về async (ví dụ: handler chạy > 10s, hoặc cần retry độc lập).
- **db_schema_whitelist.json**: bắt buộc generate sau mỗi lần tạo/sửa `db_schema.xml` bằng lệnh `bin/magento setup:db-declaration:generate-whitelist --module-name=<Vendor_Module>`.

## Liên kết

- Các pattern chi tiết Magento: xem [magento-patterns.md](./magento-patterns.md)
- Checklist trước khi hoàn thành: xem [checklist.md](./checklist.md)

