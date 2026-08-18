# Tham khảo: PHP Modifiers (UI Components)

Nguồn: [PHP Modifiers](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/modifier)

---

## 1. Vai trò của Modifier

Modifier là phần xử lý phía Server-side (PHP) dành cho UI Components. Chúng được sử dụng khi việc khai báo tĩnh trong XML không đủ đáp ứng, ví dụ:
- Dữ liệu cần load động từ Database dựa trên logic phức tạp.
- Cần thay đổi cấu trúc Metadata (ẩn/hiện field, thêm validation) dựa trên loại thực thể (ví dụ: Product Type trong Catalog).
- Thêm các tùy chọn (options) động cho các thẻ select/multiselect.

---

## 2. Cách thức hoạt động

1. **DataProvider** nhận một tập hợp các Modifiers (thông qua `Pool`).
2. Trong quá trình chạy (runtime), kết quả từ các Modifier sẽ được merge với cấu hình từ file XML.
3. Dữ liệu cuối cùng được chuyển sang JSON để Frontend sử dụng.

---

## 3. Quy trình thực hiện

### Bước 1: Tạo class Modifier
Class phải implement `\Magento\Ui\DataProvider\Modifier\ModifierInterface`.

```php
namespace Vendor\Module\Ui\DataProvider\Modifier;

use Magento\Ui\DataProvider\Modifier\ModifierInterface;

class CustomModifier implements ModifierInterface
{
    /**
     * Thay đổi Metadata (cấu trúc, label, validation...)
     */
    public function modifyMeta(array $meta)
    {
        $meta['custom_fieldset']['children']['custom_field'] = [
            'arguments' => [
                'data' => [
                    'config' => [
                        'label' => __('Dynamic Label'),
                        'visible' => true,
                    ]
                ]
            ]
        ];
        return $meta;
    }

    /**
     * Thay đổi dữ liệu (giá trị của các field)
     */
    public function modifyData(array $data)
    {
        // $data thường chứa mảng các thực thể đang edit
        return $data;
    }
}
```

### Bước 2: Khai báo Pool trong `di.xml`
Sử dụng `virtualType` để gom các modifier lại.

```xml
<virtualType name="Vendor\Module\ModifierPool" type="Magento\Ui\DataProvider\Modifier\Pool">
    <arguments>
        <argument name="modifiers" xsi:type="array">
            <item name="unique_modifier_name" xsi:type="array">
                <item name="class" xsi:type="string">Vendor\Module\Ui\DataProvider\Modifier\CustomModifier</item>
                <item name="sortOrder" xsi:type="number">10</item>
            </item>
        </argument>
    </arguments>
</virtualType>
```

### Bước 3: Tiêm Pool vào DataProvider
```xml
<type name="Vendor\Module\Ui\DataProvider\MyDataProvider">
    <arguments>
        <argument name="pool" xsi:type="object">Vendor\Module\ModifierPool</argument>
    </arguments>
</type>
```

---

## 4. Lưu ý quan trọng
- **Sort Order:** Thứ tự cực kỳ quan trọng nếu nhiều modifier cùng tác động lên một field.
- **Merge:** Metadata trả về từ `modifyMeta` sẽ ghi đè lên XML nếu trùng key.
- **Ví dụ thực tế:** Xem `\Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\LayoutUpdate` để thấy cách Magento xử lý Product Form phức tạp.

---

## Liên kết
- [UI Components Overview](./ui-components.md)
- [Data Sourcing](./ui-components.md#3-nguồn-cung-cấp-dữ-liệu-data-sourcing)
