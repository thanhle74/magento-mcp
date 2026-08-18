# Pestle Series (Alan Storm) cho Magento 2

Tài liệu này gom 12 bài về Pestle để dùng như:

- roadmap cài đặt + cập nhật công cụ
- reference nhanh cho các lệnh generate module Magento 2
- guideline dùng Pestle an toàn trong workflow có `.spec`

Nguồn:

- [Pestle 1.1.1 Released](https://alanastorm.com/pestle-1-1-1-released/)
- [Pestle 1.1.2 Released](https://alanastorm.com/pestle-1-1-2-released/)
- [Magento 2 Setup Migration Scripts](https://alanastorm.com/magento-2-setup-migration-scripts/)
- [Pestle 1.2.1 Released](https://alanastorm.com/pestle-1-2-1-released/)
- [Sending Text Messages with PHP, pestle, and Nexmo](https://alanastorm.com/sending-text-messages-with-php-pestle-and-nexmo/)
- [Pestle 1.3 and AbstractModel UI Generation](https://alanastorm.com/pestle-1-3-and-abstractmodel-ui-generation/)
- [Pestle 1.4.1 and the Merits of Inheritance](https://alanastorm.com/pestle-1-4-1-and-the-merits-of-inheritance/)
- [Pestle 1.4.4 Released](https://alanastorm.com/pestle-1-4-4-released/)
- [Pestle Docs Done (for now)](https://alanastorm.com/pestle-docs-done-for-now/)
- [Pestle 1.4.2 Now Available](https://alanastorm.com/pestle-1-4-2-now-available/)
- [Installing Pestle via Homebrew](https://alanastorm.com/installing-pestle-via-homebrew/)
- [Pestle 1.5.2 Released](https://alanastorm.com/pestle-1-5-2-released/)

---

## 1) Lộ trình đọc đề xuất

1. Cài đặt + cập nhật: Homebrew / `selfupdate`.
2. Các release notes để nắm evolution của command set.
3. Migrations (`schema-upgrade`) và chiến lược version script.
4. CRUD + UI generation command cho admin grid/form.
5. Class-child generator và use case kế thừa constructor.

---

## 2) Những năng lực Pestle quan trọng cho project Magento

## A. Scaffolding module nhanh

- Tạo khung module/controller/menu/ACL/layout.
- Tạo script tổng hợp để generate "full module" theo pipeline chuẩn.
- Giảm thao tác lặp và lỗi gõ tay ở giai đoạn bootstrap.

## B. Hỗ trợ CRUD + Admin UI

- `magento2:generate:crud-model` cho tầng model/resource/collection cơ bản.
- Command thêm cột schema, thêm field form, thêm column grid giúp mở rộng dần mà không rewrite toàn bộ.
- Có lợi cho pattern "làm mỏng mỗi commit", nhất là khi build module demo/POC trước.

## C. Migrations workflow (kiểu versioned)

- `magento2:generate:schema-upgrade` giúp tách script upgrade theo version rõ ràng.
- Hữu ích khi maintain module qua nhiều release thay vì nhồi toàn bộ logic vào một `UpgradeSchema` lớn.

## D. Constructor inheritance helper

- `magento2:generate:class-child` giảm lỗi copy constructor khi extend core class.
- Hợp với bối cảnh Magento thực tế nơi kế thừa vẫn thường gặp trong block/controller/framework integration.

---

## 3) Cài đặt / cập nhật và vận hành

- Cập nhật nhanh: `pestle.phar selfupdate`.
- Trên macOS có thể dùng Homebrew tap để cài dễ hơn và quản lý binary ổn định hơn.
- Nếu update xong lỗi cache cục bộ, ưu tiên check cache tạm của Pestle trước khi kết luận command lỗi.

---

## 4) Cách dùng an toàn cùng `.spec` (khuyến nghị cho repo này)

- Pestle chỉ dùng để tạo boilerplate ban đầu; sau đó chuẩn hóa theo conventions trong `.spec`.
- Luôn review lại các điểm:
  - namespace/path consistency
  - ACL/resource map
  - route/frontName/controller mapping
  - DI/service contract typing
  - naming và XML structure theo blueprint trong `.spec/examples/integration/`
- Không assume output generator là "production-ready".

---

## 5) Checklist sau khi generate bằng Pestle

- [ ] `composer.json`, `registration.php`, `etc/module.xml` đúng chuẩn module.
- [ ] `setup:upgrade` chạy được, không sinh lỗi migration.
- [ ] Admin menu + ACL + route vào đúng trang.
- [ ] Grid/Form render đúng, data provider trả data đúng.
- [ ] Không còn placeholder text hoặc command boilerplate thừa.

---

## 6) Prompt mẫu để dùng với AI + Pestle

```text
Dựa trên .spec/config/references/core/pestle-series.md và các blueprint trong .spec/examples/integration:
1) Đề xuất lệnh Pestle tối thiểu để scaffold module <Vendor_Module>.
2) Sau scaffold, chuẩn hóa code theo constitution/project conventions.
3) Báo cáo: files changed, lý do thay đổi, verify steps đã chạy.
4) Nếu generator output lệch chuẩn, ưu tiên chỉnh tay theo .spec thay vì giữ nguyên.
```

---

## Liên kết nội bộ

- [Magento 2 for PHP MVC Developers](./php-mvc-developer-series.md)
- [Routing & Controllers](./routing-controllers.md)
- [Service Contracts](./service-contracts.md)
- [Data Schema & Patch](./data-schema-patch.md)
