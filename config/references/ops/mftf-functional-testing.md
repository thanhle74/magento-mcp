# MFTF Functional Testing (Adobe Commerce)

Tài liệu này gom phần Functional Testing Framework (MFTF) theo hướng triển khai thực tế cho team.

Nguồn:

- [Functional Testing Framework - Introduction](https://developer.adobe.com/commerce/testing/functional-testing-framework/)
- [Getting Started](https://developer.adobe.com/commerce/testing/functional-testing-framework/getting-started)
- [Configuration](https://developer.adobe.com/commerce/testing/functional-testing-framework/configuration)
- [Git vs Composer Installation](https://developer.adobe.com/commerce/testing/functional-testing-framework/git-vs-composer-install)
- [How to use in CI/CD](https://developer.adobe.com/commerce/testing/functional-testing-framework/cicd)
- [Debugging Functional Tests](https://developer.adobe.com/commerce/testing/functional-testing-framework/debugging)
- [Interactive Pause](https://developer.adobe.com/commerce/testing/functional-testing-framework/interactive-pause)
- [Extending Functional Tests](https://developer.adobe.com/commerce/testing/functional-testing-framework/extending)
- [Input Testing Data](https://developer.adobe.com/commerce/testing/functional-testing-framework/data)
- [Custom Helpers](https://developer.adobe.com/commerce/testing/functional-testing-framework/custom-helpers)
- [Credentials](https://developer.adobe.com/commerce/testing/functional-testing-framework/credentials)
- [Two-factor authentication](https://developer.adobe.com/commerce/testing/functional-testing-framework/two-factor-authentication)
- [Merge points for testing extensions](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/)
- [Merge Tests](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/merge-tests)
- [Merge Sections](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/merge-sections)
- [Merge Pages](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/merge-pages)
- [Merge Data](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/merge-data)
- [Merge Action Groups](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/merge-action-groups)
- [Extend Tests](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/extend-tests)
- [Extend Data](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/extend-data)
- [Extend Action Groups](https://developer.adobe.com/commerce/testing/functional-testing-framework/merge-points/extend-action-groups)
- [Page structure](https://developer.adobe.com/commerce/testing/functional-testing-framework/page)
- [Section structure](https://developer.adobe.com/commerce/testing/functional-testing-framework/section/)
- [Parameterized selectors](https://developer.adobe.com/commerce/testing/functional-testing-framework/section/parameterized-selectors)
- [Locator functions](https://developer.adobe.com/commerce/testing/functional-testing-framework/section/locator-functions)
- [Metadata](https://developer.adobe.com/commerce/testing/functional-testing-framework/metadata)
- [Merging](https://developer.adobe.com/commerce/testing/functional-testing-framework/merging)
- [Suites](https://developer.adobe.com/commerce/testing/functional-testing-framework/suite)
- [Functional test cases (`<tests>`, `<test>`, `<before>`, `<after>`)](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/)
- [Test actions](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/actions)
- [Assertions](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/assertions)
- [Action groups](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/action-groups)
- [Action group best practices](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/action-group-best-practices)
- [Annotations](https://developer.adobe.com/commerce/testing/functional-testing-framework/test/annotations)
- [Test writing overview](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/)
- [Test writing best practices](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/best-practices)
- [Test preparation](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/test-prep)
- [Using suites](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/using-suites)
- [Tips and tricks](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/tips-tricks)
- [Test modularity](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/test-modularity)
- [Test isolation](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/test-isolation)
- [Selectors guide](https://developer.adobe.com/commerce/testing/functional-testing-framework/test-writing/selectors)
- [Resources (changelog + contribution)](https://developer.adobe.com/commerce/testing/functional-testing-framework/resources/)
- [Backward-incompatible changes](https://developer.adobe.com/commerce/testing/functional-testing-framework/backward-incompatible-changes)
- [Functional test modules and packaging](https://developer.adobe.com/commerce/testing/functional-testing-framework/mftf-tests-packaging)
- [Versioning](https://developer.adobe.com/commerce/testing/functional-testing-framework/versioning)
- [Update framework](https://developer.adobe.com/commerce/testing/functional-testing-framework/update)
- [Troubleshooting](https://developer.adobe.com/commerce/testing/functional-testing-framework/troubleshooting)
- [CLI reference](https://developer.adobe.com/commerce/testing/functional-testing-framework/commands/)
- [MFTF CLI commands](https://developer.adobe.com/commerce/testing/functional-testing-framework/commands/mftf)
- [Codecept CLI commands](https://developer.adobe.com/commerce/testing/functional-testing-framework/commands/codeception)
- [Reporting](https://developer.adobe.com/commerce/testing/functional-testing-framework/reporting)

---

## 1) MFTF dùng khi nào?

- Cần kiểm thử end-to-end flow admin/storefront ở góc nhìn người dùng.
- Cần regression suite sau upgrade Magento hoặc sau refactor lớn.
- Cần xác nhận custom module không phá flow chuẩn.

Không thay thế cho unit/integration:

- Unit/Integration bắt bug kỹ thuật sâu hơn, chạy nhanh hơn.
- MFTF bắt lỗi integration theo hành vi thực tế.

---

## 2) Vị trí test materials (rất quan trọng)

MFTF merge dữ liệu theo thứ tự:

1. `app/code/<Vendor>/<Module>/Test/Mftf/`
2. `vendor/<Vendor>/<Module>/Test/Mftf/`
3. `dev/tests/acceptance/tests/functional/<Vendor>/<Module>/`

Kết luận thực dụng:

- Module custom của bạn: ưu tiên đặt test ở `app/code/.../Test/Mftf/`.
- Tránh sửa trực tiếp trong `vendor/`.

---

## 3) Quick start commands

Tại root Magento:

```bash
vendor/bin/mftf --version
vendor/bin/mftf build:project
vendor/bin/mftf generate:tests
vendor/bin/mftf run:test AdminLoginSuccessfulTest --remove
```

Chạy theo scope:

- `vendor/bin/mftf run:test <TestName>`
- `vendor/bin/mftf run:group <GroupName>`
- `vendor/bin/mftf run:manifest <manifest-file>`
- `vendor/bin/mftf run:failed`

---

## 4) CLI strategy: dùng `mftf` hay `codecept`?

Nguyên tắc:

- Ưu tiên `vendor/bin/mftf ...` cho workflow chính (generate/run/failed/group/manifest).
- Chỉ dùng `codecept` trực tiếp khi có nhu cầu debug nâng cao và hiểu rõ rủi ro workflow.

Lệnh `mftf` quan trọng nên nhớ:

- `build:project`
- `doctor`
- `generate:tests` / `generate:suite`
- `run:test` / `run:group` / `run:manifest` / `run:failed`
- `static-checks`
- `codecept:run` (wrapper an toàn hơn gọi codecept trực tiếp)

---

## 5) Cấu hình môi trường tối thiểu (`dev/tests/acceptance/.env`)

Biến bắt buộc:

- `MAGENTO_BASE_URL`
- `MAGENTO_BACKEND_NAME`
- `MAGENTO_ADMIN_USERNAME`
- `MAGENTO_ADMIN_PASSWORD` (qua credentials storage)

Thường dùng thêm:

- `BROWSER`
- `WAIT_TIMEOUT`
- `ENABLE_PAUSE`
- `SELENIUM_*` khi selenium ở host khác

Lưu ý:

- Nếu base URL có subdirectory, cấu hình `MAGENTO_CLI_COMMAND_PATH`.
- Đảm bảo web server cho phép MFTF gọi command endpoint theo hướng dẫn Adobe.

---

## 6) Page + Section structure (xương sống MFTF)

## A. Page

- `Page` định nghĩa URL và danh sách `Section` của trang.
- Tránh hardcode URL/selector trực tiếp trong test.
- Hỗ trợ page explicit và parameterized URL.

## B. Section

- `Section` là nơi định nghĩa element selector tái sử dụng.
- Có thể khai báo `parameterized="true"` để truyền biến vào selector.
- Có thể dùng `locatorFunction` thay selector thường cho case đặc biệt.

Nguyên tắc maintainable:

- Selector tập trung ở `Section`, test chỉ gọi tham chiếu `{{Section.element}}`.
- Mỗi lần UI đổi, sửa một nơi thay vì sửa hàng loạt test.

---

## 7) Test case structure (`<tests>`, `<test>`, `<before>`, `<after>`)

Format tối thiểu:

```xml
<tests ...>
    <test name="MyFlowTest">
        <annotations>...</annotations>
        <before>...</before>
        <!-- actions / actionGroup / assertions -->
        <after>...</after>
    </test>
</tests>
```

Nguyên tắc quan trọng:

- Mỗi file test chỉ nên có 1 `<test>` để dễ bảo trì/merge.
- `stepKey` phải unique trong phạm vi test và đặt tên camelCase có nghĩa.
- `<before>` và `<after>` áp dụng theo từng test, không phải global.
- `<after>` luôn chạy cả khi test fail, nên để cleanup an toàn ở đây.

---

## 8) Actions + Assertions (thực hành ngắn gọn)

### A. Actions

- `stepKey` là bắt buộc, ưu tiên đặt cuối tag để đọc nhanh.
- Dùng `before`/`after` khi merge để chèn step theo `stepKey` có sẵn.
- Nhóm action nên dùng nhiều:
  - UI core: `amOnPage`, `click`, `fillField`, `waitForPageLoad`, `waitForElementVisible`.
  - Data/API: `createData`, `getData`, `updateData`, `deleteData`.
  - Runtime values: `grabTextFrom`, `grabValueFrom`, `grabFromCurrentUrl`, `executeJS`, `getOTP`.

### B. Assertions

- Assertions dùng cùng pattern `stepKey`, `before`, `after`, và thường có `message`.
- Dùng `<expectedResult>` + `<actualResult>` để đọc rõ dữ liệu so sánh.
- `type` thường gặp: `string`, `int`, `float`, `bool`, `variable`, `array`.
- Khi assert theo giá trị đã grab ở step trước, dùng biến `{$stepKey}`.

Ví dụ:

```xml
<grabTextFrom selector="#elementId" stepKey="grabName"/>
<assertEquals message="Tên hiển thị không đúng" stepKey="assertName">
    <expectedResult type="string">Expected Name</expectedResult>
    <actualResult type="string">{$grabName}</actualResult>
</assertEquals>
```

---

## 9) Action Groups + best practices

Nguyên tắc:

- Đặt tại `<Module>/Test/Mftf/ActionGroup/`.
- Tên file kết thúc bằng `ActionGroup.xml`.
- Chỉ 1 `<actionGroup>` cho mỗi file.
- Tên action group nên khớp tên file (không tính `.xml`).

Khi nào dùng:

- Có chuỗi action lặp lại nhiều test (login admin, tạo sản phẩm, checkout step...).
- Muốn giảm duplication và giảm chi phí bảo trì khi UI thay đổi.

Best practices:

- Ưu tiên compose từ action group sẵn có trước khi viết mới.
- Tách action group lớn thành nhóm nhỏ theo intent:
  - điều hướng,
  - nhập dữ liệu,
  - submit + assert.
- Dùng `extends` để tạo biến thể riêng; dùng merge khi muốn thay đổi behavior global.
- Có thể trả về giá trị bằng `<return>` để truyền qua step sau.

---

## 10) Annotations (Allure + Codeception)

Khuyến nghị tối thiểu cho mỗi test:

- `stories`
- `title`
- `description`
- `severity`

Nên dùng thêm `group` để chạy theo scope nghiệp vụ (`run:group`), và `skip` + `issueId` khi cần tạm bỏ test có lý do.

Ví dụ:

```xml
<annotations>
    <stories value="Category Creation"/>
    <title value="Create Category From Admin"/>
    <description value="Login admin và tạo category mới."/>
    <severity value="CRITICAL"/>
    <group value="category"/>
</annotations>
```

---

## 11) Metadata (createData/deleteData/updateData/getData)

Metadata mô tả cách MFTF map `Data` entity -> HTTP request (REST hoặc form) cho các action dữ liệu:

- `<createData .../>`
- `<deleteData .../>`
- `<updateData .../>`
- `<getData .../>`

Điểm then chốt:

- `entity type` trong Data phải khớp `operation dataType` trong Metadata.
- Metadata cho phép định nghĩa `auth`, `url`, `method`, `contentType`, request body schema.
- Có thể lấy dữ liệu response qua biến theo `stepKey` (ví dụ `$createStep.id$`).

Dùng khi:

- Cần seed/cleanup data chuẩn thay vì thao tác UI cho mọi precondition.

---

## 12) Credentials và secrets

MFTF hỗ trợ:

- file `.credentials`
- HashiCorp Vault
- AWS Secrets Manager

Precedence:

`.credentials` > Vault > AWS Secrets Manager

Trong test XML:

```xml
<fillField selector=".api-token" userInput="{{_CREDS.vendor/my_data_key}}" />
```

Quy tắc:

- Không commit secrets.
- Tách dữ liệu nhạy cảm khỏi XML test.
- Dùng `_CREDS` thay vì hardcode token/password.

---

## 13) 2FA trong MFTF

Khi bật 2FA admin:

- Cấu hình provider + leeway theo hướng dẫn Adobe.
- Set shared secret cho admin user.
- Lưu secret trong credentials storage tại key:
  - `magento/tfa/OTP_SHARED_SECRET`
- Dùng action `getOTP` trong test để nhập mã OTP runtime.

---

## 14) Reporting + Allure

Artifacts mặc định ở:

- `dev/tests/acceptance/tests/_output/`
- `allure-results/`
- file `failed` (danh sách test fail)

Lệnh thường dùng:

```bash
allure serve dev/tests/acceptance/tests/_output/allure-results/
allure generate dev/tests/acceptance/tests/_output/allure-results --clean -o dev/tests/acceptance/tests/_output/allure-report
allure open dev/tests/acceptance/tests/_output/allure-report
```

Khuyến nghị:

- Luôn đính kèm artifact path khi báo fail.
- Dùng `run:failed` để loop fix nhanh.

---

## 15) Debug test nhanh

## A. Interactive pause

- Bật `ENABLE_PAUSE=true`.
- Thêm `<pause />` tại step cần debug.
- Có thể pause tự động khi test fail.

## B. PhpStorm debug

- Cấu hình Codeception + working dir `dev/tests/acceptance/`.
- Dùng group riêng (ví dụ `testDebug`) để chạy đúng test đang sửa.

---

## 16) Suites (gom test theo điều kiện chạy)

Suites dùng để:

- gom test theo precondition/postcondition dùng chung,
- include/exclude theo test/group/module,
- tối ưu regression run theo chủ đề.

Lưu ý:

- Suite có `<before>` thì phải có `<after>` để hoàn nguyên state.
- Test đã nằm suite custom sẽ không xuất hiện trong default suite.

---

## 17) Tái sử dụng test bằng `extends`

MFTF hỗ trợ extend:

- `<test extends="...">`
- `<actionGroup extends="...">`
- `<entity extends="...">`

Dùng cho:

- thay 1-2 step/action/data thay vì copy nguyên XML.
- giảm duplication trong regression suite.

---

## 18) Merge vs Extend (cực quan trọng cho extension)

MFTF hỗ trợ 2 cách tùy biến:

- **Merge**: chèn/sửa trực tiếp vào object hiện có (test/action group/data/page/section).
- **Extend**: tạo object mới dựa trên object gốc, không làm thay đổi object gốc.

Chọn nhanh:

- Dùng **merge** khi muốn mọi test dùng object gốc đều nhận thay đổi mới.
- Dùng **extend** khi muốn tạo biến thể riêng cho extension, tránh ảnh hưởng test hiện có.

## Các merge points chính

- Merge Action Groups
- Merge Data
- Merge Pages
- Merge Sections
- Merge Tests

## Khi nào ưu tiên extends

- Bạn cần test extension-specific flow nhưng vẫn giữ nguyên behavior core test.
- Bạn muốn giảm rủi ro regression do thay đổi object dùng chung.
- Bạn cần tạo “phiên bản mở rộng” có annotation/title/assert riêng.

Quy tắc an toàn:

- Nếu chưa chắc phạm vi ảnh hưởng, **ưu tiên extends trước merge**.
- Chỉ merge khi đã xác nhận mục tiêu là thay đổi behavior dùng chung.

---

## 19) Data trong MFTF

Nguồn dữ liệu thường dùng:

- Entity data (`{{Entity.key}}`)
- Env (`{{_ENV.MAGENTO_ADMIN_USERNAME}}`)
- Credentials (`{{_CREDS.vendor/key}}`)
- Persisted step data (`$stepKey.field$`)
- Grabbed runtime value (`$grabStepKey`)

Khuyến nghị:

- `stepKey` nên mô tả rõ và unique để tránh đụng tham chiếu.
- Tách Data entity ra file riêng để tái sử dụng.

---

## 20) Parameterized selector + locatorFunction (mẹo tránh selector cứng)

- Dùng `parameterized="true"` cho selector cần input động.
- Tham chiếu theo dạng:
  - `{{Section.element(param1, param2)}}`
- Dùng `locatorFunction` cho các case selector khó diễn tả bằng CSS/XPath tĩnh.

Quy tắc:

- Không hardcode selector phức tạp trực tiếp trong test.
- Ưu tiên đưa logic locate vào section element để test readable hơn.

---

## Bổ sung) Test-writing playbook (suites, isolation, modularity, selectors)

### A. Chuẩn bị test (test-prep)

Luồng trừu tượng hóa chuẩn:

1. Viết test thô chạy được (có thể hardcode).
2. Tách selector sang `Section/Page`.
3. Tách input data sang `Data entity` (ưu tiên `unique="suffix"` cho key cần unique).
4. Đóng gói action thành `ActionGroup`.

Kết quả mong muốn: test cuối cùng ngắn, readable, chủ yếu gọi action groups.

### B. Suites thực chiến

- Dùng suite khi nhiều test cần chung precondition/postcondition cấp môi trường.
- Đặt suite:
  - cross-module: `dev/tests/acceptance/tests/_suite`
  - single-module: `<Module>/Test/Mftf/Suite`
- Dùng `<include>` / `<exclude>` theo `test`, `group`, `module`.
- Command chính:
  - `vendor/bin/mftf generate:suite <suiteName>`
  - `vendor/bin/mftf run:group <suiteName>`

### C. Isolation (bắt buộc)

- Mọi `createData` trong test/before phải có `deleteData` tương ứng trong `after`.
- Mọi thay đổi config bằng `magentoCLI config:set` phải restore về state ban đầu trong `after`.
- Ưu tiên config bằng `magentoCLI`, tránh chỉnh config qua UI nếu không test chính UI config đó.
- Nguyên tắc: test không để lại dữ liệu/config ảnh hưởng test sau.

### D. Modularity (sở hữu đúng module)

- Test materials phải thuộc đúng module “owner”.
- Tránh tham chiếu chéo material từ module có thể bị disable mà không có dependency phù hợp.
- Chạy `vendor/bin/mftf static-checks` để bắt lỗi ownership/dependency sớm.

### E. Selector hygiene

- Ưu tiên CSS trước XPath khi có thể.
- Thứ tự ưu tiên selector: id/name/class unique -> CSS phức hợp -> XPath.
- Tránh selector auto-copy từ browser (quá sâu, brittle).
- Tránh selector quá chung hoặc quá đặc hiệu.
- Tránh hardcoded index; ưu tiên parameterized selector.
- Không dựa vào `@data-bind`.
- Với XPath text, thường ưu tiên `contains(text(), '...')` khi không cần exact match tuyệt đối.

### F. Mẹo viết test nhanh mà bền

- Ưu tiên `actionGroup` thay vì nhét action trực tiếp trong test.
- Luôn set `defaultValue` cho argument của action group khi hợp lý.
- Trong `after`, chạy cleanup non-UI trước (CLI/deleteData), UI cleanup sau.
- Dùng `see` để verify text content; `seeElement` để verify tồn tại/visible.
- Dùng `checkOption` / `uncheckOption` thay vì `click` cho checkbox.

---

## Bổ sung) Framework lifecycle playbook (versioning, update, packaging, troubleshooting)

### A. Versioning cần nhớ

- MFTF theo SemVer: `X.Y.Z`.
- `Z` (patch): thay đổi tương thích ngược.
- `Y` (minor): thêm tính năng tương thích ngược; có thể kèm deprecation.
- `X` (major): có thể có backward-incompatible changes, cần review kỹ trước khi nâng.

Kiểm tra version hiện tại:

```bash
vendor/bin/mftf --version
```

### B. Update framework an toàn

Patch/minor flow:

1. `composer update magento/magento2-functional-testing-framework --with-dependencies`
2. `vendor/bin/mftf build:project`
3. `vendor/bin/mftf generate:tests`

Khi có thay đổi schema hoặc nâng major:

1. Đọc BIC/changelog trước.
2. Chạy `vendor/bin/mftf upgrade:tests`.
3. Regenerate URN catalog nếu cần:
   - `vendor/bin/mftf generate:urn-catalog .idea/misc.xml`

### C. Backward-incompatible checklist

Các điểm dễ gãy khi nâng major:

- Mỗi file `ActionGroup/Page/Section/Test/Suite` chỉ 1 entity.
- Suite không còn hỗ trợ `<module file="..."/>`.
- Metadata đổi naming sang `*Meta.xml`.
- Assertion phải dùng nested syntax (`<expectedResult>` + `<actualResult>`).
- Action cũ bị bỏ:
  - `executeInSelenium`, `performOn` -> thay bằng `helper`
  - `pauseExecution` -> thay bằng `pause`
- Một số assert cũ bị remove/đổi behavior theo PHPUnit 9.

### D. Test packaging / module paths

Predefined paths:

- `app/code/<Vendor>/<Module>/Test/Mftf`
- `dev/tests/acceptance/tests/functional/<Vendor>/<TestModule>`
- `vendor/<Vendor>/<Module>/Test/Mftf`
- `vendor/<Vendor>/<TestModule>`

Lưu ý:

- Test module ở `dev/tests/...` hoặc `vendor/<Vendor>/<TestModule>` nên có `composer.json` type `magento2-functional-test-module`.
- Định nghĩa dependency module qua `suggest` đúng format để MFTF resolve ownership/dependency.

### E. Troubleshooting nhanh

- Lỗi `AcceptanceTester class doesn't exist`:
  - chạy lại `vendor/bin/mftf build:project`.
  - nếu framework cũ (<2.5.0), kiểm tra quote cho `SELENIUM_*` trong `functional.suite.yml`.
- Tránh PhantomJS; ưu tiên Headless Chrome cho headless runs.
- Sau update lớn, nếu generate fail: thường do XML schema mismatch -> rà lại tag/attribute deprecated.

### F. Resources để theo dõi thay đổi

- Theo dõi release notes/changelog của MFTF định kỳ.
- Trước mỗi đợt upgrade Magento hoặc framework lớn, đọc trước trang BIC + Update guide.

---

## 21) Custom Helper (chỉ khi bất khả kháng)

Adobe khuyến nghị:

- Chỉ viết custom helper khi built-in actions không đáp ứng được.
- Đặt tại `<Module>/Test/Mftf/Helper`.
- Giữ helper nhỏ, rõ input/output, tránh nhét logic nghiệp vụ dài.

---

## 22) CI/CD flow gợi ý

Luồng chuẩn:

1. Chuẩn bị Magento instance + config baseline.
2. `mftf generate:tests` (single hoặc `--config parallel`).
3. Chạy `run:manifest` theo node/group.
4. Thu thập artifacts `_output`.
5. Chạy `run:failed` (nếu cần).
6. Generate Allure report.

---

## 23) Checklist “Done” cho task có MFTF

- [ ] Có test cho happy path chính.
- [ ] Có ít nhất 1 assertion cho kết quả business quan trọng.
- [ ] Mỗi test có annotations tối thiểu: stories/title/description/severity.
- [ ] Không hardcode credentials nhạy cảm trong XML.
- [ ] Nếu có `createData`, đã có cleanup `deleteData` tương ứng trong `after`.
- [ ] Nếu có đổi config, đã restore config về trạng thái ban đầu trong `after`.
- [ ] Nếu test trùng nhiều phần, đã cân nhắc `extends` trước khi merge.
- [ ] Đã xác nhận rõ thay đổi này nên là merge (ảnh hưởng global) hay extend (biến thể riêng).
- [ ] Đã cân nhắc tách action group lớn thành nhóm nhỏ để tái sử dụng.
- [ ] Selector mới tuân thủ nguyên tắc ổn định (không auto-copy, không quá chung/quá đặc hiệu).
- [ ] Nếu có nâng MFTF version, đã đọc changelog/BIC và xử lý schema deprecations liên quan.
- [ ] `build:project` + `generate:tests` chạy pass sau update.
- [ ] Có command chạy lại nhanh (`run:test` hoặc group/manifest).
- [ ] Báo cáo kèm artifact path khi fail.

---

## 24) Prompt mẫu giao AI viết/chỉnh MFTF

```text
Đọc `.spec/config/constitution.md`, `.spec/config/references/ops/testing-guide.md`
và `.spec/config/references/ops/mftf-functional-testing.md`.
Tạo/chỉnh MFTF test cho flow <flow_name> trong module <Vendor_Module>.
Ưu tiên tái sử dụng action group/data entity, tránh copy XML dư thừa.
Đảm bảo test có annotations tối thiểu: stories/title/description/severity.
Đảm bảo isolation: cleanup createData/config trong after, không để lại state bẩn.
Tuân thủ selector hygiene và modularity (đúng ownership module).
Nếu task có update MFTF/framework, kiểm tra BIC và compatibility trước khi sửa test.
Quyết định rõ dùng merge hay extends và nêu lý do (phạm vi ảnh hưởng).
Không hardcode secrets; dùng `_CREDS` khi cần.
Báo cáo:
1) files changed
2) command đã chạy
3) kết quả
4) artifact/debug note nếu fail
```

---

## Liên kết nội bộ

- Testing tổng quan: [testing-guide.md](./testing-guide.md)
- Unit + Static: [unit-testing.md](./unit-testing.md)
