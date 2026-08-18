# Thư viện Linh kiện UI (Common UI Components)

Tài liệu này tổng hợp các linh kiện UI phổ biến được sử dụng trong Admin Panel và các form/grid phức tạp.

---

## 1. Button component

Linh kiện đại diện cho một nút bấm với các tính năng nâng cao như xác nhận (confirmation) và liên kết hành động.

### Cấu hình XML mẫu:
```xml
<button name="save" class="Magento\Catalog\Block\Adminhtml\Category\Edit\SaveButton">
    <settings>
        <label translate="true">Lưu sản phẩm</label>
        <class>primary</class> <!-- CSS class: primary, secondary... -->
        <dataScope>data</dataScope>
    </settings>
</button>
```

### Các tính năng quan trọng:
- **actions**: Định nghĩa các hành động JS sẽ chạy khi click (gọi hàm của component khác).
- **confirm**: Hiển thị popup xác nhận trước khi thực hiện.
```xml
<confirm>
    <message translate="true">Bạn có chắc chắn muốn xóa?</message>
    <title translate="true">Xác nhận xóa</title>
</confirm>
```

---

## 2. ActionsColumn & ActionDelete

Dùng trong Grid (Listing) để hiển thị các liên kết thao tác cho từng dòng dữ liệu.

### Cấu hình XML:
```xml
<actionsColumn name="actions" class="Vendor\Module\Ui\Component\Listing\Column\Actions">
    <settings>
        <indexField>entity_id</indexField>
        <label translate="true">Thao tác</label>
    </settings>
</actionsColumn>
```

### Xử lý PHP (DataProvider):
Class phải kế thừa `Magento\Ui\Component\Listing\Columns\Column` và ghi đè `prepareDataSource`.
```php
public function prepareDataSource(array $dataSource) {
    if (isset($dataSource['data']['items'])) {
        foreach ($dataSource['data']['items'] as & $item) {
            $item[$this->getData('name')] = [
                'edit' => [
                    'href' => $this->urlBuilder->getUrl('route/to/edit', ['id' => $item['entity_id']]),
                    'label' => __('Sửa')
                ],
                'delete' => [
                    'href' => '#',
                    'label' => __('Xóa'),
                    'isAjax' => true,
                    'confirm' => ['title' => __('Xác nhận'), 'message' => __('Xóa dòng này?')]
                ]
            ];
        }
    }
    return $dataSource;
}
```

---

## 3. Bookmarks (Views Management)

Linh kiện cho phép người dùng lưu lại trạng thái của Grid (cột đang ẩn/hiện, filter, thứ tự sắp xếp).

### Vị trí: 
Thường nằm trong `<listingToolbar>`.

### Cấu hình:
```xml
<listingToolbar name="listing_top">
    <bookmarks name="bookmarks"/>
    <!-- ... các linh kiện khác như filters, paging ... -->
</listingToolbar>
```

### Lưu ý:
- Bookmarks yêu cầu `namespace` của listing phải duy nhất để lưu vào database (table `ui_bookmark`).
- Đây là linh kiện "im lặng", nó tự động theo dõi thay đổi của các component khác trong cùng namespace và lưu trạng thái.

---

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

## 6. Grid Columns (Listing)

Hệ thống quản lý cột dữ liệu trong Grid.

### A. Column (Base)
Linh kiện hiển thị dữ liệu của một field. Có thể tùy biến render bằng `bodyTmpl`.

### B. Columns (Container)
Vùng chứa toàn bộ các cột. Đây là nơi cấu hình **Inline Edit** (Sửa trực tiếp trên Grid).

### C. ColumnsEditor (Inline Edit)
Cấu hình bên trong `<columns>` để bật tính năng sửa nhanh.
```xml
<columns name="listing_columns">
    <settings>
        <editorConfig>
            <param name="indexField" xsi:type="string">entity_id</param>
            <param name="enabled" xsi:type="boolean">true</param>
            <param name="selectProvider" xsi:type="string">listing_name.listing_name.listing_top.ids</param>
        </editorConfig>
    </settings>
    <!-- Cột cho phép sửa -->
    <column name="title">
        <settings>
            <editor>
                <editorType>text</editorType>
                <validation>
                    <rule name="required-entry" xsi:type="boolean">true</rule>
                </validation>
            </editor>
            <label translate="true">Tiêu đề</label>
        </settings>
    </column>
</columns>
```

