# Magento Module Blueprint: `NullTraceX_Base` (Admin Base Menu + Branding)

Nguồn chuẩn: `app/code/NullTraceX/Base`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/adminhtml/menu.xml`
- `view/adminhtml/layout/default.xml`
- `view/adminhtml/web/css/nulltracex.css`
- `view/adminhtml/web/images/nulltracex.svg`

## Pattern module

- Tạo root menu admin (`NullTraceX_Base::base_menu`) để module khác gắn child menu.
- Nạp CSS global cho admin qua `default.xml`.
- Chứa assets branding dùng chung.

## Khi nào dùng

- Bạn muốn tạo module "core/base" cho toàn bộ suite module nội bộ.
- Cần chuẩn hóa parent menu + style chung admin area.

## Verify nhanh

- `bin/magento setup:upgrade`
- `bin/magento cache:flush`
- Vào admin, kiểm tra menu root `NullTraceX`.
- Mở bất kỳ trang admin, kiểm tra CSS custom được load.
