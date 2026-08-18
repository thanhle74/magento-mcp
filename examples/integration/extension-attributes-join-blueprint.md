# Blueprint: Extension Attributes với Join Directive

> Nguồn: https://developer.adobe.com/commerce/php/development/components/add-attributes/ — đã refactor theo constitution
> Mục đích: Thêm extension attribute vào Order entity, load từ bảng riêng qua join

---

## Use case

Thêm field `vendor_notes` vào Order entity, lưu vào bảng `vendor_module_order_notes`, expose qua REST API.

---

## Cấu trúc module

```
app/code/Vendor/Module/
├── etc/
│   ├── module.xml
│   ├── di.xml
│   └── extension_attributes.xml
├── Api/
│   └── Data/
│       └── OrderNotesInterface.php
├── Model/
│   ├── OrderNotes.php
│   └── ResourceModel/
│       └── OrderNotes.php
├── Plugin/
│   └── Sales/
│       └── Api/
│           └── OrderRepositoryPlugin.php
└── Setup/
    └── Patch/
        └── Schema/
            └── CreateOrderNotesTable.php
```

---

## `etc/extension_attributes.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">

    <!-- Scalar attribute với join directive (tự động load qua getList) -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="vendor_notes" type="string">
            <join reference_table="vendor_module_order_notes"
                  reference_field="order_id"
                  join_on_field="entity_id">
                <field>notes</field>
            </join>
        </attribute>
    </extension_attributes>

    <!-- Non-scalar attribute (cần plugin để load) -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="vendor_order_notes_object" type="Vendor\Module\Api\Data\OrderNotesInterface" />
    </extension_attributes>
</config>
```

---

## `etc/di.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Plugin để load/save extension attribute -->
    <type name="Magento\Sales\Api\OrderRepositoryInterface">
        <plugin name="vendor_module_order_extension_attributes"
                type="Vendor\Module\Plugin\Sales\Api\OrderRepositoryPlugin" />
    </type>

    <!-- Plugin để tránh null extension attributes -->
    <type name="Magento\Sales\Api\Data\OrderInterface">
        <plugin name="vendor_module_order_extension_attributes_init"
                type="Vendor\Module\Plugin\Sales\Api\Data\OrderExtensionAttributesPlugin" />
    </type>
</config>
```

---

## `Api/Data/OrderNotesInterface.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api\Data;

/**
 * @api
 * @since 1.0.0
 */
interface OrderNotesInterface
{
    public const FIELD_ID = 'entity_id';
    public const FIELD_ORDER_ID = 'order_id';
    public const FIELD_NOTES = 'notes';
    public const FIELD_CREATED_AT = 'created_at';

    public function getId(): ?int;

    public function getOrderId(): int;

    public function setOrderId(int $orderId): static;

    public function getNotes(): string;

    public function setNotes(string $notes): static;

    public function getCreatedAt(): ?string;
}
```

---

## `Plugin/Sales/Api/OrderRepositoryPlugin.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Sales\Api;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\Data\OrderSearchResultInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Vendor\Module\Api\Data\OrderNotesInterface;
use Vendor\Module\Model\ResourceModel\OrderNotes as OrderNotesResource;
use Vendor\Module\Model\OrderNotesFactory;

class OrderRepositoryPlugin
{
    public function __construct(
        private readonly OrderNotesResource $orderNotesResource,
        private readonly OrderNotesFactory $orderNotesFactory
    ) {}

    /**
     * Load extension attributes sau khi get single order
     */
    public function afterGet(
        OrderRepositoryInterface $subject,
        OrderInterface $order
    ): OrderInterface {
        return $this->loadExtensionAttributes($order);
    }

    /**
     * Load extension attributes sau khi getList
     */
    public function afterGetList(
        OrderRepositoryInterface $subject,
        OrderSearchResultInterface $searchResult
    ): OrderSearchResultInterface {
        $orders = [];
        foreach ($searchResult->getItems() as $order) {
            $orders[] = $this->loadExtensionAttributes($order);
        }
        $searchResult->setItems($orders);
        return $searchResult;
    }

    /**
     * Save extension attributes sau khi save order
     */
    public function afterSave(
        OrderRepositoryInterface $subject,
        OrderInterface $result,
        OrderInterface $order
    ): OrderInterface {
        $extensionAttributes = $order->getExtensionAttributes();
        if ($extensionAttributes === null) {
            return $result;
        }

        $notesObject = $extensionAttributes->getVendorOrderNotesObject();
        if ($notesObject !== null) {
            $notesObject->setOrderId((int) $result->getEntityId());
            $this->orderNotesResource->save($notesObject);
        }

        return $result;
    }

