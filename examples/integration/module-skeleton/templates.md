# Templates: Core Files (Admin Grid CRUD)

Các template dưới đây là khung tối thiểu để AI generate module mới nhanh và nhất quán.

## 1) `registration.php`

```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    '<Vendor>_<Module>',
    __DIR__
);
```

## 2) `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="<Vendor>_<Module>"/>
</config>
```

## 3) `etc/db_schema.xml`

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="<table_name>" resource="default" engine="innodb" comment="<Entity> Table">
        <column xsi:type="int" name="<entity_id>" unsigned="true" nullable="false" identity="true" comment="ID"/>
        <column xsi:type="varchar" name="name" nullable="false" length="255" comment="Name"/>
        <column xsi:type="timestamp" name="created_at" nullable="false" default="CURRENT_TIMESTAMP" on_update="false" comment="Created At"/>
        <column xsi:type="timestamp" name="updated_at" nullable="false" default="CURRENT_TIMESTAMP" on_update="true" comment="Updated At"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="<entity_id>"/>
        </constraint>
    </table>
</schema>
```

## 4) `etc/di.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <preference for="<Vendor>\<Module>\Api\Data\<Entity>Interface" type="<Vendor>\<Module>\Model\<Entity>"/>
    <preference for="<Vendor>\<Module>\Api\<Entity>RepositoryInterface" type="<Vendor>\<Module>\Model\<Entity>Repository"/>
</config>
```

## 5) `etc/adminhtml/routes.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="<route_id>" frontName="<front_name>">
            <module name="<Vendor>_<Module>"/>
        </route>
    </router>
</config>
```

## 6) `view/adminhtml/layout/<route>_<controller>_index.xml`

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" layout="admin-1column"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="<entity>_listing"/>
        </referenceContainer>
    </body>
</page>
```

## 7) `view/adminhtml/ui_component/<entity>_listing.xml`

```xml
<?xml version="1.0"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <dataSource name="<entity>_listing_data_source" component="Magento_Ui/js/grid/provider">
        <settings>
            <storageConfig>
                <param name="indexField" xsi:type="string"><entity_id></param>
            </storageConfig>
            <updateUrl path="mui/index/render"/>
        </settings>
        <dataProvider class="<Vendor>\<Module>\Ui\DataProvider\<Entity>DataProvider" name="<entity>_listing_data_source">
            <settings>
                <requestFieldName><entity_id></requestFieldName>
                <primaryFieldName><entity_id></primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>
</listing>
```

## 8) `Controller/Adminhtml/<Entity>/Index.php`

```php
<?php declare(strict_types=1);

namespace <Vendor>\<Module>\Controller\Adminhtml\<Entity>;

use Magento\Backend\App\Action;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\Controller\ResultInterface;

class Index extends Action implements HttpGetActionInterface
{
    public const ADMIN_RESOURCE = '<Vendor>_<Module>::management';

    public function execute(): ResultInterface
    {
        $resultPage = $this->resultFactory->create(ResultFactory::TYPE_PAGE);
        $resultPage->setActiveMenu('<Vendor>_<Module>::management');
        $resultPage->getConfig()->getTitle()->prepend(__('<Entity> Listing'));
        return $resultPage;
    }
}
```

---

## Notes

- Tối thiểu phải đồng bộ `entity id` trong DB schema, model/resource model, data provider, UI listing.
- Luôn verify ACL resource keys giữa `acl.xml`, `menu.xml`, và controller `ADMIN_RESOURCE`.
- Khi AI generate module mới, giữ naming nhất quán để tránh lỗi binding ở UI components.
