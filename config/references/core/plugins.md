# Tham khảo: Plugin (Interceptor)

Nguồn: https://developer.adobe.com/commerce/php/development/components/plugins

---

## Tổng quan

Plugin (interceptor) là class thêm logic vào **public method** của class/interface khác mà không override class đó. Magento gọi các plugin theo `sortOrder` và tạo class `Interceptor` tự động khi compile.

---

## Khai báo trong di.xml

```xml
<config>
    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_plugin"
                type="Vendor\Module\Plugin\ProductPlugin"
                sortOrder="10"
                disabled="false" />
    </type>
</config>
```

| Thuộc tính | Bắt buộc | Mô tả |
|-----------|---------|-------|
| `name` | Có | Tên duy nhất, dùng để merge/disable |
| `type` | Có | FQCN của plugin class |
| `sortOrder` | Không | Thứ tự thực thi khi nhiều plugin cùng method |
| `disabled` | Không | `true` để tắt plugin (kể cả plugin của module khác) |

---

## Before plugin

Chạy **trước** method gốc. Có thể thay đổi arguments.

```php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * Trả về array tham số đã sửa, hoặc null nếu không thay đổi.
     */
    public function beforeSetName(Product $subject, string $name): array
    {
        return ['[Modified] ' . $name];
    }
}
```

**Quy tắc:**
- Trả về `array` chứa các tham số đã sửa → Magento truyền vào method gốc
- Trả về `null` → giữ nguyên tham số gốc
- **KHÔNG** `unset()` phần tử trong array trả về — gây lỗi runtime

---

## After plugin

Chạy **sau** method gốc. Có thể thay đổi return value.

```php
public function afterGetName(Product $subject, string $result): string
{
    return $result . ' (Sale)';
}
```

**Quy tắc:**
- Tham số thứ 2 là `$result` (giá trị trả về của method gốc)
- Có thể khai báo thêm tham số gốc của method (chỉ cần khai báo đến tham số cần dùng, không cần khai báo hết)
- Nếu method gốc `@return void`, after plugin không cần return

```php
// Ví dụ: after plugin với tham số gốc
public function afterUpdateWebsites(
    \Magento\Catalog\Model\Product\Action $subject,
    $result,
    array $productIds,
    array $websiteIds  // khai báo đến đây vì cần dùng $websiteIds
): void {
    $this->logger->info('Updated websites: ' . implode(', ', $websiteIds));
}
```

---

## Around plugin

Chạy **bao quanh** method gốc. Nhận `callable $proceed` để gọi method tiếp theo trong chain.

```php
public function aroundSave(
    Product $subject,
    callable $proceed,
    ...$args  // forward tất cả tham số gốc
) {
    // Logic trước
    $result = $proceed(...$args);
    // Logic sau
    return $result;
}
```

> **Cảnh báo:** Tránh dùng `around` khi không cần thiết — tăng stack trace và ảnh hưởng performance. Chỉ dùng khi cần **ngăn** method gốc chạy hoặc kiểm soát toàn bộ luồng.

**Nếu không gọi `$proceed()`:** Tất cả plugin phía sau và method gốc đều bị bỏ qua.

---

## Thứ tự thực thi (sortOrder)

Với 3 plugin A (sortOrder=10), B (sortOrder=20), C (sortOrder=30):

**Khi chỉ có before/after:**
```
A::before → B::before → C::before → Method gốc → A::after → B::after → C::after
```

**Khi B có around:**
```
A::before → B::before → B::around (first half)
  → C::before → Method gốc → C::after
B::around (second half) → A::after → B::after
```

---

## Limitations — Không thể dùng plugin với

- `final` method hoặc `final` class
- Non-public method (private/protected)
- Static method
- `__construct` và `__destruct`
- Virtual types
- Object khởi tạo trước khi `Magento\Framework\Interception` bootstrap
- Class implement `Magento\Framework\ObjectManager\NoninterceptableInterface`

---

## Disable plugin

```xml
<!-- Tắt plugin của module khác -->
<type name="Magento\Checkout\Block\Checkout\LayoutProcessor">
    <plugin name="ProcessPaymentConfiguration" disabled="true"/>
</type>
```

---

## Anti-patterns

| Anti-pattern | Vấn đề | Giải pháp |
|-------------|--------|----------|
| `around` khi chỉ cần `after` | Stack trace sâu, performance | Dùng `after` |
| `before` plugin `unset()` tham số trong array return | Lỗi runtime / GraphQL | Không unset, trả về đủ tham số |
| Plugin trên `__construct` | Không hỗ trợ | Dùng Observer hoặc Factory |
| Plugin trên private method | Không hỗ trợ | Refactor method thành public |
| `<preference>` thay vì plugin | Override toàn bộ class, conflict cao | Dùng plugin |

---

## Naming convention

```
before{MethodName}  → beforeSetName
after{MethodName}   → afterGetName
around{MethodName}  → aroundSave
```

Nếu method bắt đầu bằng `_` (ví dụ `_construct`):
```
before_construct
around_construct
after_construct
```

---

## Liên kết

- Observer/Event: xem [events-observers.md](./events-observers.md)
- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
