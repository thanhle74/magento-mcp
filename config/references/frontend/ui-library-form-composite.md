# Thư viện Linh kiện UI — Form Composite & Media (Dynamic Rows, Uploader, WYSIWYG, UI-select)

Tổng hợp linh kiện UI phức tạp phục vụ **Form Admin**: dynamic rows, file/image uploader, WYSIWYG, urlInput, ui-select, multiline, insertForm, fieldset.

> Tách từ tài liệu gốc *Thư viện Linh kiện UI (Common UI Components)* — đánh số section giữ nguyên theo bản gốc để tham chiếu chéo (ví dụ §23.B, §25.D) không vỡ.
> - Nhập liệu cơ bản & lựa chọn (input/select/checkbox/date...): [ui-library-form.md](./ui-library-form.md)
> - Linh kiện Grid/Listing: [ui-library-grid.md](./ui-library-grid.md)
> - Khung & kiến trúc (button, bookmarks, container, modal, tab): [ui-library-shell.md](./ui-library-shell.md)

> Từ khóa tra cứu: dynamic rows, fileUploader, imageUploader, wysiwyg, urlInput, ui-select, multiline, insertForm, fieldset.

## 11. Danh sách động (Dynamic Rows)

Linh kiện cho phép quản lý một tập hợp dữ liệu lặp lại (ví dụ: Tier Price, Bundle Options). Đây là một trong những component phức tạp nhất.

### Cấu trúc cơ bản:
1. **DynamicRows**: Container chính.
2. **Container (Record)**: Lớp vỏ bọc cho một dòng dữ liệu (sử dụng `isTemplate = true`).
3. **Fields**: Các trường nhập liệu bên trong mỗi dòng.

### Cấu hình XML mẫu:
```xml
<dynamicRows name="my_dynamic_list">
    <settings>
        <addButtonLabel translate="true">Thêm dòng mới</addButtonLabel>
        <componentType>dynamicRows</componentType>
    </settings>
    <container name="record" component="Magento_Ui/js/dynamic-rows/record">
        <settings>
            <isTemplate>true</isTemplate>
            <is_collection>true</is_collection>
            <componentType>container</componentType>
        </settings>
        <!-- Các field trong một dòng -->
        <field name="title" formElement="input">
            <settings>
                <label translate="true">Tiêu đề</label>
            </settings>
        </field>
        <actionDelete name="action_delete"/> <!-- Nút xóa dòng -->
    </container>
</dynamicRows>
```

Mẫu XML đầy đủ kiểu `<argument>` (kèm field ẩn ID, validation từng field) xem thêm [admin-form.md](./admin-form.md) §5.

### Các tính năng nâng cao:
- **dndConfig (Drag & Drop)**: Hỗ trợ kéo thả để thay đổi thứ tự các dòng.
- **pageSize**: Hỗ trợ phân trang ngay bên trong danh sách động nếu số lượng dòng quá lớn.
- **identificationProperty**: Property dùng để định danh duy nhất mỗi dòng (mặc định là `record_id`).

---

---

## 12. Cấu trúc Form (Form Structure)

### Fieldset
Linh kiện dùng để nhóm các trường nhập liệu liên quan lại với nhau, giúp giao diện gọn gàng hơn.

```xml
<fieldset name="product_details">
    <settings>
        <label translate="true">Thông tin chi tiết</label>
        <collapsible>true</collapsible>
        <opened>true</opened> <!-- Trạng thái mặc định khi load trang -->
    </settings>
    <!-- Các field con ở đây -->
</fieldset>
```

---

---

## 13. Xử lý Tệp tin (File Management)

### File Uploader
Linh kiện tải tệp lên (Ảnh, Tài liệu) thông qua AJAX, hỗ trợ xem trước (preview).

```xml
<field name="image" formElement="fileUploader">
    <settings>
        <label translate="true">Ảnh đại diện</label>
        <componentType>fileUploader</componentType>
    </settings>
    <formElements>
        <fileUploader>
            <settings>
                <allowedExtensions>jpg jpeg gif png</allowedExtensions>
                <maxFileSize>2097152</maxFileSize> <!-- Bytes -->
                <uploaderConfig>
                    <param xsi:type="string" name="url">route/to/upload/controller</param>
                </uploaderConfig>
            </settings>
        </fileUploader>
    </formElements>
</field>
```

---

---

## 17. Xử lý Hình ảnh (Image Handling)

### ImageUploader
Kế thừa từ FileUploader nhưng chuyên dụng cho hình ảnh (có thumbnail preview và xóa ảnh).

