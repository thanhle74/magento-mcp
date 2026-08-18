# Tham khảo: Object Manager Pool & Generated Code

Nguồn:
- https://developer.adobe.com/commerce/php/development/components/object-manager — đã refactor theo constitution
- https://developer.adobe.com/commerce/php/development/build/dependency-injection-file/ — di.xml areas
- https://developer.adobe.com/commerce/php/development/build/component-load-order — module sequence

---

## 1. Object Manager Pool — shared vs non-shared instance

### Singleton (shared=true — mặc định)

Object Manager trả về **cùng một instance** cho mọi request trong cùng một request lifecycle.

```xml
<!-- Mặc định: shared=true (singleton) -->
<type name="Vendor\Module\Service\MyService">
    <!-- không cần khai báo shared, mặc định là true -->
</type>
```

```php
// Cả hai lần inject đều nhận cùng instance
public function __construct(
    private readonly MyService $serviceA,  // instance #1
    private readonly MyService $serviceB   // cùng instance #1
) {}
```

**Dùng cho:** Service, Repository, Helper, Logger — các class không có state thay đổi theo request.

### Transient (shared=false)

Object Manager tạo **instance mới** mỗi lần được yêu cầu.

```xml
<type name="Vendor\Module\Model\MyModel" shared="false">
    <arguments>
        <argument name="adapter" xsi:type="object" shared="false">
            Vendor\Module\Model\Adapter
        </argument>
    </arguments>
</type>
```

**Dùng cho:** Model (entity), DataObject, các class có state riêng biệt theo từng use case.

> **Thực tế:** Hầu hết Model trong Magento là non-shared vì mỗi entity cần state độc lập. Đó là lý do phải dùng Factory thay vì inject trực tiếp Model.

### Scope của singleton

Singleton trong Magento chỉ tồn tại trong **một PHP process** (một HTTP request hoặc một CLI command). Không có shared state giữa các request.

---

## 2. Generated Code — Interceptor, Factory, Proxy

### Interceptor

Được tạo tự động khi class có plugin. Kế thừa class gốc và override tất cả public method để điều phối plugin chain.

```
generated/code/Vendor/Module/Model/Product/Interceptor.php
```

**Khi nào regenerate:**
- Thêm/sửa/xóa plugin trong `di.xml`
- Thay đổi method signature của class bị plugin
- Thêm method public mới vào class bị plugin

### Factory

Được tạo tự động khi inject `SomeClass\Factory` hoặc `SomeInterface\Factory`.

```
generated/code/Vendor/Module/Model/ProductFactory.php
```

**Khi nào regenerate:**
- Thay đổi constructor signature của class được factory tạo
- Thêm Factory mới vào di.xml

### Proxy

Được tạo tự động khi khai báo `SomeClass\Proxy` trong di.xml.

```
generated/code/Vendor/Module/Service/HeavyService/Proxy.php
```

**Khi nào regenerate:**
- Thay đổi constructor signature của class gốc
- Thêm Proxy mới vào di.xml

---

## 3. Khi nào cần regenerate

| Thay đổi | Cần regenerate |
|---------|---------------|
| Thêm plugin mới | ✅ |
| Sửa sortOrder plugin | ✅ |
| Thêm method public vào class có plugin | ✅ |
| Thay đổi constructor của class có Factory/Proxy | ✅ |
| Thêm module mới | ✅ |
| Chỉ sửa logic bên trong method | ❌ |
| Sửa template/layout | ❌ |
| Sửa config.xml/system.xml | ❌ |

### Commands

```bash
# Development mode: tự động regenerate khi cần (chậm hơn)
bin/magento deploy:mode:set developer

# Xóa generated code của module cụ thể (nhanh hơn full compile)
rm -rf generated/code/Vendor/Module/

# Full compile (production/staging)
bin/magento setup:di:compile

# Sau compile, clear cache
bin/magento cache:flush
```

---

## 4. Troubleshoot generated code

### Lỗi: "Interceptor generation error: read-only directory"

```bash
# Fix permissions
chmod -R 777 generated/
# Hoặc
chown -R www-data:www-data generated/
```

### Lỗi: "Class not found" sau khi thêm plugin

```bash
# Xóa generated code của class bị ảnh hưởng
rm -rf generated/code/Magento/Catalog/Model/Product/

# Trong developer mode: Magento tự regenerate khi request tiếp theo
# Trong production mode: phải compile lại
bin/magento setup:di:compile
```

### Lỗi: "Circular dependency" khi compile

Nguyên nhân: Class A inject B, B inject A (trực tiếp hoặc gián tiếp).

