# Magento 2 Composer Series (Alan Storm)

Nguồn series:

- [Magento 2: Composer, Marketplace, and Satis](https://alanastorm.com/magento_2_composer_marketplace_and_local_satis_mirrors/)
- [Magento 2: Composer Plugins](https://alanastorm.com/magento_2_composer_plugins/)
- [Magento 2: Composer and Components](https://alanastorm.com/magento_2_composer_and_components/)
- [Magento, Composer, and Autoload Patterns](https://alanastorm.com/magento-composer-and-autoload-patterns/)

---

## 1. Lộ trình đọc đề xuất (đúng ngữ cảnh Magento team)

1. **Marketplace + repo.magento.com + Satis mirror**
   - Hiểu bản chất `repo.magento.com` là Composer repository theo session/account.
   - Nắm chiến lược giảm rủi ro CI/CD bằng local mirror (Satis).
2. **Composer Plugin trong Magento**
   - Hiểu vì sao file Magento xuất hiện ngoài `vendor/`.
   - Nắm plugin `magento/magento-composer-installer` và cơ chế `extra.map`.
3. **Composer + Components**
   - Hiểu module/theme/library/language pack đều là component có `registration.php`.
   - Nắm cách Magento discover component: predefined folders vs Composer `autoload.files`.
4. **Autoload patterns thực tế ngoài chuẩn**
   - Chuẩn bị cho thế giới extension hỗn tạp: PSR-4 chuẩn, nhiều namespace, PSR-0, hybrid, `extra.map`.
   - Tránh giả định cứng về cấu trúc package khi làm tooling/script.

---

## 2. Tóm tắt từng bài và ý nghĩa thực chiến

## A. Marketplace + local Satis mirror

### Điểm chính

- `repo.magento.com` không chỉ cấp core package mà còn cấp package theo quyền account (EE/license, extension đã mua).
- `create-project --repository-url=...` chỉ áp dụng cho package khởi tạo; sau đó phụ thuộc vào `repositories` trong `composer.json` của project.
- Dùng Satis để mirror giúp giảm single point of failure trong triển khai.

### Ứng dụng cho `.spec`

- Khi viết runbook deploy/DR, luôn có phương án mirror Composer repo nội bộ.
- Với project enterprise: tách rõ quy trình mirror, quyền truy cập, và chính sách bảo mật artifact.

---

## B. Composer Plugins (cách Magento đặt file ra root project)

### Điểm chính

- Composer có **scripts** (khai báo ở project root) và **plugins** (đi kèm package).
- Plugin cần:
  - `"type": "composer-plugin"`
  - `require` tới `composer-plugin-api`
  - `extra.class` trỏ class plugin
- Magento dùng plugin installer để đọc `extra.map` rồi copy file từ package ra root.

### Hệ quả kỹ thuật

- Không được patch core trực tiếp ở file được copy từ package vì có thể bị ghi đè khi `composer update`.
- Khi debug file “tự sinh” ở root, truy ngược về package nguồn và cấu hình `extra.map`.

---

## C. Composer and Components (định nghĩa component Magento 2)

### Điểm chính

- Magento 2 formalize component: một thư mục top-level + `registration.php`.
- 4 loại component: module, theme, library, language pack.
- Component được nhận diện qua:
  - Quét predefined path (`app/code`, `app/design`, `app/i18n`, `lib/internal`...)
  - Hoặc Composer `autoload.files` để include `registration.php`.

### Hệ quả kỹ thuật

- Không giả định “module luôn ở `app/code`”; package có thể nằm chỗ khác miễn đăng ký đúng.
- Tooling nội bộ (scaffold/checker) nên dựa vào `registration.php` + Composer metadata, không hard-code path.

---

## D. Autoload patterns (thực tế package ngoài thị trường)

### Điểm chính

- Đa số theo PSR-4 + `registration.php`, nhưng có nhiều biến thể:
  - Nhiều namespace/module trong cùng package
  - PSR-0 cũ
  - Đồng thời PSR-4 và PSR-0
  - `extra.map` legacy
- Không có “một pattern tuyệt đối” cho extension open-source Magento.

### Hệ quả kỹ thuật

- Viết script phân tích extension phải chịu lỗi và chấp nhận nhiều pattern autoload.
- Khi migration/upgrade, ưu tiên kiểm tra thực tế từng package thay vì suy diễn theo mẫu chuẩn.

---

## 3. Checklist áp dụng vào dự án

- [ ] Với mọi module custom: `composer.json` có `autoload.files` trỏ `registration.php` và PSR-4 rõ ràng.
- [ ] Tránh chỉnh file core được plugin map/copy ra root; nếu cần thì dùng patch strategy có kiểm soát.
- [ ] Pipeline có phương án fallback khi `repo.magento.com` không ổn định (mirror/cache nội bộ).
- [ ] Tool kiểm tra module không phụ thuộc path cứng, đọc từ metadata thực tế.
- [ ] Khi onboarding dev mới: giải thích rõ khác biệt scripts vs plugins vs installer map.

---

## 4. Mapping sang tài liệu hiện có trong `.spec`

- Versioning & compatibility: xem `versioning-compatibility.md`
- DI/Object system: xem `object-manager-series.md` và `di-codegen.md`
- Module architecture/service contracts: xem `architectural-patterns.md` và `service-contracts.md`

---

## 5. Prompt mẫu để dùng khi nhờ AI làm Composer task

```text
Dựa trên .spec/config/references/core/composer-series.md:
- Audit composer.json của module <Vendor>_<Module>
- Xác nhận registration/autoload/plugin-safe
- Chỉ ra rủi ro khi composer update (đặc biệt file map/copy ra root)
- Đề xuất thay đổi tối thiểu, kèm verify steps (composer validate, dry-run update)
```
