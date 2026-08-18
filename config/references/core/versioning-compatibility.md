# Tham khảo: Quản lý phiên bản & Tính tương thích

Nguồn: https://developer.adobe.com/commerce/php/development/versioning/

---

## 1. Quy tắc SemVer (Semantic Versioning)

Mỗi module phải tuân thủ định dạng: `MAJOR.MINOR.PATCH`.

- **MAJOR:** Tăng khi thay đổi API không tương thích (Breaking changes).
- **MINOR:** Tăng khi thêm tính năng mới hoặc thay đổi "điểm tùy biến" nhưng vẫn giữ tương thích ngược.
- **PATCH:** Tăng khi sửa lỗi (Bug fixes) mà không thay đổi tính năng.

---

## 2. Phân loại Code (Public vs Private)

- **Public API (@api):** Các Interface/Class được cam kết ổn định. Luôn ưu tiên sử dụng.
- **Private Code:** Không có thẻ `@api`. Tránh sử dụng. Nếu bắt buộc, phải yêu cầu phiên bản PATCH cụ thể trong `composer.json`.

---

## 3. Quản lý phụ thuộc (Dependencies)

Tùy vào cách bạn sử dụng code của module khác mà khai báo mức độ "chặt" khác nhau trong `composer.json`:

| Cách sử dụng | Mức độ phụ thuộc | Ví dụ (require) |
|--------------|-----------------|-----------------|
| **Gọi API** (Caller) | MAJOR | `"magento/module-customer": "~2.0"` |
| **Thực thi SPI** (Implementer) | MAJOR + MINOR | `"magento/module-customer": "~2.0.0"` |
| **Dùng Private Code** | MAJOR + MINOR + PATCH | `"magento/module-customer": "2.1.3"` |

---

## 4. Deprecation (Lỗi thời)

Khi muốn thay thế một đoạn code cũ:
1. Đánh dấu `@deprecated` kèm phiên bản.
2. Dùng `@see` để hướng dẫn sang cách làm mới.
3. Chỉ được xóa code @deprecated ở phiên bản MAJOR tiếp theo.

```php
/**
 * @deprecated since 1.1.0
 * @see \Vendor\Module\Model\NewService::execute()
 */
public function oldMethod() { ... }
```

---

## 5. Sequence (Thứ tự load)

Luôn khai báo các module phụ thuộc trong `etc/module.xml` để đảm bảo:
- Layout được merge đúng.
- Config được ghi đè đúng.
- Plugin được thực thi đúng thứ tự.

---

## 6. BIC Check (Kiểm tra tương thích ngược)

Khi chỉnh sửa code (@api), phải đảm bảo không vi phạm các lỗi BIC sau:

| Đối tượng | Thay đổi bị cấm (BIC) |
|-----------|-----------------------|
| **PHP Class** | Xóa method công khai, thêm tham số bắt buộc vào constructor, đổi return type. |
| **Interface** | Thêm bất kỳ method nào (vì sẽ làm hỏng các class implement nó). |
| **Database**  | Xóa cột, đổi kiểu dữ liệu cột, đổi tên bảng. |
| **DI Config** | Đổi tên `virtualType`, đổi kiểu dữ liệu `argument`. |
| **Layout**    | Xóa `block` hoặc `container` có `name` cố định. |

---

## 7. Đóng gói & Phát hành (Packaging)

Mọi module phải có file `composer.json` tự chứa (self-contained) để có thể cài đặt độc lập.

### Cấu trúc composer.json chuẩn:
```json
{
    "name": "vendor-name/module-name",
    "type": "magento2-module",
    "version": "1.0.0",
    "license": ["OSL-3.0"],
    "require": {
        "magento/framework": ">=103.0.8"
    },
    "autoload": {
        "files": ["registration.php"],
        "psr-4": {
            "VendorName\\ModuleName\\": ""
        }
    }
}
```

- **Metapackage:** Chỉ dùng khi cần nhóm nhiều module lại thành một bộ tính năng duy nhất.
- **Archive:** Khi phát hành thủ công, chỉ nén các file mã nguồn, tuyệt đối không nén thư mục `vendor` hoặc `generated`.

---

## Liên kết

- Constitution (Quy tắc chung): xem [../constitution.md](../constitution.md)
- Declarative Schema: xem [declarative-schema.md](./declarative-schema.md)
- Payment Gateway: xem [payment-gateway.md](./payment-gateway.md)
- Composer series (Marketplace/Plugins/Components/Autoload): xem [composer-series.md](./composer-series.md)
