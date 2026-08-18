# Tham khảo: EAV và Extension Attributes

Nguồn: https://developer.adobe.com/commerce/php/development/components/attributes

---

## 1. Phân loại Attribute

Magento có 2 loại attribute chính để mở rộng dữ liệu:

| Loại | Đặc điểm | Đối tượng sử dụng chính |
|------|-----------|------------------------|
| **EAV Attribute** | Lưu trong nhiều bảng MySQL (EAV structure). Có thể quản lý qua Admin (Custom Attributes). | Catalog (Product, Category), Customer, Customer Address. |
| **Extension Attribute** | Dùng để mở rộng các Data Interface (API). Không hiển thị trong Admin. Có thể dùng kiểu dữ liệu phức tạp. | Bất kỳ Data Interface nào implement `ExtensibleDataInterface` (như Order, Quote, Stock...). |

---

## 2. EAV Attribute (Custom Attribute)

Các đối tượng EAV chính: `Catalog` (Product, Category) và `Customer`.

### Thêm Customer EAV Attribute
Sử dụng **Data Patch** để thêm attribute mới.

#### Ví dụ: Thêm số điện thoại phụ cho Customer

```php
<?php

declare(strict_types=1);

namespace <Vendor>\<Module>\Setup\Patch\Data;

use Magento\Customer\Model\Customer;
use Magento\Customer\Setup\CustomerSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddSecondaryPhoneAttribute implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup,
        private readonly CustomerSetupFactory $customerSetupFactory
    ) {
    }

    public function apply(): void
    {
        /** @var \Magento\Customer\Setup\CustomerSetup $customerSetup */
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
                'user_defined' => true,
                'sort_order' => 100,
                'position' => 100,
                'system' => false, // Set false để thuộc tính xuất hiện trong custom_attributes của API
            ]
        );

        // Thêm attribute vào form (Customer Address dùng 'customer_address_edit', Customer dùng 'customer_account_edit', etc.)
        $attribute = $customerSetup->getEavConfig()->getAttribute(Customer::ENTITY, 'secondary_phone');
        $attribute->setData('used_in_forms', ['adminhtml_customer', 'customer_account_create', 'customer_account_edit']);
        $attribute->save();
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

### Thêm Product EAV Attribute
Tương tự Customer, nhưng dùng `EavSetupFactory`. Các thuộc tính Product có nhiều option hơn như `is_filterable`, `is_searchable`.

```php
$eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);
$eavSetup->addAttribute(
    \Magento\Catalog\Model\Product::ENTITY,
    'brand_id',
    [
        'type' => 'int',
        'label' => 'Thương hiệu',
        'input' => 'select',
        'source' => \Vendor\Module\Model\Source\Brand::class,
        'required' => false,
        'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
        'visible' => true,
        'user_defined' => true,
        'searchable' => true,
        'filterable' => true,
        'comparable' => false,
        'visible_on_front' => true,
        'used_in_product_listing' => true,
        'unique' => false,
    ]
);
```

---

## 3. Extension Attributes

Dùng để thêm field vào các API Response mà không sửa DB bảng chính (thường join từ bảng khác hoặc tính toán từ logic).

### Khai báo trong extension_attributes.xml

File đặt tại: `<Vendor>/<Module>/etc/extension_attributes.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    
    <!-- Mở rộng OrderInterface -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <!-- Thuộc tính đơn giản -->
        <attribute code="custom_delivery_date" type="string" />
        
        <!-- Thuộc tính lấy từ bảng khác (Join) -->
        <attribute code="stock_item_qty" type="float">
            <join reference_table="cataloginventory_stock_item" 
                  reference_field="product_id" 
                  join_on_field="entity_id">
                <field>qty</field>
            </join>
        </attribute>
        
        <!-- Thuộc tính có giới hạn quyền truy cập -->
        <attribute code="internal_note" type="string">
            <resources>
                <resource ref="<Vendor>_<Module>::internal_note_view"/>
            </resources>
        </attribute>
    </extension_attributes>
</config>
```

### Cách sử dụng trong PHP (Plugin)

Sau khi khai báo XML, Magento sẽ tự sinh ra code trong `generated/`. Bạn sử dụng Plugin để "đổ" dữ liệu vào attribute này.

```php
<?php

declare(strict_types=1);

namespace <Vendor>\<Module>\Plugin;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\Data\OrderExtensionFactory;

class OrderRepositoryPlugin
{
    public function __construct(
        private readonly OrderExtensionFactory $orderExtensionFactory
    ) {
    }

    public function afterGet(
        OrderRepositoryInterface $subject,
        OrderInterface $order
    ): OrderInterface {
        $extensionAttributes = $order->getExtensionAttributes() 
            ?: $this->orderExtensionFactory->create();
        
        // Gán giá trị cho extension attribute
        $extensionAttributes->setCustomDeliveryDate('2024-12-31');
        
        $order->setExtensionAttributes($extensionAttributes);
        return $order;
    }

    public function afterGetList(
        OrderRepositoryInterface $subject,
        OrderSearchResultsInterface $searchResults
    ): OrderSearchResultsInterface {
        foreach ($searchResults->getItems() as $order) {
            $this->afterGet($subject, $order);
        }
        return $searchResults;
    }
}
```

---

## 4. Lưu ý quan trọng

1. **EAV `system` flag**: Nếu `system => true`, attribute sẽ không xuất hiện trong `custom_attributes` của API. Hãy set `false` nếu muốn expose qua API.
2. **EavSetupFactory**: Luôn dùng `EavSetupFactory` hoặc factory cụ thể (như `CustomerSetupFactory`) trong Data Patch. Không inject `EavSetup` trực tiếp.
3. **Extension Attribute Code Generation**: Nếu không thấy method `set...` hoặc `get...` trong IDE, hãy chạy `bin/magento dev:tests:run` hoặc đơn giản là xoá `generated/code` và để Magento generate lại khi gọi.
4. **Data Interfaces**: Luôn ưu tiên dùng Extension Attributes cho các class implement `ExtensibleDataInterface` để đảm bảo tương thích API và Service Contract.

---

## Liên kết

- Data/Schema Patch: xem [data-schema-patch.md](./data-schema-patch.md)
- Plugin: xem [plugins.md](./plugins.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Các pattern: xem [../magento-patterns.md](../magento-patterns.md)
