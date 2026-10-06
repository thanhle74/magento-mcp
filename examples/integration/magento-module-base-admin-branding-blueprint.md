# Magento Module Blueprint: `NullTraceX_Base` (Admin Base Menu + Branding)

> ⚠️ **STUB — blueprint rút gọn**: chỉ liệt kê cấu trúc file. Đọc
> [`config/references/security/acl.md`](../../config/references/security/acl.md) (mục Restrict Admin
> Menu) và [`config/references/frontend/layout-xml.md`](../../config/references/frontend/layout-xml.md)
> cho pattern đầy đủ **trước khi implement**.

Nguồn chuẩn: `app/code/NullTraceX/Base`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/adminhtml/menu.xml`
- `etc/acl.xml` — khai báo resource cho root menu
- `view/adminhtml/layout/default.xml`
- `view/adminhtml/web/css/nulltracex.css`
- `view/adminhtml/web/images/nulltracex.svg`

## Pattern module

- Tạo root menu admin (`NullTraceX_Base::base_menu`) để module khác gắn child menu.
- Nạp CSS global cho admin qua `default.xml`.
- Chứa assets branding dùng chung.

## `etc/adminhtml/menu.xml` — root menu container

Root container **không có `action`** (chỉ là nhóm menu); `resource` bắt buộc và phải được
định nghĩa trong `etc/acl.xml` với cùng id.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
        <add id="NullTraceX_Base::base_menu"
             title="NullTraceX"
             module="NullTraceX_Base"
             sortOrder="100"
             resource="NullTraceX_Base::base_menu"/>
        <!-- Module khác gắn child:
        <add id="NullTraceX_Other::other"
             title="Other"
             module="NullTraceX_Other"
             sortOrder="10"
             action="other/index/index"
             parent="NullTraceX_Base::base_menu"
             resource="NullTraceX_Other::other"/> -->
    </menu>
</config>
```

## `view/adminhtml/layout/default.xml` — nạp CSS cho mọi trang admin

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <css src="NullTraceX_Base::css/nulltracex.css"/>
    </head>
</page>
```

## Khi nào dùng

- Bạn muốn tạo module "core/base" cho toàn bộ suite module nội bộ.
- Cần chuẩn hóa parent menu + style chung admin area.

## Verify nhanh

- `bin/magento setup:upgrade`
- `bin/magento cache:flush`
- Vào admin, kiểm tra menu root `NullTraceX`.
- Mở bất kỳ trang admin, kiểm tra CSS custom được load (DevTools → Network → `nulltracex.css`).

## Liên kết

- ACL + admin menu: [config/references/security/acl.md](../../config/references/security/acl.md)
- Layout XML: [config/references/frontend/layout-xml.md](../../config/references/frontend/layout-xml.md)
- Admin UI (grid/form cho child module): [config/references/frontend/admin-ui-grid.md](../../config/references/frontend/admin-ui-grid.md)
