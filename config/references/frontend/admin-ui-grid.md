# Tham khảo: Admin UI Grid

Nguồn: https://developer.adobe.com/commerce/php/development/components/add-admin-grid

---

## 1. Cấu trúc các thành phần

| Thành phần | Đường dẫn mẫu | Vai trò |
|------------|---------------|---------|
| **Layout** | `view/adminhtml/layout/route_index_index.xml` | Nhúng UI Component vào nội dung trang. |
| **UI XML** | `view/adminhtml/ui_component/custom_grid_listing.xml` | Khai báo cột, filter, paging, mass actions. |
| **Provider** | `Ui/DataProvider/ListingDataProvider.php` | Cầu nối cấp dữ liệu cho XML. |
| **Collection**| `Ui/DataProvider/Listing/Collection.php` | Chứa logic truy vấn DB (SQL). |
| **di.xml** | `etc/di.xml` | Khai báo `virtualType` để nối các thành phần. |

---

## 2. Khai báo UI Component trong Layout

```xml
<referenceContainer name="content">
    <uiComponent name="custom_grid_listing" />
</referenceContainer>
```

---

## 3. Cấu hình di.xml (Quan trọng nhất)

Sử dụng `virtualType` để tiết kiệm thời gian viết code.

```xml
<!-- Khai báo Collection riêng cho Grid -->
<virtualType name="MyCustomCollection" type="Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult">
    <arguments>
        <argument name="mainTable" xsi:type="string">my_custom_table</argument>
        <argument name="resourceModel" xsi:type="string">Vendor\Module\Model\ResourceModel\CustomEntity</argument>
    </arguments>
</virtualType>

<!-- Đăng ký Collection vào Provider chung của Magento -->
<type name="Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory">
    <arguments>
        <argument name="collections" xsi:type="array">
            <item name="custom_grid_listing_data_source" xsi:type="string">MyCustomCollection</item>
        </argument>
    </arguments>
</type>
```

---

## 4. UI Component XML (Basic)

File: `view/adminhtml/ui_component/custom_grid_listing.xml`

```xml
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dataSource name="custom_grid_listing_data_source">
        <argument name="dataProvider" xsi:type="configurableObject">
            <argument name="class" xsi:type="string">Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider</argument>
            <argument name="name" xsi:type="string">custom_grid_listing_data_source</argument>
            <argument name="primaryFieldName" xsi:type="string">entity_id</argument>
            <argument name="requestFieldName" xsi:type="string">id</argument>
        </argument>
    </dataSource>
    <columns name="custom_columns">
        <column name="entity_id">
            <settings>
                <filter>textRange</filter>
                <label translate="true">ID</label>
            </settings>
        </column>
        <column name="title">
            <settings>
                <filter>text</filter>
                <label translate="true">Tiêu đề</label>
            </settings>
        </column>
    </columns>
</listing>
```

---

## 5. Mass Actions

Mass actions cho phép thực hiện hành động hàng loạt trên các item được chọn.

```xml
<!-- Trong ui_component XML, thêm vào listing_top -->
<massaction name="listing_massaction">
    <action name="delete">
        <settings>
            <confirm>
                <message translate="true">Are you sure you want to delete selected items?</message>
                <title translate="true">Delete items</title>
            </confirm>
            <url path="vendor_module/entity/massDelete"/>
            <type>delete</type>
            <label translate="true">Delete</label>
        </settings>
    </action>
    <action name="disable">
        <settings>
            <url path="vendor_module/entity/massDisable"/>
            <type>disable</type>
            <label translate="true">Disable</label>
        </settings>
    </action>
</massaction>
```

Controller xử lý mass action:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\ResultFactory;
use Magento\Ui\Component\MassAction\Filter;
use Vendor\Module\Model\ResourceModel\Entity\CollectionFactory;

class MassDelete extends Action
{
    public function __construct(
        Context $context,
        private readonly Filter $filter,
        private readonly CollectionFactory $collectionFactory
    ) {
        parent::__construct($context);
    }

    public function execute(): \Magento\Framework\Controller\Result\Redirect
    {
        $collection = $this->filter->getCollection($this->collectionFactory->create());
        $deleted = 0;

        foreach ($collection as $item) {
            $item->delete();
            $deleted++;
        }

        $this->messageManager->addSuccessMessage(__('A total of %1 record(s) have been deleted.', $deleted));

        /** @var \Magento\Framework\Controller\Result\Redirect $resultRedirect */
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        return $resultRedirect->setPath('*/*/');
    }

