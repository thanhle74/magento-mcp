# Tham khảo: Linh kiện giao diện (UI Components)

Nguồn chính:
- [UI Components Overview](https://developer.adobe.com/commerce/frontend-core/ui-components/)
- [XML Declaration](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/xml-declaration)
- [XML Configuration](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/xml-configuration)
- [Data Sourcing](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/data-source)

---

## 1. Khai báo UI Components (XML Declaration)

Cấu trúc khai báo UI Component gồm hai phần:
1. **Layout XML (`layout/*.xml`):** Đưa component vào trang.
2. **Component XML (`view/[area]/ui_component/*.xml`):** Cấu hình chi tiết component.

### Trong Layout XML
Sử dụng thẻ `<uiComponent>` bên trong một container hoặc block:

```xml
<referenceContainer name="content">
    <uiComponent name="instance_name"/>
</referenceContainer>
```
Magento sẽ tìm file cấu hình tại: `<Module_Dir>/view/<area>/ui_component/instance_name.xml`.

### Trong Component XML
File này định nghĩa loại component (top node) và các thuộc tính/settings. Nếu nhiều module cùng định nghĩa một file name, Magento sẽ merge chúng lại.

---

## 2. Cấu trúc Cấu hình XML (XML Configuration)

Magento hỗ trợ hai dạng cấu hình trong XML:

### A. Settings (Khuyên dùng)
Dạng cấu hình có cấu trúc chặt chẽ (strict structure), dễ đọc và bảo trì.
```xml
<settings>
    <buttons>
        <button name="save" class="Magento\Catalog\Block\Adminhtml\Category\Edit\SaveButton"/>
    </buttons>
    <namespace>category_form</namespace>
    <dataScope>data</dataScope>
</settings>
```

### B. Arguments (Dạng cũ/tự do)
Dùng thẻ `<argument name="data">` để truyền mảng dữ liệu vào JS component.
```xml
<argument name="data" xsi:type="array">
    <item name="js_config" xsi:type="array">
        <item name="component" xsi:type="string">Magento_Ui/js/form/components/fieldset</item>
    </item>
    <item name="label" xsi:type="string" translate="true">Thông tin chung</item>
</argument>
```

**Thứ tự ưu tiên:** Cấu hình trong `.js` file < `definition.xml` < XML của module.

---

## 3. Nguồn cung cấp dữ liệu (Data Sourcing)

Data Source là cầu nối giữa Backend (PHP) và Frontend (JavaScript).

### Khai báo DataSource trong XML
```xml
<dataSource name="example_data_source">
    <argument name="dataProvider" xsi:type="configurableObject">
        <argument name="class" xsi:type="string">Vendor\Module\Ui\DataProvider\MyDataProvider</argument>
        <argument name="name" xsi:type="string">example_data_source</argument>
        <argument name="primaryFieldName" xsi:type="string">entity_id</argument>
        <argument name="requestFieldName" xsi:type="string">id</argument>
    </argument>
    <settings>
        <validateUrl path="route/entity/validate"/>
        <submitUrl path="route/entity/save"/>
    </settings>
</dataSource>
```

### PHP DataProvider Class
Class này phải implement `DataProviderInterface` (thường kế thừa `AbstractDataProvider`).
- `getData()`: Trả về mảng dữ liệu sẽ được chuyển thành JSON.

### Đồng bộ hóa JS (Data Binding)
Frontend sử dụng **Template Literals** (`${ }`) để truy xuất dữ liệu từ Provider.

```javascript
// Trong default config của JS Component
defaults: {
    imports: {
        totalRecords: '${ $.provider }:data.totalRecords'
    }
}
```
Khi khởi tạo, `uiElement` sẽ tự động thực hiện:
- `imports`: Lấy dữ liệu từ provider về component.
- `exports`: Gửi dữ liệu từ component sang provider/component khác.
- `links`: Kết nối hai chiều.

---

## 4. Các thuộc tính nền tảng (Base Properties)

| Thuộc tính | Ý nghĩa |
|------------|---------|
| `component`| Đường dẫn RequireJS tới file `.js` (Model). |
| `template` | Đường dẫn tới file `.html` (View). |
| `provider` | Tên của `dataSource` component mà component này phụ thuộc. |
| `sortOrder`| Thứ tự hiển thị. |
| `displayArea`| Vùng render được định nghĩa trong component cha. |

---

## Liên kết
- [How-to & Debug (category form, custom UI, giá, UrlInput, …)](./ui-components-howto.md)
- [Thư viện Linh kiện (Button, ActionsColumn, Bookmarks)](./ui-component-library.md)
- [Thư viện JavaScript (uiClass, Element, Collection)](./ui-components-js-library.md)
- [Cú pháp Template & Bindings](./ui-components-templates.md)
- [PHP Modifiers (Metadata & Data Mod)](./ui-components-modifiers.md)
- Quy tắc Magento Patterns: xem [../../magento-patterns.md](../../magento-patterns.md)
- Web API & GraphQL: xem [../web-api.md](../web-api.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)

