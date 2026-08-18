# Magento Module Blueprint: `NullTraceX_CspWhitelist` (CSP Whitelist)

Nguồn chuẩn: `app/code/NullTraceX/CspWhitelist`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/csp_whitelist.xml`

## Pattern module

- Quản lý CSP policy theo từng loại nguồn: `img-src`, `script-src`, `frame-src`, ...
- Khai báo host whitelist bằng `<value type="host">`.
- Dùng module riêng cho CSP để dễ review security theo release.

## Khi nào dùng

- Bổ sung domain third-party cho script/image/frame.
- Giảm việc sửa CSP rải rác trong nhiều module.

## Verify nhanh

- `bin/magento cache:flush`
- Mở storefront/admin có script third-party liên quan.
- Kiểm tra console browser không còn CSP violation cho host đã whitelist.
