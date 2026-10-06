# Thư viện Linh kiện UI — Grid (Listing)

Tổng hợp linh kiện UI phục vụ **Grid/Listing Admin**: cột dữ liệu và cột đặc biệt, columnsControls/resize, inline edit, filters/export/expandable, kiến trúc listing & insertListing, toolbar, paging/sizes, search, range filter, tree mass actions, sortby, timeline.

> Tách từ tài liệu gốc *Thư viện Linh kiện UI (Common UI Components)* — đánh số section giữ nguyên theo bản gốc để tham chiếu chéo (ví dụ §23.B, §25.D) không vỡ.
> - Linh kiện Form (input/field/uploader): [ui-library-form.md](./ui-library-form.md)
> - Linh kiện Grid/Listing: [ui-library-grid.md](./ui-library-grid.md)
> - Khung & kiến trúc (button, bookmarks, container, modal, tab): [ui-library-shell.md](./ui-library-shell.md)

> Từ khóa tra cứu: listing grid, actionsColumn, selectionsColumn, columnsControls, inline edit, listingToolbar, paging, sizes, filterSearch, range, treeMassActions, sortby, thumbnailColumn, timeline.

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

---

## 6. Grid Columns (Listing)

Hệ thống quản lý cột dữ liệu trong Grid.

### A. Column (Base)
Linh kiện hiển thị dữ liệu của một field. Có thể tùy biến render bằng `bodyTmpl`.

### B. Columns (Container)
Vùng chứa toàn bộ các cột. Đây là nơi cấu hình **Inline Edit** (Sửa trực tiếp trên Grid).

### C. ColumnsEditor (Inline Edit)
Cấu hình bên trong `<columns>` để bật tính năng sửa nhanh — XML `editorConfig` + `<editor>` trên từng cột: xem mẫu đầy đủ (kèm `childDefaults`, `clientConfig` và controller InlineEdit PHP) tại [admin-ui-grid.md](./admin-ui-grid.md) §6.

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

---

## 8. Inline Editor Sub-components

Hệ thống Inline Edit hoạt động dựa trên sự phối hợp của nhiều linh kiện nhỏ:

- **ColumnsEditingClient**: Quản lý trạng thái dữ liệu tạm thời trên trình duyệt (Client-side state).
- **ColumnsEditingBulk**: Xử lý việc lưu hàng loạt (Bulk save) khi người dùng sửa nhiều dòng cùng lúc.
- **ColumnsEditorView**: Hiển thị các nút "Save", "Cancel" ở phía trên Grid khi đang ở chế độ sửa.
- **ColumnsEditorRecord**: Đại diện cho logic của một dòng dữ liệu đang được sửa.

Thông thường, lập trình viên chỉ cần cấu hình `editorConfig` trong XML, Magento sẽ tự động khởi tạo các sub-components này.

---

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
Cung cấp các hành động thực hiện trên nhiều bản ghi cùng lúc — XML `<massaction>` mẫu (confirm/url/type/label) và controller PHP xử lý: xem [admin-ui-grid.md](./admin-ui-grid.md) §5.

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

---

## Liên kết
- Kiến trúc UI Components: [ui-components.md](./ui-components.md)
- How-to & Debug: [ui-components-howto.md](./ui-components-howto.md)
- Dựng grid hoàn chỉnh (di.xml, mass action, inline edit, bookmark): [admin-ui-grid.md](./admin-ui-grid.md)
- Pager/Toolbar phía storefront: [pager-toolbar.md](./pager-toolbar.md)
- Thư viện JavaScript: [ui-components-js-library.md](./ui-components-js-library.md)