---

## 7. Các tùy chỉnh Cột (Grid Customization)

Nâng cao trải nghiệm người dùng trên Grid.

### A. ColumnsControls (Show/Hide Columns)
Linh kiện quản lý menu thả xuống "Columns" để người dùng tự chọn cột muốn xem.
```xml
<listingToolbar name="listing_top">
    <columnsControls name="columns_controls"/>
</listingToolbar>
```
- **minVisible**: Số lượng cột tối thiểu không được ẩn (mặc định: 1).
- **maxVisible**: Số lượng cột tối đa hiển thị trong menu (mặc định: 30).

### B. ColumnsResize
Cho phép người dùng thay đổi độ rộng của cột bằng cách kéo thả cạnh tiêu đề.
```xml
<columns name="listing_columns">
    <settings>
        <resizeConfig>
            <enabled>true</enabled>
            <rootSelector>${ $.columnsProvider }:container</rootSelector>
        </resizeConfig>
    </settings>
</columns>
```

---

## 8. Inline Editor Sub-components

Hệ thống Inline Edit hoạt động dựa trên sự phối hợp của nhiều linh kiện nhỏ:

- **ColumnsEditingClient**: Quản lý trạng thái dữ liệu tạm thời trên trình duyệt (Client-side state).
- **ColumnsEditingBulk**: Xử lý việc lưu hàng loạt (Bulk save) khi người dùng sửa nhiều dòng cùng lúc.
- **ColumnsEditorView**: Hiển thị các nút "Save", "Cancel" ở phía trên Grid khi đang ở chế độ sửa.
- **ColumnsEditorRecord**: Đại diện cho logic của một dòng dữ liệu đang được sửa.

Thông thường, lập trình viên chỉ cần cấu hình `editorConfig` trong XML, Magento sẽ tự động khởi tạo các sub-components này.

---

## 9. Container Component

Linh kiện bọc (wrapper) đơn giản nhất, dùng để nhóm các linh kiện khác lại với nhau mà không cần thêm logic phức tạp. Kế thừa từ `uiCollection`.

```xml
<container name="my_group">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="label" xsi:type="string" translate="true">Nhóm Linh Kiện</item>
        </item>
    </argument>
    <!-- Các component con ở đây -->
</container>
```

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

### Các tính năng nâng cao:
- **dndConfig (Drag & Drop)**: Hỗ trợ kéo thả để thay đổi thứ tự các dòng.
- **pageSize**: Hỗ trợ phân trang ngay bên trong danh sách động nếu số lượng dòng quá lớn.
- **identificationProperty**: Property dùng để định danh duy nhất mỗi dòng (mặc định là `record_id`).

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

## 14. Công cụ Grid (Grid Tools)

Các linh kiện bổ trợ nằm trên thanh công cụ của Listing.

### A. Export Button
Cung cấp tính năng xuất dữ liệu Grid ra tệp tin. Thường hỗ trợ CSV và Excel XML.
```xml
<listingToolbar name="listing_top">
    <exportButton name="export_button"/>
</listingToolbar>
```

### B. Filters
Bảng điều khiển chứa các bộ lọc dữ liệu. Magento sẽ tự động thu thập các cột có khai báo `<filter>` và đưa vào đây.
```xml
<listingToolbar name="listing_top">
    <filters name="listing_filters"/>
</listingToolbar>
```

### C. Filters Chips (Active Filters)
Hiển thị các "nhãn" (tags) của những bộ lọc đang được người dùng áp dụng. Cho phép người dùng xóa nhanh từng bộ lọc. Thường nằm trong `filters` component.

### D. Expandable Column (Grid Detail)
Cột đặc biệt cho phép "bung" chi tiết của dòng dữ liệu ngay tại chỗ.
- Cần chỉ định `bodyTmpl` để hiển thị nội dung mở rộng.
- Thường dùng để hiển thị thông tin metadata phức tạp của bản ghi.

---

## 15. Kiến trúc Form & Dữ liệu (Form Architecture)

### A. Form Component
Linh kiện gốc cho các trang chỉnh sửa/tạo mới. Nó quản lý việc gửi dữ liệu (submit), xác thực (validation) và trạng thái của toàn bộ các field bên trong.