```bash
# Xem dependency tree
bin/magento dev:di:info "Vendor\Module\Service\MyService"
```

Giải pháp: Dùng Proxy cho một trong hai bên:
```xml
<type name="Vendor\Module\Service\ServiceA">
    <arguments>
        <argument name="serviceB" xsi:type="object">
            Vendor\Module\Service\ServiceB\Proxy
        </argument>
    </arguments>
</type>
```

### Lỗi: "Plugin for virtual type cannot be generated"

Virtual type không thể có plugin trực tiếp. Phải plugin trên class/interface gốc.

---

## 5. Config XML merge — load order, areas

### Thứ tự load di.xml

```
1. app/etc/di.xml          (Initial — framework bootstrap)
2. <module>/etc/di.xml     (Global — tất cả module)
3. <module>/etc/<area>/di.xml  (Area-specific — override global)
```

### Areas

| Area | Thư mục | Entry point |
|------|---------|-------------|
| `global` | `etc/di.xml` | Tất cả |
| `frontend` | `etc/frontend/di.xml` | index.php (storefront) |
| `adminhtml` | `etc/adminhtml/di.xml` | index.php (admin) |
| `graphql` | `etc/graphql/di.xml` | graphql.php |
| `webapi_rest` | `etc/webapi_rest/di.xml` | index.php (REST) |
| `webapi_soap` | `etc/webapi_soap/di.xml` | index.php (SOAP) |
| `crontab` | `etc/crontab/di.xml` | cron.php |

### Merge rules

- **Cùng scope:** Nodes được append (merge)
- **Array arguments:** Merge theo key name
- **Higher scope (area-specific) override lower scope (global):** Argument cùng tên bị replace, không merge
- **Plugin:** Cùng `name` attribute → merge (có thể disable plugin global trong area-specific)

```xml
<!-- etc/di.xml — global: UrlInterface → Magento\Framework\Url -->
<preference for="Magento\Framework\UrlInterface" type="Magento\Framework\Url" />

<!-- etc/adminhtml/di.xml — admin override: UrlInterface → Backend\Model\UrlInterface -->
<preference for="Magento\Framework\UrlInterface" type="Magento\Backend\Model\UrlInterface" />
```

---

## 6. Module sequence — `<sequence>` trong module.xml

`<sequence>` khai báo module nào phải load **trước** module hiện tại. Ảnh hưởng đến:
- Thứ tự merge config XML (di.xml, layout XML, etc.)
- Thứ tự plugin khi cùng sortOrder
- Thứ tự Data Patch chạy

```xml
<!-- etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_MyModule">
        <sequence>
            <module name="Magento_Catalog"/>
            <module name="Magento_Sales"/>
        </sequence>
    </module>
</config>
```

**Sau khi thay đổi sequence:**
```bash
# Phải re-enable module để rebuild config.php
bin/magento module:disable Vendor_MyModule
bin/magento module:enable Vendor_MyModule
bin/magento setup:upgrade
```

**Circular dependency:** Nếu A depends on B và B depends on A → Magento abort khi install. Phải refactor để loại bỏ vòng tròn.

**Kiểm tra thứ tự hiện tại:**
```bash
# Xem thứ tự module trong config.php
cat app/etc/config.php | grep -A 5 "Vendor_"
```

---

## 7. Area code — ảnh hưởng DI

```php
// Lấy area code hiện tại
$areaCode = $this->state->getAreaCode();
// Trả về: 'frontend', 'adminhtml', 'graphql', 'webapi_rest', 'webapi_soap', 'crontab'

// Set area code (dùng trong CLI command)
$this->state->setAreaCode(\Magento\Framework\App\Area::AREA_FRONTEND);
```

**Ảnh hưởng DI:** Khi area-specific di.xml được load, các preference và plugin trong đó override global config. Ví dụ: `UrlInterface` resolve khác nhau trong frontend vs adminhtml.

**Trong CLI command:** Mặc định không có area. Phải set thủ công nếu cần load area-specific config:

```php
public function execute(InputInterface $input, OutputInterface $output): int
{
    $this->state->setAreaCode(\Magento\Framework\App\Area::AREA_FRONTEND);
    // Bây giờ DI sẽ dùng frontend preferences
    return self::SUCCESS;
}
```

---

## Liên kết

- Plugin patterns: xem [plugin-patterns.md](./plugin-patterns.md)
- DI cơ bản: xem [di-codegen.md](./di-codegen.md)
- Module sequence: xem [component-load-order](https://developer.adobe.com/commerce/php/development/build/component-load-order)
