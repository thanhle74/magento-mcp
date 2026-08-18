# Tham khảo: Declarative Schema (db_schema.xml)

Nguồn: https://developer.adobe.com/commerce/php/development/components/declarative-schema/configuration

---

## Tổng quan

Từ Magento 2.3 trở đi, dùng Declarative Schema thay cho InstallSchema/UpgradeSchema.
File `db_schema.xml` khai báo cấu trúc bảng mong muốn, Magento tự so sánh với DB hiện tại và tạo SQL tương ứng.

Thứ tự thực thi: Declarative Schema chạy trước Data Patch và Schema Patch.

---

## Cấu trúc file

File đặt tại: `<Vendor>/<Module>/etc/db_schema.xml`

**Quan trọng (tránh bug phổ biến):** `db_schema.xml` và `db_schema_whitelist.json` **luôn** nằm trong **`etc/`** của module. **Không** tạo chúng trong `Setup/`. Thuộc tính `xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd"` chỉ trỏ tới XSD trong core Magento (đường dẫn URN), **không** có nghĩa file khai báo schema phải đặt dưới thư mục `Setup/` của module.

### Node gốc

```xml
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <!-- các table node ở đây -->
</schema>
```

---

## Table node

Mỗi `<table>` đại diện cho 1 bảng trong DB.

### Thuộc tính của table:

| Thuộc tính | Mô tả                                          |
| ---------- | ---------------------------------------------- |
| `name`     | Tên bảng (bắt buộc)                            |
| `engine`   | Engine: `innodb` (mặc định) hoặc `memory`      |
| `resource` | Shard DB: `default`, `checkout`, `sales`       |
| `comment`  | Mô tả bảng                                     |
| `onCreate` | Callback khi tạo bảng, dùng để migrate dữ liệu |

### Table chứa 3 loại node con:

- `column` — Định nghĩa cột
- `constraint` — Ràng buộc (primary, unique, foreign)
- `index` — Chỉ mục

---

## Column node

### Thuộc tính của column:

| Thuộc tính  | Mô tả                                                                |
| ----------- | -------------------------------------------------------------------- |
| `xsi:type`  | Kiểu dữ liệu (bắt buộc)                                              |
| `name`      | Tên cột (bắt buộc)                                                   |
| `default`   | Giá trị mặc định                                                     |
| `disabled`  | `true` để xoá cột (khi cột thuộc module khác)                        |
| `identity`  | `true` cho auto increment                                            |
| `length`    | Độ dài (cho varchar, varbinary, char)                                |
| `nullable`  | Cho phép NULL hay không                                              |
| `onCreate`  | Callback khi tạo cột (dùng để rename: `migrateDataFrom(tên_cột_cũ)`) |
| `padding`   | Kích thước cho integer                                               |
| `precision` | Độ chính xác (cho decimal, float)                                    |
| `scale`     | Số chữ số thập phân                                                  |
| `unsigned`  | Không dấu (cho số)                                                   |
| `comment`   | Mô tả cột                                                            |

### Các xsi:type hợp lệ:

| Kiểu        | Ghi chú                                |
| ----------- | -------------------------------------- |
| `int`       | Bao gồm cả smallint, bigint, tinyint   |
| `smallint`  | Số nguyên nhỏ                          |
| `boolean`   | True/False                             |
| `decimal`   | Số thập phân chính xác                 |
| `float`     | Số thực                                |
| `real`      | Bao gồm decimal, float, double         |
| `varchar`   | Chuỗi có độ dài cố định (cần `length`) |
| `text`      | Bao gồm text, mediumtext, longtext     |
| `blob`      | Bao gồm blob, mediumblob, longblob     |
| `date`      | Ngày                                   |
| `datetime`  | Ngày giờ                               |
| `timestamp` | Dấu thời gian                          |
| `json`      | JSON                                   |
| `varbinary` | Binary có độ dài thay đổi              |

### Ví dụ column:

```xml
<column xsi:type="int" name="entity_id" unsigned="true" nullable="false"
        identity="true" comment="Entity ID"/>

<column xsi:type="varchar" name="title" nullable="false" length="255"
        comment="Tiêu đề"/>

<column xsi:type="decimal" name="price" precision="12" scale="4"
        nullable="false" default="0.0000" comment="Giá"/>

<column xsi:type="timestamp" name="created_at" nullable="false"
        default="CURRENT_TIMESTAMP" comment="Ngày tạo"/>
```

---

## Constraint node

### 3 loại constraint:

### 1. Primary key

```xml
<constraint xsi:type="primary" referenceId="PRIMARY">
    <column name="entity_id"/>
</constraint>
```

### 2. Unique key

```xml
<constraint xsi:type="unique" referenceId="<VENDOR>_EMPLOYEE_EMAIL">
    <column name="email"/>
</constraint>
```

Unique key trên nhiều cột:

```xml
<constraint xsi:type="unique" referenceId="<VENDOR>_ENTITY_ATTR_STORE">
    <column name="entity_id"/>
    <column name="attribute_id"/>
    <column name="store_id"/>
</constraint>
```

### 3. Foreign key

```xml
<constraint xsi:type="foreign"
            referenceId="<VENDOR>_ORDER_CUSTOMER_ID_CUSTOMER_ENTITY_ID"
            table="<vendor>_order"
            column="customer_id"
            referenceTable="customer_entity"
            referenceColumn="entity_id"
            onDelete="CASCADE"/>
```

Giá trị `onDelete`:

- `CASCADE` — Xoá bản ghi liên quan khi bản ghi gốc bị xoá
- `SET NULL` — Set NULL khi bản ghi gốc bị xoá
- `NO ACTION` — Không làm gì (báo lỗi nếu có bản ghi liên quan)

Lưu ý: Magento không hỗ trợ `ON UPDATE` cho foreign key.

---

## Index node

### Thuộc tính:

| Thuộc tính    | Mô tả                                       |
| ------------- | ------------------------------------------- |
| `referenceId` | Tên index (duy nhất trong file)             |
| `indexType`   | `btree` (mặc định), `fulltext`, hoặc `hash` |

### Ví dụ:

```xml
<index referenceId="<VENDOR>_EMPLOYEE_DEPARTMENT_ID" indexType="btree">
    <column name="department_id"/>
</index>

<index referenceId="<VENDOR>_EMPLOYEE_FULLTEXT" indexType="fulltext">
    <column name="name"/>
    <column name="email"/>
</index>
```

---

## Các thao tác thường gặp

### Tạo bảng mới

```xml
<table name="<vendor>_employee_record" resource="default" engine="innodb"
       comment="Bảng nhân viên">
    <column xsi:type="int" name="entity_id" unsigned="true" nullable="false"
            identity="true" comment="ID"/>
    <column xsi:type="varchar" name="name" nullable="false" length="255"
            comment="Tên nhân viên"/>
    <column xsi:type="varchar" name="email" nullable="false" length="255"
            comment="Email"/>
    <column xsi:type="timestamp" name="created_at" nullable="false"
            default="CURRENT_TIMESTAMP" comment="Ngày tạo"/>
    <constraint xsi:type="primary" referenceId="PRIMARY">
        <column name="entity_id"/>
    </constraint>
    <constraint xsi:type="unique" referenceId="<VENDOR>_EMPLOYEE_EMAIL">
        <column name="email"/>
    </constraint>
</table>
```

### Thêm cột mới

Thêm node `<column>` vào bảng có sẵn:

```xml
<column xsi:type="varchar" name="phone" nullable="true" length="20"
        comment="Số điện thoại"/>
```

### Xoá cột

Xoá node `<column>` khỏi file. Nếu cột thuộc module khác, dùng `disabled`:

```xml
<column name="phone" disabled="true"/>
```

### Đổi kiểu cột

Sửa `xsi:type` và các thuộc tính liên quan:

```xml
<!-- Trước -->
<column xsi:type="varchar" name="title" nullable="false" length="255"/>

<!-- Sau -->
<column xsi:type="text" name="title" nullable="false"/>
```

### Đổi tên cột

Xoá cột cũ, tạo cột mới với `onCreate`:

```xml
<!-- Xoá cột cũ, thêm cột mới và migrate dữ liệu -->
<column xsi:type="int" name="new_column_name" onCreate="migrateDataFrom(old_column_name)"/>
```

### Đổi tên bảng

Tạo bảng mới với `onCreate` và xoá bảng cũ:

```xml
<table name="new_table_name" onCreate="migrateDataFromAnotherTable(old_table_name)">
    <!-- giữ nguyên các column -->
</table>
```

Lưu ý: Không hỗ trợ đổi tên bảng bằng `RENAME TABLE`. Nếu dữ liệu lớn, dùng `--safe-mode=1` tạo CSV dump rồi import lại bằng Data Patch.

---

## Whitelist

Sau mỗi lần thay đổi `db_schema.xml`, phải chạy:

```bash
bin/magento setup:db-declaration:generate-whitelist --module-name=<Vendor>_<Module>
```

File `db_schema_whitelist.json` sẽ được tạo/cập nhật. Commit cả 2 file.

---

## Lưu ý khi disable module

Khi disable module trong `app/etc/config.php`, chạy `setup:upgrade` sẽ **xoá bảng** của module đó.

Để an toàn:

```bash
# Tạo backup trước khi disable
bin/magento setup:upgrade --safe-mode=1

# Khôi phục nếu enable lại module
bin/magento setup:upgrade --data-restore=1
```

---

## Liên kết

- Quy tắc chung: xem [constitution.md](../constitution.md)
- Các pattern: xem [magento-patterns.md](../magento-patterns.md)
- Checklist: xem [checklist.md](../checklist.md)