```xml
<field name="image" formElement="imageUploader">
    <settings>
        <label translate="true">Ảnh sản phẩm</label>
        <componentType>imageUploader</componentType>
    </settings>
    <formElements>
        <imageUploader>
            <settings>
                <allowedExtensions>jpg jpeg gif png</allowedExtensions>
                <maxFileSize>2097152</maxFileSize>
                <uploaderConfig>
                    <param xsi:type="string" name="url">route/to/upload</param>
                </uploaderConfig>
                <previewTmpl>Magento_Catalog/image-preview</previewTmpl>
            </settings>
        </imageUploader>
    </formElements>
</field>
```

---

---

## 18. InsertForm (Sub-form)
Cho phép nhúng một Form UI Component hoàn chỉnh vào bên trong một Form khác. Rất hữu ích khi cần tái sử dụng logic form ở nhiều nơi (ví dụ: nhúng Form tạo Category vào Form tạo Product).

```xml
<insertForm name="my_sub_form">
    <settings>
        <formSubmitType>ajax</formSubmitType>
        <renderUrl path="mui/index/render_handle">
            <param name="handle">full_ui_component_name</param>
        </renderUrl>
        <loadingUrl path="mui/index/render"/>
        <toolbarContainer>${ $.parentName }</toolbarContainer>
        <ns>target_form_namespace</ns>
    </settings>
</insertForm>
```

---

---

## 21. Nhập liệu Phức hợp (Complex Inputs)

### B. Multiline

