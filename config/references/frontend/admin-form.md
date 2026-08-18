# Admin Form với UI Component trong Magento 2

Nguồn:
- [Fieldset component](https://developer.adobe.com/commerce/frontend-core/ui-components/components/fieldset) — developer.adobe.com
- [DynamicRows component](https://developer.adobe.com/commerce/frontend-core/ui-components/components/dynamic-rows) — developer.adobe.com
- [Create dynamic row configuration](https://developer.adobe.com/commerce/php/tutorials/admin/create-dynamic-row-configuration/) — developer.adobe.com
- [Dynamic Row with UI Components](https://magecomp.com/blog/use-dynamic-row-with-ui-components-magento-2/) — magecomp.com

---

## 1. Cấu trúc Admin Form

```
view/adminhtml/
├── layout/
│   └── vendor_module_entity_edit.xml    ← Layout nhúng UI form
└── ui_component/
    └── vendor_module_entity_form.xml    ← Form definition
```

---

## 2. Layout XML

```xml
<!-- view/adminhtml/layout/vendor_module_entity_edit.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="vendor_module_entity_form"/>
        </referenceContainer>
    </body>
</page>
```

---

## 3. Form UI Component XML

```xml
<!-- view/adminhtml/ui_component/vendor_module_entity_form.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_form.vendor_module_entity_form_data_source
            </item>
        </item>
        <item name="label" xsi:type="string" translate="true">Entity Information</item>
        <item name="reverseMetadataMerge" xsi:type="boolean">true</item>
    </argument>

    <settings>
        <buttons>
            <button name="save" class="Vendor\Module\Block\Adminhtml\Entity\Edit\SaveButton"/>
            <button name="delete" class="Vendor\Module\Block\Adminhtml\Entity\Edit\DeleteButton"/>
            <button name="back" class="Vendor\Module\Block\Adminhtml\Entity\Edit\BackButton"/>
        </buttons>
        <namespace>vendor_module_entity_form</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>vendor_module_entity_form.vendor_module_entity_form_data_source</dep>
        </deps>
    </settings>

    <dataSource name="vendor_module_entity_form_data_source">
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/form/provider</item>
            </item>
        </argument>
        <settings>
            <submitUrl path="vendor_module/entity/save"/>
        </settings>
        <dataProvider class="Vendor\Module\Ui\DataProvider\EntityDataProvider"
                      name="vendor_module_entity_form_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>

    <!-- Fieldset chính -->
    <fieldset name="general">
        <settings>
            <label translate="true">General Information</label>
        </settings>

        <!-- Hidden ID field -->
        <field name="entity_id" formElement="input">
            <settings>
                <dataType>text</dataType>
                <visible>false</visible>
            </settings>
        </field>

        <!-- Text input -->
        <field name="title" formElement="input">
            <settings>
                <label translate="true">Title</label>
                <dataType>text</dataType>
                <validation>
                    <rule name="required-entry" xsi:type="boolean">true</rule>
                    <rule name="max_text_length" xsi:type="number">255</rule>
                </validation>
            </settings>
        </field>

        <!-- Select -->
        <field name="status" formElement="select">
            <settings>
                <label translate="true">Status</label>
                <dataType>select</dataType>
            </settings>
            <formElements>
                <select>
                    <settings>
                        <options class="Vendor\Module\Model\Source\Status"/>
                    </settings>
                </select>
            </formElements>
        </field>

        <!-- Textarea -->
        <field name="description" formElement="textarea">
            <settings>
                <label translate="true">Description</label>
                <dataType>text</dataType>
            </settings>
        </field>

        <!-- Date picker -->
        <field name="start_date" formElement="date">
            <settings>
                <label translate="true">Start Date</label>
                <dataType>text</dataType>
            </settings>
        </field>

        <!-- Checkbox -->
        <field name="is_active" formElement="checkbox">
            <settings>
                <label translate="true">Is Active</label>
                <dataType>boolean</dataType>
            </settings>
            <formElements>
                <checkbox>
                    <settings>
                        <valueMap>
                            <map name="false" xsi:type="number">0</map>
                            <map name="true" xsi:type="number">1</map>
                        </valueMap>
                        <prefer>toggle</prefer>
                    </settings>
                </checkbox>
            </formElements>
        </field>
    </fieldset>

    <!-- Fieldset collapsible -->
    <fieldset name="advanced">
        <settings>
            <label translate="true">Advanced Settings</label>
            <collapsible>true</collapsible>
            <opened>false</opened>
        </settings>
        <!-- Fields... -->
    </fieldset>
</form>
```

---

## 4. DataProvider

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Ui\DataProvider;

use Magento\Ui\DataProvider\AbstractDataProvider;
use Vendor\Module\Model\ResourceModel\Entity\CollectionFactory;

class EntityDataProvider extends AbstractDataProvider
{
    private array $loadedData = [];

    public function __construct(
        string $name,
        string $primaryFieldName,
        string $requestFieldName,
        CollectionFactory $collectionFactory,
        array $meta = [],
        array $data = []
    ) {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
        $this->collection = $collectionFactory->create();
    }

    public function getData(): array
    {
        if (!empty($this->loadedData)) {
            return $this->loadedData;
        }

        foreach ($this->collection->getItems() as $entity) {
            $this->loadedData[$entity->getId()] = $entity->getData();
        }

        return $this->loadedData;
    }
}
```

---

## 5. Dynamic Rows

Dynamic rows cho phép user thêm/xóa nhiều row dữ liệu trong form.

```xml
<!-- Trong fieldset của form XML -->
<fieldset name="items_fieldset">
    <settings>
        <label translate="true">Items</label>
    </settings>

    <container name="items_container">
        <argument name="data" xsi:type="array">
            <item name="config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/dynamic-rows/dynamic-rows</item>
                <item name="template" xsi:type="string">ui/dynamic-rows/templates/default</item>
                <item name="componentType" xsi:type="string">dynamicRows</item>
                <item name="recordTemplate" xsi:type="string">record</item>
                <item name="addButtonLabel" xsi:type="string" translate="true">Add Item</item>
                <item name="deleteProperty" xsi:type="boolean">false</item>
                <item name="defaultRecord" xsi:type="boolean">false</item>
            </item>
        </argument>

        <container name="record">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="component" xsi:type="string">Magento_Ui/js/dynamic-rows/record</item>
                    <item name="isTemplate" xsi:type="boolean">true</item>
                    <item name="is_collection" xsi:type="boolean">true</item>
                    <item name="showFallbackReset" xsi:type="boolean">false</item>
                </item>
            </argument>

            <!-- Hidden ID cho existing records -->
            <field name="item_id">
                <argument name="data" xsi:type="array">
                    <item name="config" xsi:type="array">
                        <item name="visible" xsi:type="boolean">false</item>
                        <item name="dataType" xsi:type="string">text</item>
                        <item name="formElement" xsi:type="string">input</item>
                        <item name="dataScope" xsi:type="string">item_id</item>
                    </item>
                </argument>
            </field>

            <!-- Text field -->
            <field name="name">
                <argument name="data" xsi:type="array">
                    <item name="config" xsi:type="array">
                        <item name="dataType" xsi:type="string">text</item>
                        <item name="label" xsi:type="string" translate="true">Name</item>
                        <item name="formElement" xsi:type="string">input</item>
                        <item name="dataScope" xsi:type="string">name</item>
                        <item name="validation" xsi:type="array">
                            <item name="required-entry" xsi:type="boolean">true</item>
                        </item>
                        <item name="sortOrder" xsi:type="string">10</item>
                    </item>
                </argument>
            </field>

            <!-- Number field -->
            <field name="qty">
                <argument name="data" xsi:type="array">
                    <item name="config" xsi:type="array">
                        <item name="dataType" xsi:type="string">number</item>
                        <item name="label" xsi:type="string" translate="true">Quantity</item>
                        <item name="formElement" xsi:type="string">input</item>
                        <item name="dataScope" xsi:type="string">qty</item>
                        <item name="default" xsi:type="string">1</item>
                        <item name="validation" xsi:type="array">
                            <item name="validate-number" xsi:type="boolean">true</item>
                            <item name="validate-greater-than-zero" xsi:type="boolean">true</item>
                        </item>
                        <item name="sortOrder" xsi:type="string">20</item>
                    </item>
                </argument>
            </field>

            <!-- Delete button -->
            <actionDelete>
                <argument name="data" xsi:type="array">
                    <item name="config" xsi:type="array">
                        <item name="componentType" xsi:type="string">actionDelete</item>
                        <item name="dataType" xsi:type="string">text</item>
                        <item name="label" xsi:type="string" translate="true">Actions</item>
                        <item name="template" xsi:type="string">
                            Magento_Backend/dynamic-rows/cells/action-delete
                        </item>
                    </item>
                </argument>
            </actionDelete>
        </container>
    </container>
</fieldset>
```

---

## 6. Field Dependencies (show/hide dựa trên giá trị field khác)

```xml
<!-- Field hiển thị khi status = 1 -->
<field name="conditional_field" formElement="input">
    <settings>
        <label translate="true">Conditional Field</label>
        <dataType>text</dataType>
        <imports>
            <link name="visible">
                vendor_module_entity_form.vendor_module_entity_form.general.status:value
            </link>
        </imports>
    </settings>
</field>
```

Hoặc dùng `switcherConfig` cho logic phức tạp hơn:

```xml
<field name="type" formElement="select">
    <settings>
        <label translate="true">Type</label>
        <dataType>select</dataType>
        <switcherConfig>
            <rules>
                <rule name="0">
                    <value>simple</value>
                    <actions>
                        <action name="0">
                            <target>vendor_module_entity_form.vendor_module_entity_form.general.advanced_field</target>
                            <callback>hide</callback>
                        </action>
                    </actions>
                </rule>
                <rule name="1">
                    <value>configurable</value>
                    <actions>
                        <action name="0">
                            <target>vendor_module_entity_form.vendor_module_entity_form.general.advanced_field</target>
                            <callback>show</callback>
                        </action>
                    </actions>
                </rule>
            </rules>
            <enabled>true</enabled>
        </switcherConfig>
    </settings>
</field>
```

---

## 7. Save Button Block

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Block\Adminhtml\Entity\Edit;

use Magento\Framework\View\Element\UiComponent\Control\ButtonProviderInterface;

class SaveButton implements ButtonProviderInterface
{
    public function getButtonData(): array
    {
        return [
            'label'          => __('Save'),
            'class'          => 'save primary',
            'data_attribute' => [
                'mage-init' => ['button' => ['event' => 'save']],
                'form-role' => 'save',
            ],
            'sort_order'     => 90,
        ];
    }
}
```

---

## 8. Lưu ý

- `dataScope` trong dynamic rows phải khớp với key trong data array khi save
- Dùng `reverseMetadataMerge: true` trong form argument để tránh conflict khi extend form từ module khác
- Dynamic rows data được serialize thành JSON trong request — cần deserialize trong controller/model
- Với collapsible fieldset, `opened: false` giúp form load nhanh hơn khi có nhiều fields

---

## Liên kết

- Admin UI Grid: xem [admin-ui-grid.md](./admin-ui-grid.md)
- UI Components: xem [ui-components.md](./ui-components.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
