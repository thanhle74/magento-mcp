# Tham khảo: Layout XML

Nguồn: https://developer.adobe.com/commerce/frontend-core/guide/layouts/

---

## Tổng quan

Layout XML định nghĩa cấu trúc trang — blocks, containers, và cách chúng được sắp xếp. Mỗi trang có một hoặc nhiều **layout handles** xác định file XML nào được load.

---

## Layout Handles

Handle là tên định danh cho một tập hợp layout instructions. Magento merge tất cả XML files có cùng handle.

| Handle | Khi nào áp dụng |
|--------|----------------|
| `default` | Mọi trang |
| `catalog_product_view` | Trang product detail |
| `catalog_category_view` | Trang category |
| `checkout_cart_index` | Trang giỏ hàng |
| `customer_account_index` | Trang tài khoản |
| `cms_index_index` | Trang chủ |
| `<route>_<controller>_<action>` | Route cụ thể |

### Thêm handle tùy chỉnh từ Controller

```php
public function execute()
{
    $this->_view->loadLayout();
    $this->_view->getLayout()->getUpdate()->addHandle('my_custom_handle');
    $this->_view->renderLayout();
}
```

---

## Blocks vs Containers

| | Block | Container |
|--|-------|-----------|
| **Mục đích** | Render nội dung (có PHP class + template) | Bọc HTML wrapper, không có logic |
| **Class** | Kế thừa `Magento\Framework\View\Element\Template` | Không có class PHP |
| **Template** | Có file `.phtml` | Không có template |
| **Render** | Có thể render HTML | Chỉ render children |

---

## Cú pháp cơ bản

### Tạo Block mới

```xml
<block class="Vendor\Module\Block\MyBlock"
       name="vendor.module.myblock"
       template="Vendor_Module::my_template.phtml"
       cacheable="false">
    <arguments>
        <argument name="view_model" xsi:type="object">Vendor\Module\ViewModel\MyViewModel</argument>
        <argument name="custom_string" xsi:type="string">Hello World</argument>
        <argument name="custom_bool" xsi:type="boolean">true</argument>
    </arguments>
</block>
```

### Tạo Container

```xml
<container name="vendor.module.wrapper"
           htmlTag="div"
           htmlClass="my-wrapper"
           label="My Wrapper">
    <!-- blocks con đặt ở đây -->
</container>
```

### Tham chiếu Block/Container đã có

```xml
<!-- Thêm block vào container đã có -->
<referenceContainer name="content">
    <block class="Vendor\Module\Block\MyBlock"
           name="vendor.module.myblock"
           template="Vendor_Module::my_template.phtml" />
</referenceContainer>

<!-- Sửa block đã có -->
<referenceBlock name="product.info.main">
    <arguments>
        <argument name="view_model" xsi:type="object">Vendor\Module\ViewModel\ProductData</argument>
    </arguments>
</referenceBlock>
```

### Di chuyển Block

```xml
<!-- Di chuyển block sang container khác -->
<move element="vendor.module.myblock"
      destination="sidebar.main"
      before="-"
      after="some.other.block" />
```

### Xóa Block

```xml
<referenceBlock name="some.block.name" remove="true" />
```

### Disable Block (giữ trong DOM nhưng không render)

```xml
<referenceBlock name="some.block.name" display="false" />
```

---

## Argument types

| xsi:type | Ví dụ |
|----------|-------|
| `string` | `<argument name="title" xsi:type="string">Hello</argument>` |
| `boolean` | `<argument name="flag" xsi:type="boolean">true</argument>` |
| `number` | `<argument name="count" xsi:type="number">10</argument>` |
| `object` | `<argument name="vm" xsi:type="object">Vendor\Module\ViewModel\Foo</argument>` |
| `array` | Xem ví dụ bên dưới |
| `options` | Source model cho select |
| `url` | URL builder |
| `helper` | Helper method (deprecated — dùng ViewModel thay thế) |

```xml
<!-- Array argument -->
<argument name="config" xsi:type="array">
    <item name="key1" xsi:type="string">value1</item>
    <item name="key2" xsi:type="boolean">false</item>
</argument>
```

---

## Vị trí file Layout XML

```
<Vendor>/<Module>/view/
├── frontend/
│   └── layout/
│       ├── default.xml              # Áp dụng mọi trang frontend
│       ├── catalog_product_view.xml # Trang product detail
│       └── <handle>.xml
├── adminhtml/
│   └── layout/
│       └── <handle>.xml
└── base/
    └── layout/
        └── <handle>.xml             # Áp dụng cả frontend và adminhtml
```

---

## Page Layout types

Khai báo trong `<page layout="...">`:

| Layout | Mô tả |
|--------|-------|
| `empty` | Không có header/footer |
| `1column` | 1 cột (trang CMS, checkout) |
| `2columns-left` | 2 cột, sidebar trái |
| `2columns-right` | 2 cột, sidebar phải |
| `3columns` | 3 cột |

```xml
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      layout="2columns-left"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\MyBlock"
                   name="vendor.module.myblock"
                   template="Vendor_Module::my_template.phtml" />
        </referenceContainer>
    </body>
</page>
```

---

## Thứ tự render (before/after)

```xml
<block name="my.block" before="other.block" />   <!-- render trước other.block -->
<block name="my.block" after="other.block" />    <!-- render sau other.block -->
<block name="my.block" before="-" />             <!-- render đầu tiên -->
<block name="my.block" after="-" />              <!-- render cuối cùng -->
```

---

## Lấy argument trong template

```php
// Trong .phtml
$viewModel = $block->getData('view_model');       // lấy theo key
$title = $block->getData('custom_string');
$config = $block->getData('config');              // array argument

// Hoặc dùng magic getter (camelCase)
$viewModel = $block->getViewModel();              // getData('view_model')
$customString = $block->getCustomString();        // getData('custom_string')
```

---

## Anti-patterns

- **KHÔNG** viết logic PHP trong `.phtml` — dùng ViewModel
- **KHÔNG** kế thừa Block core chỉ để thêm helper method — dùng ViewModel
- **KHÔNG** dùng `helper` argument type — deprecated, dùng ViewModel
- **KHÔNG** hardcode HTML trong Block PHP class — dùng template

---

## Liên kết

- ViewModel: xem [frontend-view-models.md](./frontend-view-models.md)
- UI Components: xem [ui-components.md](./ui-components.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