```xml
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <settings>
        <buttons>
            <button name="save" class="Vendor\Module\Block\Adminhtml\Edit\SaveButton"/>
            <button name="back" class="Vendor\Module\Block\Adminhtml\Edit\BackButton"/>
        </buttons>
        <namespace>my_form_identifier</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>my_form_identifier.my_form_data_source</dep>
        </deps>
    </settings>
    <dataSource name="my_form_data_source">
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/form/provider</item>
            </item>
        </argument>
        <settings>
            <submitUrl path="route/to/save"/>
        </settings>
        <dataProvider class="Vendor\Module\Ui\DataProvider\MyDataProvider" name="my_form_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>
</form>
```

### B. Form & Grid DataProvider Interface
Lớp PHP chịu trách nhiệm chuẩn bị mảng dữ liệu để JS UI Component có thể hiểu được.
- **Form DataProvider**: Trả về dữ liệu dạng `[entity_id => [data_fields]]`.
- **Grid DataProvider (SearchResult)**: Trả về danh sách `items` và `totalRecords`.

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

## 19. Kiến trúc Grid & Listing (Listing Architecture)

### A. Listing (Grid) Component
Linh kiện cốt lõi để hiển thị danh sách dữ liệu trong Admin. Nó phối hợp giữa `dataSource` (PHP) và `columns` (JS) để tạo ra bảng dữ liệu có tính năng lọc, phân trang và sắp xếp.

```xml
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <settings>
        <buttons>
            <button name="add" class="Vendor\Module\Block\Adminhtml\Grid\AddButton"/>
        </buttons>
        <spinner>my_columns_name</spinner>
        <deps>
            <dep>my_listing_identifier.my_data_source</dep>
        </deps>
    </settings>
    <!-- Config DataSource tương tự Form nhưng component là grid/provider -->
</listing>
```

### B. InsertListing
Dùng để nhúng một trang Listing hoàn chỉnh vào một Component khác (thường là Form). Ví dụ: hiển thị danh sách đơn hàng của khách hàng ngay trong trang chi tiết khách hàng.

### C. MassActions
Cung cấp các hành động thực hiện trên nhiều bản ghi cùng lúc.
```xml
<listingToolbar name="listing_top">
    <massaction name="listing_massaction">
        <action name="delete">
            <settings>
                <confirm>
                    <message translate="true">Xóa các bản ghi đã chọn?</message>
                    <title translate="true">Xác nhận</title>
                </confirm>
                <url path="route/to/massDelete"/>
                <type>delete</type>
                <label translate="true">Xóa</label>
            </settings>
        </action>
    </massaction>
</listingToolbar>
```

---

## 20. Linh kiện Popup & Layout

### A. Modal (Popup)

Nguồn chi tiết: [Modal (Adobe Commerce UI Components)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/modal).

Modal là cửa sổ phụ chồng lên trang; dùng được ở Admin và storefront. JS: `Magento_Ui/.../modal/modal-component.js`, template: `ui/modal/modal-component.html` (kế thừa `uiCollection`).

#### Các tùy chọn thường dùng (trong `config` / `settings`)

| Thuộc tính | Ý nghĩa | Mặc định (gợi nhớ) |
|------------|---------|---------------------|
| `modalClass` | CSS class gốc của template | `modal-component` |
| `onCancel` | Tên method khi user đóng modal | `closeModal` |
| `options` | Object truyền xuống modal widget (title, subTitle, buttons, type, slide/popup, responsive, innerScroll, autoOpen, …) | — |
| `subTitle` | Phụ đề header | `''` |
| `template` | Đường dẫn template `.html` | `ui/modal/modal-component` |
| `title` | Tiêu đề header | `''` |
| `valid` | Trạng thái hợp lệ (ảnh hưởng luồng Done) | `true` |

Có thể khai báo theo kiểu `<argument name="data">` + `config` (như tài liệu Adobe) hoặc `<settings>` + `<options>` tùy form/listing đang merge.

#### Methods / sự kiện chính (phía JS component)

- `openModal()` / `closeModal()` / `toggleModal()`
- `actionCancel()` — khôi phục trạng thái con như lúc mở, rồi đóng
- `actionDone()` — validate nội dung con, hợp lệ thì đóng
- `setTitle()` / `setSubTitle()` — đổi tiêu đề động
- `setPrevValues(elem)` — reset nhánh component con

