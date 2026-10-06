# Thư viện Linh kiện UI — Shell (Khung & Kiến trúc)

Tổng hợp linh kiện UI dạng **khung/kiến trúc**: button, bookmarks, container, kiến trúc Form & DataProvider, modal, masonry, navigation/tab_group & tab.

> Tách từ tài liệu gốc *Thư viện Linh kiện UI (Common UI Components)* — đánh số section giữ nguyên theo bản gốc để tham chiếu chéo (ví dụ §23.B, §25.D) không vỡ.
> - Linh kiện Form (input/field/uploader): [ui-library-form.md](./ui-library-form.md)
> - Linh kiện Grid/Listing: [ui-library-grid.md](./ui-library-grid.md)
> - Khung & kiến trúc (button, bookmarks, container, modal, tab): [ui-library-shell.md](./ui-library-shell.md)

> Từ khóa tra cứu: button component, bookmarks, container, form architecture, DataProvider, modal-component, masonry, navigation, tab_group.

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
- Troubleshooting bookmark stale (`ui_bookmark`) + SQL dọn state: xem [admin-ui-grid.md](./admin-ui-grid.md) §7.

---

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

Form XML đầy đủ theo module (layout, fieldset, field) xem [admin-form.md](./admin-form.md) §3.

### B. Form & Grid DataProvider Interface
Lớp PHP chịu trách nhiệm chuẩn bị mảng dữ liệu để JS UI Component có thể hiểu được.
- **Form DataProvider**: Trả về dữ liệu dạng `[entity_id => [data_fields]]`.
- **Grid DataProvider (SearchResult)**: Trả về danh sách `items` và `totalRecords`.
- Class PHP hoàn chỉnh (`AbstractDataProvider` + `getData()`): xem [admin-form.md](./admin-form.md) §4.

---

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
- Kiến trúc UI Components: [ui-components.md](./ui-components.md)
- How-to & Debug: [ui-components-howto.md](./ui-components-howto.md)
- Form hoàn chỉnh + DataProvider PHP: [admin-form.md](./admin-form.md)
- Bookmark troubleshooting (`ui_bookmark`): [admin-ui-grid.md](./admin-ui-grid.md) §7
- Thư viện JavaScript: [ui-components-js-library.md](./ui-components-js-library.md)
