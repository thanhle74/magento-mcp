# Tham khảo: Upgrade & Compatibility

Nguồn:
- https://experienceleague.adobe.com/docs/commerce-operations/upgrade-guide/upgrade-compatibility-tool/install.html
- https://developer.adobe.com/commerce/php/development/versioning/dependencies/

---

## 0. Tổng quan

Upgrade Magento bao gồm 3 phần chính:
1. **Upgrade Compatibility Tool (UCT)** — phát hiện breaking changes trước khi upgrade
2. **Composer versioning** — quy tắc khai báo dependency đúng chuẩn
3. **cweagans/composer-patches** — apply patches cho vendor packages

---

## 1. Upgrade Compatibility Tool (UCT)

UCT phân tích module custom/extension so với version Magento mới, báo cáo:
- Critical issues (breaking changes)
- Errors (deprecated API usage)
- Warnings (potential issues)

### Cài đặt

```bash
composer create-project magento/upgrade-compatibility-tool uct --repository https://repo.magento.com
```

### Chạy phân tích

```bash
# Phân tích toàn bộ instance
bin/uct upgrade:check /path/to/magento --coming-version=2.4.8

# Chỉ phân tích module cụ thể
bin/uct upgrade:check /path/to/magento --coming-version=2.4.8 --module-path=app/code/Vendor/Module
```

### Đọc kết quả

```
CRITICAL: Magento\Catalog\Api\ProductRepositoryInterface::save() has been removed.
ERROR: Deprecated method Magento\Framework\Model\AbstractModel::load() called.
WARNING: Class Magento\Catalog\Model\Product has been deprecated.
```

**Ưu tiên xử lý:** Critical → Error → Warning

---

## 2. Quy trình upgrade chuẩn

```bash
# 1. Backup DB và code
mysqldump -u root -p magento > backup_$(date +%Y%m%d).sql

# 2. Enable maintenance mode
bin/magento maintenance:enable

# 3. Upgrade via Composer
composer require magento/product-community-edition=2.4.8 --no-update
composer update

# 4. Chạy upgrade scripts
bin/magento setup:upgrade

# 5. Compile DI
bin/magento setup:di:compile

# 6. Deploy static content
bin/magento setup:static-content:deploy -f

# 7. Flush cache
bin/magento cache:flush

# 8. Disable maintenance
bin/magento maintenance:disable
```

---

## 3. Composer Versioning Rules

Khi khai báo dependency trong `composer.json` của module custom:

| Cách dùng API | Version constraint |
|---|---|
| Gọi method của `@api` Interface | `~2.0` (MAJOR only) |
| Implement `@api` Interface | `~2.0.0` (MAJOR.MINOR) |
| Gọi method của class không có `@api` | `~2.0.0.0` (MAJOR.MINOR.PATCH) |
| Extend abstract class `@api` | `~2.0` (MAJOR only) |
| Add plugin vào `@api` Interface | `~2.0` (MAJOR only) |

**Ví dụ `composer.json`:**

```json
{
    "name": "vendor/module-custom",
    "require": {
        "php": "~8.3.0",
        "magento/framework": "~103.0",
        "magento/module-catalog": "~104.0",
        "magento/module-sales": "~103.0"
    }
}
```

**Quy tắc:**
- Không depend vào meta-package (`magento/product-community-edition`)
- Chỉ khai báo module thực sự dùng trong `require`
- Dùng `~` (tilde) thay vì `^` (caret) để kiểm soát chặt hơn

---

## 4. cweagans/composer-patches

Dùng để apply patch cho vendor packages mà không fork.

### Cài đặt

```bash
composer require cweagans/composer-patches
```

### Tạo patch file

```bash
# Tạo patch từ diff
diff -u vendor/magento/module-catalog/Model/Product.php.orig \
         vendor/magento/module-catalog/Model/Product.php \
         > patches/magento/module-catalog/fix-product-issue.patch
```

### Khai báo trong `composer.json`

```json
{
    "extra": {
        "patches": {
            "magento/module-catalog": {
                "Fix product issue MAGETWO-12345": "patches/magento/module-catalog/fix-product-issue.patch"
            },
            "magento/framework": {
                "Fix framework bug": "patches/magento/framework/fix-framework-bug.patch"
            }
        }
    }
}
```

### Apply patches

```bash
composer install
# hoặc
composer update --lock
```

**Best practices:**
- Đặt patch files trong `patches/` directory, commit vào git
- Đặt tên patch rõ ràng: `fix-<issue>-<ticket>.patch`
- Kiểm tra patch còn áp dụng được sau mỗi lần upgrade
- Ưu tiên dùng Quality Patches Tool (QPT) cho official patches

---

## 5. Quality Patches Tool (QPT)

QPT là tool chính thức của Adobe để apply security/quality patches:

```bash
# Cài đặt
composer require magento/quality-patches

# Xem patches có sẵn
./vendor/bin/magento-patches status

# Apply patch
./vendor/bin/magento-patches apply MDVA-12345

# Revert patch
./vendor/bin/magento-patches revert MDVA-12345
```

---

## 6. Breaking Changes thường gặp khi upgrade

| Loại thay đổi | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Interface method thêm parameter | Plugin/implementation bị lỗi | Update signature |
| Class bị deprecated | Warning, sẽ bị xóa version sau | Migrate sang class mới |
| DB schema thay đổi | Data migration cần thiết | Viết Data Patch |
| Event bị rename/remove | Observer không trigger | Update event name |
| Config path thay đổi | Config không đọc được | Update config path |

---

## 7. Checklist trước khi upgrade

- [ ] Chạy UCT và xử lý tất cả Critical issues
- [ ] Backup DB và code
- [ ] Test trên staging environment trước
- [ ] Kiểm tra tất cả patches còn apply được
- [ ] Verify third-party extensions tương thích với version mới
- [ ] Chạy full test suite sau upgrade
- [ ] Kiểm tra `setup:di:compile` không có lỗi

---

## Liên kết

- Deployment Pipeline: xem [deployment-pipeline.md](./deployment-pipeline.md)
- Testing Guide: xem [testing-guide.md](./testing-guide.md)
- Versioning & BC: xem [../../constitution.md](../../constitution.md) §14