Nguồn chi tiết: [Multiline component (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/multiline).

**Multiline** là một nhóm các field **cùng kiểu** (ví dụ nhiều dòng **Street address**). Phía PHP: `Magento\Ui\Component\Form\Element\Multiline`; phía JS kế thừa `uiCollection`, component mặc định: `Magento_Ui/js/form/components/group`, template tổng: `ui/group/group.html`, template từng field: `ui/form/field` — file nguồn: `group.js`, `group.html`, `Multiline.php`.

#### Các tùy chọn `config` thường gặp

| Thuộc tính | Ý nghĩa | Kiểu | Mặc định |
|------------|---------|------|----------|
| `additionalClasses` | Class bổ sung cho block DOM | Object | `{}` |
| `breakLine` | `true` → class `admin__control-fields`; `false` → `admin__control-grouped` | Boolean | `true` |
| `component` | Đường dẫn RequireJS | String | `Magento_Ui/js/form/components/group` |
| `fieldTemplate` | Template HTML cho **từng** field con | String | `ui/form/field` |
| `label` | Nhãn nhóm | String | `''` |
| `required` | Bắt buộc | Boolean | `false` |
| `showLabel` | Có render label hay không | Boolean | `''` (theo doc Adobe) |
| `template` | Template tổng của nhóm | String | `ui/group/group` |
| `validateWholeGroup` | Hiển thị khối kết quả validation cho **cả nhóm** | Boolean | `false` |
| `visible` | Ẩn/hiện ban đầu | Boolean | `true` |

#### Cách 1 — `formElement="multiline"` (form XML chuẩn, ví dụ địa chỉ)

```xml
<field name="street" formElement="multiline">
    <settings>
        <label translate="true">Địa chỉ</label>
    </settings>
</field>
```

#### Cách 2 — `container` + `component=".../group"` (nhóm field tùy biến, như ví dụ Adobe)

Dùng khi cần nhiều field con khác loại trong cùng một “multiline/group” (select + checkbox + input trong một nhóm):

```xml
<container name="custom_group" component="Magento_Ui/js/form/components/group" sortOrder="20">
    <argument name="data" xsi:type="array">
        <item name="type" xsi:type="string">group</item>
        <item name="config" xsi:type="array">
            <item name="label" xsi:type="string" translate="true">Custom Group</item>
            <item name="required" xsi:type="boolean">true</item>
            <item name="validateWholeGroup" xsi:type="boolean">true</item>
        </item>
    </argument>
    <field name="select_element" formElement="select">
        <settings>
            <dataType>number</dataType>
            <labelVisible>false</labelVisible>
        </settings>
        <formElements>
            <select>
                <settings>
                    <options class="Magento\Config\Model\Config\Source\Yesno"/>
                </settings>
            </select>
        </formElements>
    </field>
    <field name="text_field" formElement="input">
        <settings>
            <validation>
                <rule name="required-entry" xsi:type="boolean">true</rule>
            </validation>
            <dataType>text</dataType>
        </settings>
    </field>
</container>
```

Chi tiết đầy đủ (thêm checkbox, `dataScope`, v.v.) xem trực tiếp trang Adobe ở link trên.

---

---

## 24. Nhập liệu Form (Bổ sung — phần E/F/G)

### E. WYSIWYG

Nguồn chi tiết: [WYSIWYG (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/wysiwyg/).

Adapter **TinyMCE** gắn với form UI Component; hỗ trợ cấu hình tương thích `tinymce.init()` (Magento không validate từng option — cần đối chiếu [TinyMCE](https://www.tiny.cloud/docs/) khi cấu hình). PHP: `Magento\Ui\Component\Form\Element\Wysiwyg`. JS: `Magento_Ui/js/form/element/wysiwyg.js`, `elementTmpl`: `ui/form/element/wysiwyg`, khung field: `ui/form/field`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `class` | Class PHP | `Magento\Ui\Component\Form\Element\Wysiwyg` |
| `component` | RequireJS | `Magento_Ui/js/form/element/wysiwyg` |
| `content` | Nội dung ban đầu | `''` |
| `elementSelector` | Selector phần tử bọc editor | `textarea` |
| `elementTmpl` | Template field WYSIWYG | `ui/form/element/wysiwyg` |
| `links.value` | Liên kết với provider | `${ $.provider }:${ $.dataScope }` |
| `template` | Template field chung | `ui/form/field` |

**Sự kiện (TinyMCE / adapter):** có thể bắt qua `varienGlobalEvents` (`mage/adminhtml/events`), ví dụ `tinymceFocus`, `tinymceBlur`, `tinymceChange`, `tinymcePaste`, `tinymceSaveContent`, `wysiwygEditorInitialized`, … — danh sách đầy đủ trên trang Adobe.

#### Ví dụ tối thiểu

```xml
<field name="content" formElement="wysiwyg">
    <settings>
        <label translate="true">Nội dung</label>
    </settings>
    <formElements>
        <wysiwyg>
            <settings>
                <wysiwyg>true</wysiwyg>
            </settings>
        </wysiwyg>
    </formElements>
</field>
```

#### Ví dụ có `wysiwygConfigData` (chiều cao, biến, widget, ảnh, directive)

```xml
<field name="wysiwyg_example" sortOrder="50" formElement="wysiwyg">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="wysiwygConfigData" xsi:type="array">
                <item name="height" xsi:type="string">100px</item>
                <item name="add_variables" xsi:type="boolean">true</item>
                <item name="add_widgets" xsi:type="boolean">true</item>
                <item name="add_images" xsi:type="boolean">true</item>
                <item name="add_directives" xsi:type="boolean">true</item>
            </item>
        </item>
    </argument>
    <settings>
        <label>Content</label>
    </settings>
    <formElements>
        <wysiwyg>
            <settings>
                <rows>8</rows>
                <wysiwyg>true</wysiwyg>
            </settings>
        </wysiwyg>
    </formElements>
</field>
```

#### Điều chỉnh động (PHP Modifiers)

Để sửa meta/config WYSIWYG lúc runtime, dùng **modifier**; data provider nên kế thừa `ModifierPoolDataProvider`. Chi tiết và ví dụ `WysiwygConfigModifier` + `di.xml` xem trang Adobe chính và [PHP Modifiers](./ui-components-modifiers.md).

#### Thêm editor bên thứ ba

Tài liệu: [Add a custom editor](https://developer.adobe.com/commerce/frontend-core/ui-components/components/wysiwyg/add-custom-editor).

Luồng ngắn gọn: đặt thư viện editor vào `view/base/web/js` → đăng ký trong `Magento\Cms\Model\Config\Source\Wysiwyg\Editor` (`adapterOptions`) + `Magento\Ui\Block\Wysiwyg\ActiveEditor` (`availableAdapterPaths`) → tạo **adapter** JS (các method tối thiểu: `getAdapterPrototype`, `setup`, `openFileBrowser`, `toggle`, `onFormValidation`, `encodeContent`, và khi cần variable/widget: `get`, `getContent`, `setContent`, …) → **requirejs-config.js** shim nếu cần.

#### Cấu hình TinyMCE

Tài liệu: [Configure the TinyMCE editor](https://developer.adobe.com/commerce/frontend-core/ui-components/components/wysiwyg/configure-tinymce-editor).

Cấu hình gom qua `CompositeConfigProvider` / `DefaultConfigProvider` (CMS, Page Builder, …). Mở rộng qua `di.xml` (`additionalSettings`, plugin `afterGetConfig`, …). Nếu chỉnh Page Builder TinyMCE: thường cần `sequence` phụ thuộc `Magento_PageBuilder` trong `module.xml`.

#### Extension points (Variable / Widget / Gallery)

Tài liệu: [WYSIWYG extension points](https://developer.adobe.com/commerce/frontend-core/ui-components/components/wysiwyg/extension-points).

Tích hợp entity vào editor tùy: plugin thư mục, icon, JS plugin (TinyMCE / CKEditor mẫu trong doc), đăng ký plugin. Cấu hình tổng: `Magento\Cms\Model\Wysiwyg\Config`, tổng hợp qua `Magento\Cms\Model\Wysiwyg\CompositeConfigProvider` (`variablePluginConfigProvider`, `widgetPluginConfigProvider`, `galleryConfigProvider`, `wysiwygConfigPostProcessor`).

---

### F. UrlInput

Nguồn chi tiết: [urlInput (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/url-input).

Field chọn/khai báo **URL** (nhiều kiểu link: text, category, product, …). PHP: `Magento\Ui\Component\Form\Element\UrlInput`. JS: `Magento_Ui/js/form/element/url-input`, template tổng: `ui/form/element/url-input`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `class` | Class PHP | `Magento\Ui\Component\Form\Element\UrlInput` |
| `component` | RequireJS | `Magento_Ui/js/form/element/url-input` |
| `isDisplayAdditionalSettings` | Hiển thị block cài đặt thêm | `true` |
| `settingTemplate` | Template cài đặt (vd. mở tab mới) | `ui/form/element/urlInput/setting` |
| `settingValue` | Giá trị mặc định checkbox “mở tab mới” | `false` |
| `template` | Template field | `ui/form/element/url-input` |
| `typeSelectorTemplate` | Template chọn loại link | `ui/form/element/urlInput/typeSelector` |
| `urlTypes` | Object cấu hình từng loại URL (thường trỏ tới provider) | `{}` |

Mặc định có thể dùng `Magento\Ui\Model\UrlInput\LinksConfigProvider` (nhập URL dạng text); mở rộng qua `di.xml` (`linksConfiguration`). Mỗi loại implement `Magento\Ui\Model\UrlInput\ConfigInterface::getConfig()`. Core có sẵn kiểu **Category** / **Product** (`Magento\Catalog\Ui\Component\UrlInput\Category`, `...\Product`).

**Cấu hình provider (ví dụ):**

```xml
<type name="Magento\Ui\Model\UrlInput\LinksConfigProvider">
    <arguments>
        <argument name="linksConfiguration" xsi:type="array">
            <item name="default" xsi:type="string">Magento\Ui\Model\UrlInput\DefaultLink</item>
        </argument>
    </arguments>
</type>
```

**Form XML:**

```xml
<urlInput name="url_input_example">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="urlTypes" xsi:type="object">Magento\Ui\Model\UrlInput\LinksConfigProvider</item>
        </item>
    </argument>
</urlInput>
```

---

### G. UI-select

Nguồn chi tiết: [UI-select (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/secondary-ui-select) *(trang doc tên “UI-select / secondary-ui-select”)*.

Select đơn / đa (checkbox hiển thị tùy cấu hình), hỗ trợ **cây**, tìm kiếm, chip. JS: `Magento_Ui/js/form/element/ui-select.js` (kế thừa abstract), template filter grid: `ui/grid/filters/elements/ui-select.html`.

**Bắt buộc (ý chính):** `imports` (nguồn `options`, v.d. `${ $.optionsConfig.name }:options`), `actions` (nhãn cho selectAll, deselectAll, selectPage, deselectPage, …).

**Tùy chọn (một phần):** `chipsEnabled`, `closeBtn`, `filterPlaceholder`, `searchUrl` (cần controller xử lý tìm; có thể override `processRequest`), `pageLimit`, `showCheckbox`, `showTree`, `levelsVisibility`, `emptyOptionsHtml`, `missingValuePlaceholder`, … — bảng đầy đủ trên trang Adobe.

**Chế độ:** `simple` — tắt `showCheckbox`, `chipsEnabled`, `closeBtn`; `optgroup` — tắt checkbox / `openLevelsAction`, bật `lastSelectable`, `optgroupLabels`, `labelsDecoration`.

**Ví dụ filter trên listing** (`filterSelect` — theo `cms_page_listing`):

```xml
<filterSelect name="uiSelect">
    <argument name="optionsProvider" xsi:type="configurableObject">
        <argument name="class" xsi:type="string">Magento\Cms\Model\Page\Source\PageLayout</argument>
    </argument>
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="component" xsi:type="string">Magento_Ui/js/form/element/ui-select</item>
            <item name="template" xsi:type="string">ui/grid/filters/elements/ui-select</item>
            <item name="dataScope" xsi:type="string">uiSelect</item>
            <item name="label" xsi:type="string" translate="true">uiSelect</item>
        </item>
    </argument>
</filterSelect>
```

**Phím:** Enter / Space mở hoặc chọn, Escape đóng, PageUp / PageDown di chuyển focus — chi tiết trên doc.

---

---

## Liên kết
- Nhập liệu cơ bản & lựa chọn: [ui-library-form.md](./ui-library-form.md)
- Kiến trúc UI Components: [ui-components.md](./ui-components.md)
- How-to & Debug: [ui-components-howto.md](./ui-components-howto.md)
- Dựng form hoàn chỉnh (layout, dataSource, DataProvider, save): [admin-form.md](./admin-form.md)
