# Thư viện Linh kiện UI — Form (Inputs & Fields)

Tổng hợp linh kiện UI nhập liệu cơ bản & lựa chọn phục vụ **Form Admin**: input/text/textarea, checkbox/select/radio, multiselect, date & email, colorPicker.

> Tách từ tài liệu gốc *Thư viện Linh kiện UI (Common UI Components)* — đánh số section giữ nguyên theo bản gốc để tham chiếu chéo (ví dụ §23.B, §25.D) không vỡ.
> - Nhập liệu cơ bản & lựa chọn (file này)
> - Linh kiện composite & media (dynamic rows, uploader, WYSIWYG, urlInput, ui-select, multiline, insertForm, fieldset): [ui-library-form-composite.md](./ui-library-form-composite.md)
> - Linh kiện Grid/Listing: [ui-library-grid.md](./ui-library-grid.md)
> - Khung & kiến trúc (button, bookmarks, container, modal, tab): [ui-library-shell.md](./ui-library-shell.md)

> Từ khóa tra cứu: ui component form, checkbox, checkboxset, multiselect, select, radioset, textarea, colorPicker, date, email.

## 4. Checkbox & Selection Components

Dùng để nhận giá trị Boolean hoặc tập hợp các giá trị được chọn.

### A. Checkbox (Single)
Linh kiện checkbox cơ bản cho Form.
```xml
<field name="is_active" formElement="checkbox">
    <settings>
        <dataType>boolean</dataType>
        <label translate="true">Kích hoạt</label>
    </settings>
    <formElements>
        <checkbox>
            <settings>
                <valueMap>
                    <map name="false" xsi:type="number">0</map>
                    <map name="true" xsi:type="number">1</map>
                </valueMap>
                <prefer>toggle</prefer> <!-- Hiển thị dạng switch/toggle -->
            </settings>
        </checkbox>
    </formElements>
</field>
```

### B. CheckboxSet
Dùng để chọn nhiều giá trị trong một danh sách mảng.
```xml
<field name="category_ids" formElement="checkboxset">
    <settings>
        <label translate="true">Danh mục</label>
        <options class="Magento\Catalog\Model\Product\Option\Source\Category"/>
    </settings>
</field>
```

### C. CheckboxToggleNotice
Checkbox đặc biệt có hiển thị cảnh báo (warning message) khi người dùng thay đổi trạng thái. Thường dùng trong cấu hình hệ thống quan trọng.

---

---

## 5. Specialized Inputs

### ColorPicker
Linh kiện chọn màu sắc chuyên dụng.
```xml
<field name="bg_color" formElement="colorPicker">
    <settings>
        <label translate="true">Màu nền</label>
        <colorPickerConfig>
            <item name="placeholder" xsi:type="string">#FFFFFF</item>
        </colorPickerConfig>
    </settings>
</field>
```

---

---

## 10. Linh kiện Ngày tháng & Email

### A. Date / DateTime
Linh kiện chọn ngày tháng cho Form (sử dụng jQuery UI Datepicker).
```xml
<field name="special_from_date" formElement="date">
    <settings>
        <dataType>text</dataType>
        <label translate="true">Từ ngày</label>
        <validation>
            <rule name="validate-date" xsi:type="boolean">true</rule>
        </validation>
    </settings>
</field>
```

### B. Date Column (Grid)
Hiển thị ngày tháng trên Listing.
```xml
<column name="created_at" component="Magento_Ui/js/grid/columns/date">
    <settings>
        <filter>dateRange</filter>
        <dataType>date</dataType>
        <label translate="true">Ngày tạo</label>
        <dateFormat>MMM d, yyyy</dateFormat>
    </settings>
</column>
```

### C. Email
Linh kiện nhập văn bản kế thừa `input` nhưng được tích hợp sẵn validator email.

---

---

## 16. Nhập liệu Cơ bản & Nội dung

### A. Input (Text)
Trường nhập văn bản tiêu chuẩn.
```xml
<field name="title" formElement="input">
    <settings>
        <label translate="true">Tiêu đề</label>
        <dataType>text</dataType>
        <visible>true</visible>
    </settings>
</field>
```

