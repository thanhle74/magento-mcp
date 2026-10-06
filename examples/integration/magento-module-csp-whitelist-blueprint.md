# Magento Module Blueprint: `NullTraceX_CspWhitelist` (CSP Whitelist)

> ⚠️ **STUB — blueprint rút gọn**: chỉ liệt kê cấu trúc file. Đọc
> [`config/references/security/csp.md`](../../config/references/security/csp.md) cho pattern đầy đủ
> (hash, nonce, SecureHtmlRenderer, page-specific CSP) **trước khi implement**.

Nguồn chuẩn: `app/code/NullTraceX/CspWhitelist`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/csp_whitelist.xml`

## Pattern module

- Quản lý CSP policy theo từng loại nguồn: `img-src`, `script-src`, `frame-src`, ...
- Khai báo host whitelist bằng `<value type="host">`.
- Dùng module riêng cho CSP để dễ review security theo release.

## `etc/csp_whitelist.xml` — sample thật

Chỉ whitelist host thực sự dùng; `value id` phải unique trong scope policy của nó.

```xml
<?xml version="1.0"?>
<csp_whitelist xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Csp:etc/csp_whitelist.xsd">
    <policies>
        <policy id="script-src">
            <values>
                <value id="third-party-cdn" type="host">https://cdn.example.com</value>
            </values>
        </policy>
        <policy id="img-src">
            <values>
                <value id="third-party-images" type="host">https://images.example.com</value>
            </values>
        </policy>
        <policy id="frame-src">
            <values>
                <value id="third-party-frame" type="host">https://pay.example.com</value>
            </values>
        </policy>
    </policies>
</csp_whitelist>
```

> Trình tự xử lý CSP violation đúng (xem reference): `SecureHtmlRenderer` → `CspNonceProvider`
> (2.4.7+) → hash → whitelist domain. **Không** thêm `unsafe-inline` vào `script-src`.

## Khi nào dùng

- Bổ sung domain third-party cho script/image/frame.
- Giảm việc sửa CSP rải rác trong nhiều module.

## Verify nhanh

- `bin/magento cache:flush`
- Mở storefront/admin có script third-party liên quan.
- Kiểm tra console browser không còn CSP violation cho host đã whitelist.

## Liên kết

- CSP đầy đủ (mode, hash, nonce, report-uri): [config/references/security/csp.md](../../config/references/security/csp.md)
- Security best practices: [config/references/security/security-best-practices.md](../../config/references/security/security-best-practices.md)