#### Ví dụ tối thiểu (settings + type popup)

```xml
<modal name="my_modal">
    <settings>
        <options>
            <option name="title" xsi:type="string" translate="true">Thông báo</option>
            <option name="type" xsi:type="string">popup</option>
            <option name="responsive" xsi:type="boolean">true</option>
        </options>
    </settings>
    <!-- fieldset, field, container... -->
</modal>
```

#### Mở modal từ Button (target + action)

Nút gọi `openModal` trên instance modal (dùng `targetName` + `actionName`; `parentName` / `${ $.name }` tùy cây component):

```xml
<button name="open_my_modal">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="title" xsi:type="string" translate="true">Mở modal</item>
            <item name="actions" xsi:type="array">
                <item name="0" xsi:type="array">
                    <item name="targetName" xsi:type="string">${ $.parentName }.my_modal</item>
                    <item name="actionName" xsi:type="string">openModal</item>
                </item>
            </item>
        </item>
    </argument>
</button>
```

Trang Adobe có thêm ví dụ đầy đủ (fieldset + field, bộ nút Cancel / Clear / Done trong `options.buttons`, và modal `autoOpen` + `type` popup). Khi cần copy pattern production, nên đối chiếu trực tiếp link ở đầu mục.

### B. Masonry Layout
Sắp xếp các khối linh kiện con theo dạng "gạch xếp" (giống Pinterest), tự động tối ưu không gian hiển thị.

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

## 22. Cột Grid — MultiselectColumn, OnOffColumn & LinkColumn

### A. MultiselectColumn

