# Tham khảo: Data Patch và Schema Patch

Nguồn: https://developer.adobe.com/commerce/php/development/components/declarative-schema/patches

---

## Tổng quan

- **Data Patch**: Class chứa lệnh thay đổi dữ liệu (thêm attribute, config, CMS block...)
- **Schema Patch**: Class chứa lệnh thay đổi schema phức tạp (không làm được bằng `db_schema.xml`)

Mỗi patch chỉ chạy **1 lần duy nhất**. Danh sách patch đã chạy lưu trong bảng `patch_list`.
Patch chạy khi thực thi lệnh `bin/magento setup:upgrade`.

---

## Vị trí file

| Loại         | Đường dẫn                                             |
| ------------ | ----------------------------------------------------- |
| Data Patch   | `<Vendor>/<Module>/Setup/Patch/Data/<TênPatch>.php`   |
| Schema Patch | `<Vendor>/<Module>/Setup/Patch/Schema/<TênPatch>.php` |

---

## Interface cần implement

| Loại                       | Interface                                                |
| -------------------------- | -------------------------------------------------------- |
| Data Patch                 | `Magento\Framework\Setup\Patch\DataPatchInterface`       |
| Schema Patch               | `Magento\Framework\Setup\Patch\SchemaPatchInterface`     |
| Hỗ trợ rollback (tuỳ chọn) | `Magento\Framework\Setup\Patch\PatchRevertableInterface` |

---

## Cấu trúc Data Patch đầy đủ

```php
<?php

declare(strict_types=1);

namespace <Vendor>\<Module>\Setup\Patch\Data;

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class <TênPatch> implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup
    ) {
    }

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        // Logic thay đổi dữ liệu ở đây

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array
    {
        // Trả về danh sách các patch mà patch này phụ thuộc
        // Nếu không phụ thuộc patch nào, trả về mảng rỗng
        return [];
    }

    public function getAliases(): array
    {
        // Nếu patch đổi tên, thêm tên cũ vào đây
        // Để hệ thống biết patch cũ và mới là 1
        return [];
    }
}
```

---

## Cấu trúc Data Patch có hỗ trợ Rollback

```php
<?php

declare(strict_types=1);

namespace <Vendor>\<Module>\Setup\Patch\Data;

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\Patch\PatchRevertableInterface;

class <TênPatch> implements DataPatchInterface, PatchRevertableInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup
    ) {
    }

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        // Logic thêm dữ liệu

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public function revert(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        // Logic hoàn tác (xoá dữ liệu đã thêm)
        // Lưu ý: cẩn thận với foreign key, xoá dữ liệu có thể trigger ON DELETE

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

---

## 3 method bắt buộc

### apply()

- Chứa logic thay đổi dữ liệu
- Bọc trong `startSetup()` và `endSetup()`
- Mỗi patch chỉ chạy 1 lần

### getDependencies()

- Trả về mảng tên class các patch mà patch này phụ thuộc
- Patch phụ thuộc sẽ chạy trước
- Dependency có thể nằm ở module khác
- Nếu không phụ thuộc, trả về `[]`

```php
public static function getDependencies(): array
{
    return [
        \<Vendor>\Base\Setup\Patch\Data\InitBaseConfig::class,
    ];
}
```

### getAliases()

- Trả về mảng tên cũ của patch (nếu patch đã đổi tên)
- Giúp hệ thống nhận biết patch cũ = patch mới, không chạy lại
- Nếu không đổi tên, trả về `[]`

---

## Ví dụ thực tế

### Thêm Customer Attribute

```php
<?php

declare(strict_types=1);

namespace <Vendor>\Customer\Setup\Patch\Data;

use Magento\Customer\Model\Customer;
use Magento\Customer\Setup\CustomerSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddPhoneAttribute implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup,
        private readonly CustomerSetupFactory $customerSetupFactory
    ) {
    }

    public function apply(): void
    {
        $customerSetup = $this->customerSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $customerSetup->addAttribute(
            Customer::ENTITY,
            'secondary_phone',
            [
                'type' => 'varchar',
                'label' => 'Số điện thoại phụ',
                'input' => 'text',
                'required' => false,
                'visible' => true,
                'system' => false,
                'position' => 150,
            ]
        );
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

### Thêm dữ liệu mặc định vào bảng

```php
<?php

declare(strict_types=1);

namespace <Vendor>\Employee\Setup\Patch\Data;

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class InsertDefaultDepartments implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup
    ) {
    }

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $this->moduleDataSetup->getConnection()->insertMultiple(
            $this->moduleDataSetup->getTable('<vendor>_employee_department'),
            [
                ['name' => 'Kỹ thuật', 'code' => 'engineering'],
                ['name' => 'Kinh doanh', 'code' => 'sales'],
                ['name' => 'Nhân sự', 'code' => 'hr'],
            ]
        );

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

---

## Hoàn tác (Revert) Data Patch

Magento không hỗ trợ revert từng patch riêng lẻ, chỉ revert toàn bộ module:

```bash
# Module cài qua composer
bin/magento module:uninstall Vendor_ModuleName

# Module không qua composer
bin/magento module:uninstall --non-composer Vendor_ModuleName
```

---

## Quy tắc đặt tên (theo convention <Vendor>)

- Tên class mô tả rõ hành động: `AddPhoneAttribute`, `InsertDefaultDepartments`, `MigrateOldConfig`
- KHÔNG đặt tên chung chung: `DataPatch001`, `UpdateData`
- Mỗi patch chỉ làm 1 việc cụ thể

---

## Liên kết

- Declarative Schema: xem [declarative-schema.md](./declarative-schema.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Các pattern: xem [../magento-patterns.md](../magento-patterns.md)