### B. Hidden
Dùng để lưu trữ các giá trị cần thiết cho submit nhưng không hiển thị cho người dùng (ví dụ: `entity_id`).
```xml
<field name="entity_id" formElement="hidden">
    <settings>
        <dataType>text</dataType>
    </settings>
</field>
```

### C. HtmlContent
Cho phép nhúng mã HTML tĩnh hoặc từ một Block PHP vào UI Component.
```xml
<htmlContent name="html_content">
    <block name="my_block" class="Vendor\Module\Block\Adminhtml\CustomHtml"/>
</htmlContent>
```

---

---

## 21. Nhập liệu Phức hợp (Complex Inputs)

### A. Multiselect

Nguồn chi tiết: [Multiselect component (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/multiselect).

Kế thừa **Select**; cho phép chọn **nhiều** mục từ danh sách hoặc data source. JS: `Magento_Ui/js/form/element/multiselect.js`, template phần tử: `ui/form/element/multiselect.html`.

#### Tùy chọn `config` thường gặp

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS tới `.js` | `Magento_Ui/js/form/element/multiselect` |
| `elementTmpl` | Template cho control multiselect | `ui/form/element/multiselect` |
| `size` | Số option hiển thị cùng lúc trong UI | `6` |
| `template` | Template khung field chung | `ui/form/field` |

#### Options từ class (Collection / Source)

```xml
<field name="store_ids" formElement="multiselect">
    <settings>
        <label translate="true">Cửa hàng hiển thị</label>
        <options class="Magento\Store\Model\ResourceModel\Store\Collection"/>
    </settings>
</field>
```

#### Options khai báo tĩnh trong XML (theo ví dụ Adobe)

```xml
<field name="multiselect_example" formElement="multiselect">
    <settings>
        <dataType>text</dataType>
        <label translate="true">Multiselect Example</label>
        <dataScope>multiselect_example</dataScope>
    </settings>
    <formElements>
        <multiselect>
            <settings>
                <options>
                    <option name="1" xsi:type="array">
                        <item name="value" xsi:type="string">1</item>
                        <item name="label" xsi:type="string">Option #1</item>
                    </option>
                    <option name="2" xsi:type="array">
                        <item name="value" xsi:type="string">2</item>
                        <item name="label" xsi:type="string">Option #2</item>
                    </option>
                </options>
            </settings>
        </multiselect>
    </formElements>
</field>
```

## 24. Nhập liệu Form (Bổ sung)

### A. Select (Dropdown)

Nguồn chi tiết: [Select (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/select).

Một lựa chọn duy nhất từ danh sách. JS: `Magento_Ui/js/form/element/select.js`; field wrapper: `ui/form/field`; phần control: `ui/form/element/select`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/form/element/select` |
| `elementTmpl` | Template control select | `ui/form/element/select` |
| `template` | Template khung field | `ui/form/field` |
| `caption` | Caption cho thẻ `<select>` | `''` |
| `options` | Mảng option | `[]` |

#### Options từ class (Source)

```xml
<field name="status" formElement="select">
    <settings>
        <label translate="true">Trạng thái</label>
        <options class="Magento\Config\Model\Config\Source\Yesno"/>
    </settings>
</field>
```

#### Options tĩnh trong XML + caption (theo ví dụ Adobe)

```xml
<field name="select_example" formElement="select">
    <settings>
        <dataType>text</dataType>
        <label translate="true">Select Example</label>
        <dataScope>select_example</dataScope>
    </settings>
    <formElements>
        <select>
            <settings>
                <options>
                    <option name="1" xsi:type="array">
                        <item name="value" xsi:type="string">1</item>
                        <item name="label" xsi:type="string">Option #1</item>
                    </option>
                    <option name="2" xsi:type="array">
                        <item name="value" xsi:type="string">2</item>
                        <item name="label" xsi:type="string">Option #2</item>
                    </option>
                </options>
                <caption translate="true">-- Please Select --</caption>
            </settings>
        </select>
    </formElements>
</field>
```

### B. Radioset (Radio set)

Nguồn chi tiết: [Radioset component (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/radio-set).

Shortcut của **Checkboxset** với input dạng **radio** (chọn một giá trị). Cùng JS: `Magento_Ui/js/form/element/checkbox-set.js`, `multiple` = `false`, template: `ui/form/element/checkbox-set`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/form/element/checkbox-set` |
| `multiple` | `true` = checkbox, `false` = radio | `false` |
| `options` | Mảng option hiển thị | `[]` |
| `template` | Template component | `ui/form/element/checkbox-set` |

#### Cách 1 — `formElement="radioset"` + options class (thường dùng trong module)

```xml
<field name="type" formElement="radioset">
    <settings>
        <label translate="true">Loại</label>
        <options class="Vendor\Module\Model\Source\TypeOptions"/>
    </settings>
</field>
```

#### Cách 2 — thẻ `<radioset>` + options trong XML (theo ví dụ Adobe)

```xml
<radioset name="radioset_example">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="additionalInfo" xsi:type="string">Additional information</item>
        </item>
    </argument>
    <settings>
        <label translate="true">Radioset Component Example</label>
        <options>
            <option name="0" xsi:type="array">
                <item name="value" xsi:type="number">1</item>
                <item name="label" xsi:type="string" translate="true">Option #1</item>
            </option>
            <option name="1" xsi:type="array">
                <item name="value" xsi:type="number">2</item>
                <item name="label" xsi:type="string" translate="true">Option #2</item>
            </option>
        </options>
    </settings>
</radioset>
```

### C. Text (ô text / hiển thị text)

Nguồn chi tiết: [Text (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/text).

Hiển thị/chỉnh sửa chuỗi trong Form, DynamicRows, v.v. PHP: `Magento\Ui\Component\Form\Element\DataType\Text`. JS: `Magento_Ui/js/form/element/text.js`, `elementTmpl`: `ui/form/element/text`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `class` | Class PHP | `Magento\Ui\Component\Form\Element\DataType\Text` |
| `component` | RequireJS | `Magento_Ui/js/form/element/text` |
| `disabled` | Vô hiệu hóa | `false` |
| `elementTmpl` | Template control | `ui/form/element/text` |
| `label` | Nhãn | `''` |
| `links.value` | Liên kết `value` với provider | `${ $.provider }:${ $.dataScope }` |
| `visible` | Hiển thị | `true` |

Ví dụ `formElement="input"` + template text + import từ data provider (theo Adobe):

```xml
<field name="text_example" formElement="input" sortOrder="10">
    <settings>
        <elementTmpl>ui/form/element/text</elementTmpl>
        <label translate="true">Text Field Example</label>
        <imports>
            <link name="value">${ $.provider }:data.customer.firstname</link>
        </imports>
    </settings>
</field>
```

### D. Textarea

Nguồn chi tiết: [Textarea (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/text-area).

Field `<textarea>`. JS: `Magento_Ui/js/form/element/textarea.js`, `elementTmpl`: `ui/form/element/textarea`, khung field: `ui/form/field`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/form/element/textarea` |
| `elementTmpl` | Template textarea | `ui/form/element/textarea` |
| `template` | Template field | `ui/form/field` |
| `rows` / `cols` | Thuộc tính DOM | `2` / `15` |
| `label` | Nhãn | `''` |

#### Cách 1 — `formElement="textarea"` (thường gặp)

```xml
<field name="description" formElement="textarea">
    <settings>
        <label translate="true">Mô tả</label>
        <rows>5</rows>
        <cols>15</cols>
    </settings>
</field>
```

#### Cách 2 — `config` trong `argument` (theo ví dụ Adobe)

```xml
<field name="textarea_example">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="formElement" xsi:type="string">textarea</item>
            <item name="cols" xsi:type="number">15</item>
            <item name="rows" xsi:type="number">5</item>
            <item name="label" translate="true" xsi:type="string">Textarea Field Example</item>
            <item name="dataType" translate="true" xsi:type="string">text</item>
        </item>
    </argument>
</field>
```

## Liên kết
- Linh kiện composite & media (dynamic rows, uploader, WYSIWYG, urlInput, ui-select): [ui-library-form-composite.md](./ui-library-form-composite.md)
- Kiến trúc UI Components: [ui-components.md](./ui-components.md)
- How-to & Debug: [ui-components-howto.md](./ui-components-howto.md)
- Dựng form hoàn chỉnh (layout, dataSource, DataProvider, save): [admin-form.md](./admin-form.md)
- Thư viện JavaScript: [ui-components-js-library.md](./ui-components-js-library.md)