    protected function _isAllowed(): bool
    {
        return $this->_authorization->isAllowed('Vendor_Module::entity_delete');
    }
}
```

---

## 6. Inline Edit

Inline edit cho phép sửa dữ liệu trực tiếp trong grid mà không cần vào trang edit.

```xml
<!-- Trong columns settings của UI XML -->
<columns name="custom_columns">
    <settings>
        <editorConfig>
            <param name="selectProvider" xsi:type="string">
                custom_grid_listing.custom_grid_listing.custom_columns.ids
            </param>
            <param name="enabled" xsi:type="boolean">true</param>
            <param name="indexField" xsi:type="string">entity_id</param>
            <param name="clientConfig" xsi:type="array">
                <item name="saveUrl" xsi:type="url" path="vendor_module/entity/inlineEdit"/>
                <item name="validateBeforeSave" xsi:type="boolean">false</item>
            </param>
        </editorConfig>
        <childDefaults>
            <param name="fieldAction" xsi:type="array">
                <item name="provider" xsi:type="string">
                    custom_grid_listing.custom_grid_listing.custom_columns_editor
                </item>
                <item name="target" xsi:type="string">startEdit</item>
                <item name="params" xsi:type="array">
                    <item name="0" xsi:type="string">${ $.$data.rowIndex }</item>
                    <item name="1" xsi:type="boolean">true</item>
                </item>
            </param>
        </childDefaults>
    </settings>

    <!-- Đánh dấu column có thể edit -->
    <column name="title">
        <settings>
            <filter>text</filter>
            <editor>
                <editorType>text</editorType>
                <validation>
                    <rule name="required-entry" xsi:type="boolean">true</rule>
                </validation>
            </editor>
            <label translate="true">Title</label>
        </settings>
    </column>
</columns>
```

Controller InlineEdit:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Vendor\Module\Api\EntityRepositoryInterface;

class InlineEdit extends Action
{
    public function __construct(
        Context $context,
        private readonly JsonFactory $jsonFactory,
        private readonly EntityRepositoryInterface $entityRepository
    ) {
        parent::__construct($context);
    }

    public function execute(): \Magento\Framework\Controller\Result\Json
    {
        $resultJson = $this->jsonFactory->create();
        $error = false;
        $messages = [];

        if ($this->getRequest()->getParam('isAjax')) {
            $postItems = $this->getRequest()->getParam('items', []);

            if (empty($postItems)) {
                $messages[] = __('Please correct the data sent.');
                $error = true;
            } else {
                foreach ($postItems as $entityId => $data) {
                    try {
                        $entity = $this->entityRepository->getById((int) $entityId);
                        $entity->setData(array_merge($entity->getData(), $data));
                        $this->entityRepository->save($entity);
                    } catch (\Exception $e) {
                        $messages[] = __('[Error:] %1', $e->getMessage());
                        $error = true;
                    }
                }
            }
        }

        return $resultJson->setData(['messages' => $messages, 'error' => $error]);
    }
}
```

---

## 7. Bookmarks (UI State Persistence)

Magento lưu trạng thái grid (filters, sort, column visibility) vào bảng `ui_bookmark` theo user.

**Vấn đề thường gặp:** Thêm column mới với `sortOrder` thấp nhưng column vẫn hiển thị cuối cùng → do bookmark cũ trong DB.

**Giải pháp:** Xóa bookmark của user trong `ui_bookmark` table:

```sql
-- Xem bookmarks hiện tại
SELECT * FROM ui_bookmark WHERE namespace = 'custom_grid_listing';

-- Xóa bookmark của user cụ thể
DELETE FROM ui_bookmark WHERE namespace = 'custom_grid_listing' AND user_id = 1;
```

Hoặc dùng `BookmarkRepositoryInterface` trong code:

```php
use Magento\Ui\Api\BookmarkRepositoryInterface;
use Magento\Ui\Api\BookmarkManagementInterface;

// Lấy bookmarks theo namespace
$bookmarks = $this->bookmarkManagement->loadByNamespace('custom_grid_listing');
foreach ($bookmarks->getItems() as $bookmark) {
    $this->bookmarkRepository->delete($bookmark);
}
```

**Khai báo bookmarks trong UI XML** (để grid lưu state):

```xml
<container name="listing_top">
    <bookmark name="bookmarks">
        <settings>
            <storageConfig>
                <param name="namespace" xsi:type="string">custom_grid_listing</param>
            </storageConfig>
        </settings>
    </bookmark>
    <!-- ... filters, paging ... -->
</container>
```

---

## 8. Lưu ý khi Debug

- **Cache:** Luôn xóa cache `config` và `page_cache` sau khi sửa UI XML.
- **Data Source Name:** Tên `dataSource` trong XML phải khớp 100% với tên `item` trong `di.xml`.
- **Duplicate ID:** Đảm bảo `entity_id` là duy nhất, nếu không các cột checkbox sẽ hoạt động sai.
- **Bookmark stale:** Nếu column order/visibility không đúng sau khi sửa XML, xóa row trong `ui_bookmark`.
- **Mass action không nhận IDs:** Kiểm tra `selectProvider` path trong `massaction` XML phải trỏ đúng tới `selectionsColumn`.

---

## Liên kết

- Routing & Controllers: xem [routing-controllers.md](../core/routing-controllers.md)
- Declarative Schema: xem [declarative-schema.md](../core/declarative-schema.md)
- UI Components: xem [ui-components.md](./ui-components.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)

Nguồn:
- [MassActions component](https://developer.adobe.com/commerce/frontend-core/ui-components/components/mass-actions) — developer.adobe.com
- [Inline Editing Grid](https://webkul.com/blog/inline-editing-grid-in-magento-2-backend/) — webkul.com — đã refactor theo constitution (strict_types, DI, no ObjectManager)
- [Admin Grid with UI Component](https://bsscommerce.com/blog/how-to-create-admin-grid-in-magento-2/) — bsscommerce.com — đã refactor theo constitution
- [UI Bookmarks](https://www.pixiecommerce.co.uk/blog/magento2-ui-component-bookmarks.html) — pixiecommerce.co.uk
