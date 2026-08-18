# Tham khảo: Import/Export Custom Entity

Nguồn: https://developer.adobe.com/commerce/php/tutorials/backend/create-custom-import-entity/

---

## 1. Tổng quan

Magento cung cấp framework `Magento_ImportExport` để import/export dữ liệu qua CSV.
Các entity mặc định: Advanced Pricing, Products, Customers and Addresses, Customers Main File, Customer Addresses.

Để thêm entity custom: extend `AbstractEntity` và khai báo trong `etc/import.xml`.

---

## 2. Khai báo entity mới

**`etc/import.xml`**
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_ImportExport:etc/import.xsd">
    <entity name="my_entity"
            label="My Entity Import"
            model="Vendor\Module\Model\Import\MyEntity"
            behaviorModel="Magento\ImportExport\Model\Source\Import\Behavior\Basic" />
</config>
```

**`etc/module.xml`** — thêm sequence:
```xml
<sequence>
    <module name="Magento_ImportExport" />
</sequence>
```

---

## 3. Import Model

Extend `Magento\ImportExport\Model\Import\Entity\AbstractEntity`, implement 3 abstract methods:

| Method | Mục đích |
|---|---|
| `getEntityTypeCode()` | Trả về entity code (khớp với `name` trong import.xml) |
| `validateRow(array $rowData, $rowNum)` | Validate từng dòng CSV |
| `_importData()` | Xử lý import theo behavior (append/replace/delete) |

**Các property quan trọng:**
```php
protected $needColumnCheck = true;   // check column names
protected $logInHistory = true;      // log vào import history
protected $_permanentAttributes = ['entity_id'];  // cột bắt buộc
protected $validColumnNames = ['entity_id', 'name', ...];  // cột hợp lệ
```

---

## 4. Behavior (Import Mode)

| Behavior | Hằng số | Mô tả |
|---|---|---|
| Add/Update | `Import::BEHAVIOR_APPEND` | Thêm mới hoặc update nếu đã tồn tại |
| Replace | `Import::BEHAVIOR_REPLACE` | Xóa rồi insert lại |
| Delete | `Import::BEHAVIOR_DELETE` | Xóa theo entity_id |

```php
protected function _importData(): bool
{
    switch ($this->getBehavior()) {
        case Import::BEHAVIOR_DELETE:
            $this->deleteEntity();
            break;
        case Import::BEHAVIOR_REPLACE:
        case Import::BEHAVIOR_APPEND:
            $this->saveAndReplaceEntity();
            break;
    }
    return true;
}
```

---

## 5. Đọc dữ liệu theo batch

```php
while ($bunch = $this->_dataSourceModel->getNextBunch()) {
    foreach ($bunch as $rowNum => $rowData) {
        if (!$this->validateRow($rowData, $rowNum)) {
            continue;
        }
        // xử lý $rowData
    }
}
```

---

## 6. Validation với error messages

```php
private function initMessageTemplates(): void
{
    $this->addMessageTemplate('NameIsRequired', __('The name cannot be empty.'));
    $this->addMessageTemplate('DurationIsRequired', __('Duration must be greater than 0.'));
}

public function validateRow(array $rowData, $rowNum): bool
{
    if (empty($rowData['name'])) {
        $this->addRowError('NameIsRequired', $rowNum);
    }
    if (isset($this->_validatedRows[$rowNum])) {
        return !$this->getErrorAggregator()->isRowInvalid($rowNum);
    }
    $this->_validatedRows[$rowNum] = true;
    return !$this->getErrorAggregator()->isRowInvalid($rowNum);
}
```

---

## 7. Sample CSV file

Tạo file mẫu để user download:

**`Files/Sample/my_entity.csv`**
```
entity_id,name,field2
,"First Record",value1
,"Second Record",value2
```

Đăng ký trong `etc/di.xml`:
```xml
<type name="Magento\ImportExport\Model\Import\SampleFileProvider">
    <arguments>
        <argument name="samples" xsi:type="array">
            <item name="my_entity" xsi:type="string">Vendor_Module</item>
        </argument>
    </arguments>
</type>
```

---

## 8. Lưu dữ liệu vào DB

```php
$this->connection->insertOnDuplicate(
    $this->connection->getTableName('my_table'),
    $rows,
    $this->getAvailableColumns()
);
```

---

## Liên kết
- Data Patch: xem [data-schema-patch.md](../core/data-schema-patch.md)
- Declarative Schema: xem [declarative-schema.md](../core/declarative-schema.md)
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
