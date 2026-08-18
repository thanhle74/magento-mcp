# Tham khảo: Extension Attributes

Nguồn: https://developer.adobe.com/commerce/php/development/components/add-attributes/

---

## 0. Tổng quan

Extension Attributes là cơ chế mở rộng API Data Interface của Magento mà không sửa core. Chúng xuất hiện trong `extension_attributes` node của REST/GraphQL response và được auto-generate bởi Magento.

**Khi nào dùng:**
- Thêm field vào entity có sẵn (Product, Order, Customer, Quote...) qua API
- Lưu dữ liệu liên quan vào bảng riêng, join khi load entity
- Expose dữ liệu custom qua REST/GraphQL mà không sửa core interface

**Khi nào KHÔNG dùng:**
- Dữ liệu chỉ dùng nội bộ, không cần expose qua API → dùng `additional_data` hoặc custom table
- Thay thế EAV attribute → dùng `custom_attributes` thay vì extension attributes

---

## 1. Khai báo Extension Attribute (`etc/extension_attributes.xml`)

### Scalar attribute (int, string, bool, float)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_custom_field" type="string" />
        <attribute code="vendor_priority" type="int" />
    </extension_attributes>
</config>
```

### Non-scalar attribute (Data Object)

```xml
<extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
    <attribute code="vendor_extra_data" type="Vendor\Module\Api\Data\ExtraDataInterface" />
</extension_attributes>
```

### Array attribute

```xml
<extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
    <attribute code="vendor_tags" type="string[]" />
</extension_attributes>
```

---

## 2. Plugin trên Repository để load/save Extension Attribute

Extension attributes không tự động load — phải dùng `after` plugin trên Repository.

### Plugin class

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Catalog\Api;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\Data\ProductSearchResultsInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Vendor\Module\Api\ExtraDataRepositoryInterface;

class ProductRepositoryPlugin
{
    public function __construct(
        private readonly ExtraDataRepositoryInterface $extraDataRepository
    ) {}

    public function afterGet(
        ProductRepositoryInterface $subject,
        ProductInterface $product
    ): ProductInterface {
        return $this->loadExtensionAttributes($product);
    }

    public function afterGetList(
        ProductRepositoryInterface $subject,
        ProductSearchResultsInterface $searchResults
    ): ProductSearchResultsInterface {
        $products = [];
        foreach ($searchResults->getItems() as $product) {
            $products[] = $this->loadExtensionAttributes($product);
        }
        $searchResults->setItems($products);
        return $searchResults;
    }

    public function afterSave(
        ProductRepositoryInterface $subject,
        ProductInterface $result,
        ProductInterface $entity
    ): ProductInterface {
        $extensionAttributes = $entity->getExtensionAttributes();
        if ($extensionAttributes === null) {
            return $result;
        }

        $extraData = $extensionAttributes->getVendorExtraData();
        if ($extraData !== null) {
            $this->extraDataRepository->save($extraData);
        }

        return $result;
    }

    private function loadExtensionAttributes(ProductInterface $product): ProductInterface
    {
        $extensionAttributes = $product->getExtensionAttributes();
        if ($extensionAttributes === null) {
            // Tránh null — tạo mới nếu chưa có
            $extensionAttributes = $product->getExtensionAttributesFactory()->create(
                ProductInterface::class
            );
        }

        $extraData = $this->extraDataRepository->getByProductId((int) $product->getId());
        $extensionAttributes->setVendorExtraData($extraData);
        $product->setExtensionAttributes($extensionAttributes);

        return $product;
    }
}
```

### Khai báo plugin trong `etc/di.xml`

```xml
<type name="Magento\Catalog\Api\ProductRepositoryInterface">
    <plugin name="vendor_module_product_extension_attributes"
            type="Vendor\Module\Plugin\Catalog\Api\ProductRepositoryPlugin" />
</type>
```

---

## 3. Plugin afterGetExtensionAttributes (tránh null)

Nếu entity chưa có implementation extension attributes, cần plugin để tránh null:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\Catalog\Api\Data;

use Magento\Catalog\Api\Data\ProductExtensionFactory;
use Magento\Catalog\Api\Data\ProductExtensionInterface;
use Magento\Catalog\Api\Data\ProductInterface;

class ProductExtensionAttributesPlugin
{
    public function __construct(
        private readonly ProductExtensionFactory $extensionFactory
    ) {}

    public function afterGetExtensionAttributes(
        ProductInterface $entity,
        ?ProductExtensionInterface $extension
    ): ProductExtensionInterface {
        if ($extension === null) {
            $extension = $this->extensionFactory->create();
        }
        return $extension;
    }
}
```

```xml
<!-- etc/di.xml -->
<type name="Magento\Catalog\Api\Data\ProductInterface">
    <plugin name="vendor_module_product_extension_attributes_init"
            type="Vendor\Module\Plugin\Catalog\Api\Data\ProductExtensionAttributesPlugin" />
</type>
```

---

## 4. Join Directive — load từ DB tự động

Dùng `<join>` để Magento tự JOIN bảng khi load entity qua `getList()`. Phù hợp cho scalar attribute từ bảng riêng.

```xml
<extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
    <attribute code="vendor_extra_field" type="string">
        <join reference_table="vendor_product_extra"
              reference_field="product_id"
              join_on_field="entity_id">
            <field>extra_field</field>
        </join>
    </attribute>
</extension_attributes>
```

**Lưu ý join directive:**
- Chỉ hoạt động với `getList()` (Collection-based), không hoạt động với `get()` (single load)
- Chỉ dùng cho scalar type
- Cần `JoinProcessorInterface` được inject vào Collection

---

## 5. Expose qua REST API

Extension attributes tự động xuất hiện trong REST response sau khi khai báo trong `extension_attributes.xml`. Không cần thêm cấu hình `webapi.xml`.

Response mẫu:
```json
{
  "id": 1,
  "sku": "my-product",
  "extension_attributes": {
    "vendor_custom_field": "custom value",
    "vendor_priority": 5
  }
}
```

---

## 6. Lưu ý quan trọng

- Extension attributes được **auto-generated** sau `setup:di:compile` — không tạo file thủ công
- Generated file: `generated/code/<Vendor>/<Module>/Api/Data/<Entity>ExtensionInterface.php`
- Sau khi thêm `extension_attributes.xml`, phải chạy `bin/magento setup:di:compile`
- Không dùng `getExtensionAttributes()` trực tiếp mà không kiểm tra null
- Với non-scalar type, phải có Data Interface đầy đủ trong `Api/Data/`

---

## Liên kết

- Service Contracts: xem [service-contracts.md](./service-contracts.md)
- DI & Code Generation: xem [di-codegen.md](./di-codegen.md)
- REST API: xem [../network/rest/overview.md](../network/rest/overview.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