    private function loadExtensionAttributes(OrderInterface $order): OrderInterface
    {
        $extensionAttributes = $order->getExtensionAttributes();
        if ($extensionAttributes === null) {
            return $order;
        }

        // Load notes object từ DB
        $notes = $this->orderNotesFactory->create();
        $this->orderNotesResource->loadByOrderId($notes, (int) $order->getEntityId());

        if ($notes->getId()) {
            $extensionAttributes->setVendorOrderNotesObject($notes);
        }

        $order->setExtensionAttributes($extensionAttributes);
        return $order;
    }
}
```

---

## `Plugin/Sales/Api/Data/OrderExtensionAttributesPlugin.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Sales\Api\Data;

use Magento\Sales\Api\Data\OrderExtensionFactory;
use Magento\Sales\Api\Data\OrderExtensionInterface;
use Magento\Sales\Api\Data\OrderInterface;

class OrderExtensionAttributesPlugin
{
    public function __construct(
        private readonly OrderExtensionFactory $extensionFactory
    ) {}

    /**
     * Tránh null extension attributes
     */
    public function afterGetExtensionAttributes(
        OrderInterface $entity,
        ?OrderExtensionInterface $extension
    ): OrderExtensionInterface {
        if ($extension === null) {
            $extension = $this->extensionFactory->create();
        }
        return $extension;
    }
}
```

---

## `Setup/Patch/Schema/CreateOrderNotesTable.php`

> Lưu ý: Schema patch dùng `db_schema.xml`, không dùng PHP patch cho schema.

Tạo `etc/db_schema.xml`:

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="vendor_module_order_notes" resource="default" engine="innodb"
           comment="Vendor Module Order Notes">
        <column xsi:type="int" name="entity_id" unsigned="true" nullable="false" identity="true"
                comment="Entity ID"/>
        <column xsi:type="int" name="order_id" unsigned="true" nullable="false"
                comment="Order Entity ID"/>
        <column xsi:type="text" name="notes" nullable="true" comment="Notes"/>
        <column xsi:type="timestamp" name="created_at" on_update="false" nullable="false"
                default="CURRENT_TIMESTAMP" comment="Created At"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>
        <constraint xsi:type="foreign" referenceId="VENDOR_MODULE_ORDER_NOTES_ORDER_ID_SALES_ORDER_ENTITY_ID"
                    table="vendor_module_order_notes" column="order_id"
                    referenceTable="sales_order" referenceColumn="entity_id"
                    onDelete="CASCADE"/>
        <index referenceId="VENDOR_MODULE_ORDER_NOTES_ORDER_ID" indexType="btree">
            <column name="order_id"/>
        </index>
    </table>
</schema>
```

---

## REST API Response

Sau khi setup, extension attributes tự động xuất hiện trong response:

```json
{
    "entity_id": 1,
    "increment_id": "000000001",
    "status": "processing",
    "extension_attributes": {
        "vendor_notes": "Customer requested gift wrapping",
        "vendor_order_notes_object": {
            "entity_id": 1,
            "order_id": 1,
            "notes": "Customer requested gift wrapping",
            "created_at": "2026-04-22 10:00:00"
        }
    }
}
```

---

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

# Test qua REST API
curl -X GET <BASE_URL>/rest/V1/orders/1 \
  -H "Authorization: Bearer <admin-token>"

# Kiểm tra extension_attributes có trong response
```

---

## Lưu ý

- Join directive chỉ hoạt động với `getList()`, không hoạt động với `get()` (single load)
- Với `get()`, cần plugin `afterGet` để load thủ công
- Sau khi thêm `extension_attributes.xml`, phải chạy `setup:di:compile`
- Generated file: `generated/code/Magento/Sales/Api/Data/OrderExtensionInterface.php`

---

## Liên kết

- Reference: [config/references/core/extension-attributes.md](../../config/references/core/extension-attributes.md)
- Service Contracts: [config/references/core/service-contracts.md](../../config/references/core/service-contracts.md)
- Declarative Schema: [config/references/core/declarative-schema.md](../../config/references/core/declarative-schema.md)
