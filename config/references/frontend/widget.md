# Tham khảo: Custom Widget

Nguồn: https://scandiweb.com/blog/magento-series-implementing-a-widget/

---

## 0. Tổng quan

Widget là UI component tái sử dụng, cho phép Admin thêm nội dung động vào CMS pages/blocks mà không cần code. Widget được khai báo qua `widget.xml` và render qua Block class + phtml template.

**Khi nào dùng:**
- Nội dung cần cấu hình từ Admin (banner, product list, promo block...)
- Tái sử dụng component ở nhiều trang khác nhau
- Non-developer cần tự thêm/sửa nội dung

---

## 1. Cấu trúc module

```
Vendor/Module/
├── etc/
│   ├── module.xml          # sequence: Magento_Widget
│   └── widget.xml          # khai báo widget
├── Block/
│   └── Widget/
│       └── MyWidget.php    # implements BlockInterface
└── view/
    └── frontend/
        └── templates/
            └── widget/
                └── my_widget.phtml
```

---

## 2. `etc/module.xml` — khai báo dependency

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module">
        <sequence>
            <module name="Magento_Widget"/>
            <module name="Magento_Cms"/>
        </sequence>
    </module>
</config>
```

---

## 3. `etc/widget.xml` — khai báo widget và parameters

```xml
<?xml version="1.0"?>
<widgets xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Widget:etc/widget.xsd">
    <widget class="Vendor\Module\Block\Widget\MyWidget"
            id="vendor_my_widget"
            placeholder_image="Vendor_Module::widget_icon.png">
        <label>My Custom Widget</label>
        <description>Widget mô tả ngắn gọn</description>
        <parameters>
            <!-- Text field -->
            <parameter name="heading_text" xsi:type="text" required="true" visible="true" sort_order="10">
                <label>Heading Text</label>
                <value>Default Heading</value>
            </parameter>

            <!-- Select field -->
            <parameter name="display_mode" xsi:type="select" required="false" visible="true" sort_order="20">
                <label>Display Mode</label>
                <options>
                    <option name="grid" value="grid">
                        <label>Grid</label>
                    </option>
                    <option name="list" value="list" selected="true">
                        <label>List</label>
                    </option>
                </options>
            </parameter>

            <!-- Number field -->
            <parameter name="items_count" xsi:type="text" required="false" visible="true" sort_order="30">
                <label>Number of Items</label>
                <value>5</value>
                <description>Enter a number between 1 and 20</description>
            </parameter>

            <!-- URL field -->
            <parameter name="button_url" xsi:type="text" required="false" visible="true" sort_order="40">
                <label>Button URL</label>
            </parameter>
        </parameters>
    </widget>
</widgets>
```

**Parameter types:**

| Type | Mô tả |
|---|---|
| `text` | Input text đơn giản |
| `select` | Dropdown với options cố định |
| `multiselect` | Multi-select |
| `block` | Custom block chooser (ví dụ: image chooser) |
| `conditions` | Catalog conditions (dùng cho product rules) |

**Quy tắc đặt tên parameter:** dùng `snake_case`. Để lấy giá trị trong Block: `$block->getHeadingText()` (magic getter từ `snake_case` → `CamelCase`).

---

## 4. Block class

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Block\Widget;

use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;

class MyWidget extends Template implements BlockInterface
{
    /**
     * Template file path (relative to view/frontend/templates/)
     */
    protected $_template = 'widget/my_widget.phtml';

    /**
     * Lấy heading text từ widget parameter
     */
    public function getHeadingText(): string
    {
        return (string) $this->getData('heading_text');
    }

    /**
     * Lấy display mode
     */
    public function getDisplayMode(): string
    {
        return (string) ($this->getData('display_mode') ?: 'list');
    }

    /**
     * Lấy số items
     */
    public function getItemsCount(): int
    {
        return (int) ($this->getData('items_count') ?: 5);
    }

    /**
     * Lấy button URL
     */
    public function getButtonUrl(): string
    {
        return (string) $this->getData('button_url');
    }
}
```

**Lưu ý:**
- Block phải `implements BlockInterface` (từ `Magento\Widget\Block\BlockInterface`)
- Không cần `@api` annotation vì đây là frontend block, không phải service contract
- Dùng `getData('parameter_name')` để lấy widget parameters

---

## 5. Template phtml

```php
<?php
/** @var \Vendor\Module\Block\Widget\MyWidget $block */
/** @var \Magento\Framework\Escaper $escaper */
?>
<div class="vendor-my-widget vendor-my-widget--<?= $escaper->escapeHtmlAttr($block->getDisplayMode()) ?>">
    <?php if ($block->getHeadingText()): ?>
        <h2 class="vendor-my-widget__heading">
            <?= $escaper->escapeHtml($block->getHeadingText()) ?>
        </h2>
    <?php endif; ?>

    <div class="vendor-my-widget__content">
        <!-- Nội dung widget -->
    </div>

    <?php if ($block->getButtonUrl()): ?>
        <a href="<?= $escaper->escapeUrl($block->getButtonUrl()) ?>"
           class="vendor-my-widget__button action primary">
            <?= $escaper->escapeHtml(__('View More')) ?>
        </a>
    <?php endif; ?>
</div>
```

---

## 6. Thêm widget vào CMS page qua Layout XML

Ngoài Admin UI, có thể thêm widget trực tiếp qua layout XML:

```xml
<!-- view/frontend/layout/cms_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\Widget\MyWidget"
                   name="vendor.my.widget"
                   template="Vendor_Module::widget/my_widget.phtml">
                <arguments>
                    <argument name="heading_text" xsi:type="string">My Heading</argument>
                    <argument name="display_mode" xsi:type="string">grid</argument>
                    <argument name="items_count" xsi:type="number">10</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

---

## 7. Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean
```

Sau đó:
1. Admin > Content > Widgets > Add Widget → chọn widget type mới
2. Cấu hình parameters và assign vào page/block
3. Kiểm tra frontend render đúng

---

## Liên kết

- Layout XML: xem [layout-xml.md](./layout-xml.md)
- ViewModel: xem [frontend-view-models.md](./frontend-view-models.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
