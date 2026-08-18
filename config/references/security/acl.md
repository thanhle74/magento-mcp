# Tham khảo: ACL (Access Control List)

Nguồn: https://developer.adobe.com/commerce/php/tutorials/backend/create-access-control-list-rule

---

## Tổng quan

ACL kiểm soát quyền truy cập vào:
- Menu Admin
- Controller Admin
- REST/SOAP API endpoints
- Layout blocks (hiển thị có điều kiện)

---

## Khai báo ACL resource (etc/acl.xml)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::menu" title="Custom Menu" sortOrder="10">
                    <resource id="Vendor_Module::create" title="Create" sortOrder="50" />
                    <resource id="Vendor_Module::delete" title="Delete" sortOrder="100" />
                    <resource id="Vendor_Module::view" title="View" sortOrder="150">
                        <resource id="Vendor_Module::view_additional"
                                  title="View Additional Information" sortOrder="10" />
                    </resource>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

**Quy tắc đặt tên resource ID:** `Vendor_ModuleName::resourceName`

---

## Restrict Admin Menu (etc/adminhtml/menu.xml)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
        <add id="Vendor_Module::menu"
             title="Custom Menu"
             module="Vendor_Module"
             sortOrder="10"
             resource="Vendor_Module::menu"/>
        <add id="Vendor_Module::create"
             title="Create"
             module="Vendor_Module"
             sortOrder="10"
             parent="Vendor_Module::menu"
             action="custommenu/create/index"
             resource="Vendor_Module::create"/>
    </menu>
</config>
```

---

## Restrict Admin Controller

```php
namespace Vendor\Module\Controller\Adminhtml\Create;

use Magento\Backend\App\Action;

class Index extends Action
{
    // Khai báo ACL resource bắt buộc
    const ADMIN_RESOURCE = 'Vendor_Module::create';

    public function execute()
    {
        // ...
    }
}
```

---

## Restrict REST API (etc/webapi.xml)

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">
    <route url="/V1/vendor/module/create" method="POST">
        <service class="Vendor\Module\Api\CreateInterface" method="execute"/>
        <resources>
            <resource ref="Vendor_Module::create" />
        </resources>
    </route>
    <!-- Cho phép anonymous access -->
    <route url="/V1/vendor/module/public" method="GET">
        <service class="Vendor\Module\Api\PublicInterface" method="getList"/>
        <resources>
            <resource ref="anonymous" />
        </resources>
    </route>
    <!-- Chỉ customer đã login -->
    <route url="/V1/vendor/module/mine" method="GET">
        <service class="Vendor\Module\Api\CustomerInterface" method="getMine"/>
        <resources>
            <resource ref="self" />
        </resources>
    </route>
</routes>
```

| Resource ref | Ý nghĩa |
|-------------|---------|
| `Vendor_Module::resource` | Admin với quyền cụ thể |
| `anonymous` | Không cần auth |
| `self` | Customer đã đăng nhập |

---

## Restrict Layout Block

```xml
<!-- Chỉ hiển thị block khi user có quyền view_additional -->
<block class="Magento\Framework\View\Element\Text"
       aclResource="Vendor_Module::view_additional">
    <arguments>
        <argument name="text" xsi:type="string">Nội dung bảo mật</argument>
    </arguments>
</block>
```

---

## Kiểm tra quyền trong PHP

```php
use Magento\Framework\AuthorizationInterface;

class MyService
{
    public function __construct(
        private readonly AuthorizationInterface $authorization
    ) {}

    public function doSomething(): void
    {
        if (!$this->authorization->isAllowed('Vendor_Module::create')) {
            throw new \Magento\Framework\Exception\AuthorizationException(
                __('You are not authorized to perform this action.')
            );
        }
        // ...
    }
}
```

---

## Sau khi thêm/sửa acl.xml

```bash
bin/magento cache:clean config
```

Vào Admin: `System > Permissions > User Roles` → chọn role → `Role Resources` → chọn resource mới.

---

## Liên kết

- Security Best Practices: xem [security-best-practices.md](./security-best-practices.md)
- REST API: xem [../network/rest/overview.md](../network/rest/overview.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