Nguồn chi tiết: [MultiselectColumn (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/multiselect-column).

Cột checkbox để chọn nhiều dòng + hỗ trợ Mass Actions; là con của **Listing**. JS: `Magento_Ui/js/grid/columns/multiselect.js`, template header/body theo doc.

#### Tùy chọn

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `bodyTmpl` | Template ô trong body | `ui/grid/cells/multiselect` |
| `controlVisibility` | Có cho ColumnsControls ẩn/hiện cột | `false` |
| `draggable` | Kéo thả thứ tự cột | `false` |
| `fieldClass` | Class bổ sung cho ô | `{'data-grid-checkbox-cell': true}` |
| `headerTmpl` | Template header cột | `ui/grid/columns/multiselect` |
| `indexField` | Field ID duy nhất mỗi dòng | — (bắt buộc cấu hình) |
| `preserveSelectionsOnFilter` | Giữ selection khi đổi filter | `false` |
| `sortable` | Cho phép sort theo cột | `false` |

#### Cách khuyên dùng — `selectionsColumn` (listing XML hiện đại)

```xml
<columns name="entity_columns">
    <selectionsColumn name="ids">
        <settings>
            <indexField>entity_id</indexField>
        </settings>
    </selectionsColumn>
</columns>
```

#### Cách cũ / tùy biến sâu — `<column>` + `js_config` + `Magento\Ui\Component\MassAction\Columns\Column`

```xml
<column name="ids" class="Magento\Ui\Component\MassAction\Columns\Column">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="component" xsi:type="string">Magento_Ui/js/grid/columns/multiselect</item>
        </item>
        <item name="config" xsi:type="array">
            <item name="indexField" xsi:type="string">page_id</item>
        </item>
    </argument>
</column>
```

Có thể ghi đè `headerTmpl`, `indexField`, hoặc `imports` (theo ví dụ trên trang Adobe). Không phát sinh event riêng; component khác đọc state qua registry/subscription.

---

### B. OnOffColumn

Nguồn chi tiết: [OnOffColumn (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/on-off-column).

**Decorator** của MultiselectColumn: hiển thị **toggle** thay vì checkbox. Kế thừa MultiselectColumn. JS: `Magento_Ui/js/grid/columns/onoff.js`.

| Thuộc tính | Mặc định (gợi nhớ) |
|------------|-------------------|
| `component` | `Magento_Ui/js/grid/columns/onoff` |
| `bodyTmpl` | `ui/grid/cells/onoff` |
| `headerTmpl` | `ui/grid/columns/onoff` |
| `fieldClass` | `admin__scope-old`, `data-grid-onoff-cell`, tắt `data-grid-checkbox-cell` |

```xml
<column name="status_toggle" component="Magento_Ui/js/grid/columns/onoff">
    <settings>
        <dataType>select</dataType>
    </settings>
</column>
```

---

### C. LinkColumn

Hiển thị text có gắn link tĩnh hoặc động (xử lý trong `prepareDataSource` / renderer).

---

## 23. ListingToolbar & Công cụ Phân trang

### A. ListingToolbar

Nguồn chi tiết: [ListingToolbar (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/toolbar).

Container phía trên **listing**: gom bookmark, columns controls, search, filters, mass actions, paging, v.v. JS: `Magento_Ui/js/grid/toolbar.js` (kế thừa `UiCollection`), template: `ui/grid/toolbar`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `sticky` | Toolbar cố định khi cuộn (paging/filter/header bám viewport) | `false` |
| `stickyClass` | Class bổ sung cho root khi sticky | `{'sticky-header': true}` |
| `stickyTmpl` | Template phần sticky | `ui/grid/sticky/sticky` |
| `template` | Template toolbar | `ui/grid/toolbar` |

Ví dụ đầy đủ (sticky + các công cụ — theo Adobe):

```xml
<listingToolbar name="listing_top">
    <settings>
        <sticky>true</sticky>
    </settings>
    <bookmark name="bookmarks"/>
    <columnsControls name="columns_controls"/>
    <filterSearch name="fulltext"/>
    <filters name="listing_filters">
        <!-- filter definitions -->
    </filters>
    <massaction name="listing_massaction">
        <!-- actions -->
    </massaction>
    <paging name="listing_paging"/>
</listingToolbar>
```

### B. Paging

Nguồn chi tiết: [Paging (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/paging).

Phân trang cho **Listing**; tạo thêm instance **Sizes** (chọn số bản ghi/trang). JS: `Magento_Ui/js/grid/paging/paging.js`, template: `ui/grid/paging/paging`, tổng số bản ghi: `ui/grid/paging-total`.

#### Tùy chọn

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `current` | Trang hiện tại | `1` |
| `sizesConfig.maxSize` | Số phần tử tối đa mỗi trang (truyền cho Sizes) | `999` |
| `sizesConfig.minSize` | Tối thiểu | `1` |
| `template` | Template paging | `ui/grid/paging/paging` |
| `totalTmpl` | Template dòng “tổng số bản ghi” | `ui/grid/paging-total` |

#### Gắn trong listingToolbar

```xml
<listingToolbar name="listing_top">
    <paging name="listing_paging"/>
</listingToolbar>
```

#### Cấu hình kích thước trang và danh sách tùy chọn

```xml
<paging name="listing_paging">
    <settings>
        <options>
            <option name="32" xsi:type="array">
                <item name="value" xsi:type="number">32</item>
                <item name="label" xsi:type="string">32</item>
            </option>
            <option name="48" xsi:type="array">
                <item name="value" xsi:type="number">48</item>
                <item name="label" xsi:type="string">48</item>
            </option>
        </options>
        <pageSize>32</pageSize>
    </settings>
</paging>
```

### C. Sizes

Nguồn chi tiết: [Sizes (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/sizes).

Con của **Paging**: định nghĩa **số bản ghi tối đa** trên một trang và danh sách mức chọn. JS: `Magento_Ui/js/grid/paging/sizes.js`, template: `ui/grid/paging/sizes`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/grid/paging/sizes` |
| `maxSize` | Số dòng tối đa cho phép | `999` |
| `minSize` | Số dòng tối thiểu | `1` |
| `options` | Danh sách kích thước trang (mảng `{ value, label }`) | `[]` |
| `template` | Template | `ui/grid/paging/sizes` |
| `value` | Số dòng mỗi trang ban đầu | `20` |

**SizeOption:** mỗi phần tử cần `value` (number) và `label` (hiển thị).

Thường **không khai báo Sizes riêng** mà cấu hình qua `sizesConfig` bên trong **Paging** (xem §23.B). Ví dụ tích hợp (theo Adobe):

```xml
<paging name="listing_paging">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="sizesConfig" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/grid/paging/sizes</item>
                <item name="template" xsi:type="string">ui/grid/paging/sizes</item>
                <item name="maxSize" xsi:type="number">500</item>
            </item>
        </item>
    </argument>
</paging>
```

### D. Search (filterSearch)

Nguồn chi tiết: [Search (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/search).

Ô tìm kiếm **fulltext** trên grid; gom các filter khác. JS: `Magento_Ui/js/grid/search/search.js`, template: `ui/grid/search/search`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `label` | Nhãn ô tìm | `$t('Keyword')` |
| `placeholder` | Placeholder khi rỗng | `'Search by keyword'` |
| `statefull.value` | Lưu `value` vào storage khi đổi | `true` |
| `template` | Template | `ui/grid/search/search` |

Gắn trong `listingToolbar`:

```xml
<listingToolbar name="listing_top">
    <filterSearch name="fulltext"/>
</listingToolbar>
```

Cấu hình đầy đủ (provider, chips, bookmarks) ví dụ:

```xml
<filterSearch name="fulltext">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="provider" xsi:type="string">ns.ns.listing_top.my_data_source</item>
            <item name="chipsProvider" xsi:type="string">ns.ns.listing_top.listing_filters_chips</item>
            <item name="storageConfig" xsi:type="array">
                <item name="provider" xsi:type="string">ns.ns.listing_top.bookmarks</item>
                <item name="namespace" xsi:type="string">current.search</item>
            </item>
        </item>
    </argument>
</filterSearch>
```

### E. Range (filter — from / to)

Nguồn chi tiết: [Range (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/range).

Bộ lọc **khoảng** trên grid: hai ô **from / to** (kiểu `date` hoặc `text`). PHP backend: `Magento\Ui\Component\Filters\Type\Range`. JS: `Magento_Ui/js/grid/filters/range`, template: `ui/grid/filters/elements/group`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `class` | Class PHP xử lý backend | `Magento\Ui\Component\Filters\Type\Range` |
| `component` | RequireJS | `Magento_Ui/js/grid/filters/range` |
| `isRange` | Bật chế độ range | `true` |
| `rangeType` | Loại input con (`date`, …) | — |
| `template` | Template nhóm | `ui/grid/filters/elements/group` |

**API JS:** `buildChildren()`, `clear()`, `hasData()`.

Khai báo trên **column** (Magento map sang `dateRange` / `textRange`):

```xml
<column name="period">
    <settings>
        <filter>dateRange</filter>
        <label translate="true">Period</label>
    </settings>
</column>
```

```xml
<column name="size">
    <settings>
        <filter>textRange</filter>
        <label translate="true">Size</label>
    </settings>
</column>
```

### F. TreeMassActions

Nguồn chi tiết: [TreeMassActions (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/tree-mass-actions).

**Decorator** của MassActions: thêm **menu lồng nhau** (nested actions). JS: `Magento_Ui/js/grid/tree-massactions.js`, template: `ui/grid/tree-massactions`, submenu: `ui/grid/submenu` (kế thừa MassActions).

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `submenuTemplate` | Template submenu | `ui/grid/submenu` |
| `template` | Template component | `ui/grid/tree-massactions` |
| `actions` | Danh sách `MassActionContainer` \| `MassAction` | — |

**MassActionContainer:** `label`, `type` (id), `actions` (mảng con — có thể lồng container hoặc action lá).

```xml
<massaction name="listing_massaction" component="Magento_Ui/js/grid/tree-massactions">
    <action name="action_example">
        <argument name="data" xsi:type="array">
            <item name="config" xsi:type="array">
                <item name="type" xsi:type="string">action</item>
                <item name="label" xsi:type="string" translate="true">Actions</item>
            </item>
        </argument>
        <argument name="actions" xsi:type="array">
            <item name="0" xsi:type="array">
                <item name="type" xsi:type="string">sub_action1</item>
                <item name="label" xsi:type="string" translate="true">Sub action #1</item>
                <item name="url" xsi:type="url" path="some/path">
                    <param name="some_param">1</param>
                </item>
            </item>
            <item name="1" xsi:type="array">
                <item name="type" xsi:type="string">sub_action2</item>
                <item name="label" xsi:type="string" translate="true">Sub action #2</item>
                <item name="url" xsi:type="url" path="some/path">
                    <param name="some_param">2</param>
                </item>
            </item>
        </argument>
    </action>
</massaction>
```

### G. Sortby

Nguồn chi tiết: [Sortby (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/sortby).

Điều khiển **sắp xếp** cột (asc/desc). JS: `Magento_Ui/js/grid/sortBy.js`, template: `ui/grid/sortBy`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `template` | Template | `ui/grid/sortBy` |
| `options` | Danh sách tùy chọn sort | `[]` |
| `applied` | Sort đang áp dụng | `{}` |
| `sorting` | `asc` hoặc `desc` | `asc` |
| `selectedOption` | Option đang chọn | — |
| `isVisible` | Hiển thị component | `true` |

Ví dụ (container `sorting` + `columnProvider` — theo Adobe):

```xml
<container name="sorting"
           provider="dataProvider"
           displayArea="sorting"
           sortOrder="20"
           component="Magento_Ui/js/grid/sortBy">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="deps" xsi:type="array">
                <item name="0" xsi:type="string">columnProvider</item>
            </item>
        </item>
    </argument>
</container>
<columns name="columnProvider">
    <column name="name">
        <settings>
            <label translate="true">Name</label>
            <visible>false</visible>
            <sortable>true</sortable>
        </settings>
    </column>
</columns>
```

---

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

## 25. Cột Grid (Bổ sung cuối)

### A. SelectColumn

Nguồn chi tiết: [SelectColumn (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/select-column).

Nhận mảng **value → label**: hiển thị trong ô grid đúng nhãn ứng với giá trị bản ghi. JS: `Magento_Ui/js/grid/columns/select.js` (kế thừa Column).

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/grid/columns/select` |
| `filter` | Tham chiếu filter (hoặc object mở rộng) trong Filters | — |
| `label` | Header cột | `''` |
| `options` | `{ value, label }` (value có thể string/number/array tùy doc) | `[]` |
| `visible` | Ẩn/hiện | `true` |

Mỗi option cần `value` và `label`.

```xml
<column name="select_column_example" component="Magento_Ui/js/grid/columns/select">
    <settings>
        <filter>select</filter>
        <dataType>select</dataType>
        <label translate="true">Select Column</label>
        <visible>true</visible>
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
</column>
```

Nên đặt `<filters name="listing_filters"/>` trong `listingToolbar` nếu dùng filter trên cột (theo ví dụ Adobe).

### B. ThumbnailColumn

Nguồn chi tiết: [ThumbnailColumn (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/thumbnail-column).

Cột **ảnh preview**; click mở popup xem lớn. JS: `Magento_Ui/js/grid/columns/thumbnail.js` (kế thừa Column). Có thể dùng kèm class PHP (ví dụ Catalog).

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `bodyTmpl` | Template ô trong body | `ui/grid/cells/thumbnail` |
| `fieldClass` | Class ô | `{'data-grid-thumbnail-cell': true}` |

```xml
<column name="thumbnail" component="Magento_Ui/js/grid/columns/thumbnail"
        class="Magento\Catalog\Ui\Component\Listing\Columns\Thumbnail">
    <settings>
        <hasPreview>1</hasPreview>
        <addField>true</addField>
        <label translate="true">Thumbnail</label>
        <sortable>false</sortable>
    </settings>
</column>
```

### C. TimelineColumns (timeline listing)

Nguồn chi tiết: [TimelineColumns (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/timeline-columns).

**Columns** dạng **timeline** (trục thời gian). `columns` dùng `component="Magento_Ui/js/timeline/timeline"`. JS: `Magento_Ui/js/timeline/timeline.js`, `recordTmpl`: `ui/timeline/record`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/timeline/timeline` |
| `recordTmpl` | Template một dòng | `ui/timeline/record` |
| `dateFormat` | Format `start_time` / `end_time` | `YYYY-MM-DD HH:mm:ss` |
| `headerFormat` | Format header cột | `ddd MM/DD` |
| `scale` / `scaleStep` / `minScale` / `maxScale` | Phạm vi & bước (ngày) | `7` / `1` / `7` / `28` |
| `displayMode` / `displayModes` / `viewConfig` | Chế độ hiển thị & cấu hình view | `timeline`, object mặc định theo doc |

```xml
<columns name="cms_page_columns" component="Magento_Ui/js/timeline/timeline">
    <argument name="data" xsi:type="array">
        <item name="config" xsi:type="array">
            <item name="scale" xsi:type="number">7</item>
        </item>
    </argument>
    <column name="name">
        <settings>
            <filter>text</filter>
            <label translate="true">Name</label>
        </settings>
    </column>
    <column name="start_time" class="Magento\Ui\Component\Listing\Columns\Date"
            component="Magento_Ui/js/grid/columns/date">
        <settings>
            <dateFormat>YYYY-MM-DD HH:mm:ss</dateFormat>
            <label translate="true">Start Time</label>
        </settings>
    </column>
    <column name="end_time" class="Magento\Ui\Component\Listing\Columns\Date"
            component="Magento_Ui/js/grid/columns/date">
        <settings>
            <dateFormat>YYYY-MM-DD HH:mm:ss</dateFormat>
            <label translate="true">End Time</label>
        </settings>
    </column>
</columns>
```

### D. Cột khác

- **OnOffColumn**: **§22.B**.

---

## 26. Navigation (Tab group)

Nguồn chi tiết: [Navigation (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/navigation).

**Navigation** triển khai **điều hướng dạng tab** trong UI Component Form (JS: `Magento_Ui/js/form/components/tab_group`, template: `ui/tab`). UX tab trong Admin: [Tabs (Admin Design Pattern Library)](https://developer.adobe.com/commerce/admin-developer/pattern-library/containers/tabs/). Linh kiện con từng tab: có thể tham khảo [Tab component](https://developer.adobe.com/commerce/frontend-core/ui-components/components/tab).

### Tùy chọn

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `collapsible` | Bật/tắt chế độ thu gọn (collapsible) | `false` |
| `component` | RequireJS constructor | `Magento_Ui/js/form/components/tab_group` |
| `opened` | Trạng thái mở ban đầu khi `collapsible` bật | `true` |
| `template` | Template HTML | `ui/tab` |

Các tab con (fieldset, form sections) khai báo như **children** của container navigation trong `ui_component` form — tham khảo form mẫu trong core (ví dụ product/category) hoặc merge XML từ module.

### Khác với `htmlContent` + Block

Khi chỉ cần nhúng nội dung render bởi **Block PHP** (không dùng cây UI Component tab), có thể dùng:

```xml
<htmlContent name="my_tab_content">
    <block class="Vendor\Module\Block\Adminhtml\MyTabBlock"/>
</htmlContent>
```

Hai cách phục vụ bối cảnh khác nhau: **Navigation / tab_group** = tabs thuần UI Component; **htmlContent** = chèn block/layout truyền thống.

### Tab (nội dung từng tab — content area)

Nguồn chi tiết: [Tab (Adobe Commerce)](https://developer.adobe.com/commerce/frontend-core/ui-components/components/tab).

**Tab** là **vùng nội dung** của một tab trong form (khác **Navigation** `tab_group` — thanh điều hướng). UX: [Tabs (Admin Design Pattern Library)](https://developer.adobe.com/commerce/admin-developer/pattern-library/containers/tabs/). JS: `Magento_Ui/js/form/components/area`, template: `templates/layout/tabs/tab/default`.

| Thuộc tính | Ý nghĩa | Mặc định |
|------------|---------|----------|
| `component` | RequireJS | `Magento_Ui/js/form/components/area` |
| `template` | Template tab content | `templates/layout/tabs/tab/default` |
| `uniqueNs` | Namespace duy nhất | `params.activeArea` |

Tích hợp với **Form**: trong `<settings><layout>` đặt `type` = `tabs`, `navContainerName` (ví dụ `left`); mỗi **fieldset** con đóng vai một tab có `label`:

```xml
<form>
    <argument name="data" xsi:type="array">
        <item name="label" xsi:type="string" translate="true">Tabs</item>
    </argument>
    <settings>
        <layout>
            <navContainerName>left</navContainerName>
            <type>tabs</type>
        </layout>
    </settings>
    <fieldset name="tab1">
        <settings>
            <label translate="true">Tab 1</label>
        </settings>
    </fieldset>
    <fieldset name="tab2">
        <settings>
            <label translate="true">Tab 2</label>
        </settings>
    </fieldset>
</form>
```

---

## Liên kết
- [Kiến trúc UI Components](./ui-components.md)
- [How-to & Debug](./ui-components-howto.md)
- [Admin UI Grid](./admin-ui-grid.md)
- [Thư viện JavaScript](./ui-components-js-library.md)
