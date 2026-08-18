# Magento Module Blueprint: `NullTraceX_Address` (Customer Address EAV + Extension Attributes + GraphQL)

Mục tiêu: lưu reference module kiểu "mở rộng customer address" để AI tái sử dụng khi bạn yêu cầu build module tương tự.

Nguồn chuẩn: `app/code/NullTraceX/Address`

---

## 1) Cấu trúc module hiện tại

### 1.1 Bootstrap

- `registration.php`
- `etc/module.xml`
- `composer.json`

### 1.2 EAV data patches (customer_address)

- `Setup/Patch/Data/AddBuildingNumberToCustomerAddress.php`
- `Setup/Patch/Data/TagCustomerAddress.php`

### 1.3 Extension attributes

- `etc/extension_attributes.xml`
- Plugin inject extension data:
  - `Plugin/AddressRepositoryPlugin.php`
  - `Plugin/CustomerRepositoryPlugin.php`
- DI plugin wiring:
  - `etc/di.xml`

### 1.4 GraphQL extension

- `etc/schema.graphqls`
- Resolver:
  - `Model/Resolver/BuildingNumber.php`

---

## 2) Pattern chính của module này

1. Thêm attribute mới vào `customer_address` bằng Data Patch (EAV).
2. Gắn attribute vào forms cần dùng (`used_in_forms`).
3. Bơm dữ liệu vào extension attributes thông qua repository plugins.
4. Expose thêm field cho GraphQL schema với resolver riêng.

Đây là pattern phù hợp cho use case:

- mở rộng địa chỉ khách hàng
- thêm metadata phục vụ integration/headless
- expose field custom trên GraphQL customer address

---

## 3) Bộ file tối thiểu để clone pattern này

Khi tạo module mới theo style `NullTraceX_Address`, tối thiểu cần:

- `registration.php`
- `etc/module.xml`
- `etc/di.xml`
- `etc/extension_attributes.xml`
- `etc/schema.graphqls`
- `Model/Resolver/<CustomFieldResolver>.php`
- `Plugin/AddressRepositoryPlugin.php` (hoặc plugin tương đương đúng repository)
- `Setup/Patch/Data/<AddAttributePatch>.php`

Nếu cần enrich dữ liệu qua customer object:

- `Plugin/CustomerRepositoryPlugin.php`

---

## 4) Build order khuyến nghị

1. Tạo bootstrap module.
2. Tạo data patch cho attribute EAV.
3. Chạy `setup:upgrade` để apply patch.
4. Tạo `extension_attributes.xml`.
5. Tạo plugin và wiring trong `di.xml`.
6. Tạo `schema.graphqls` + resolver.
7. Verify data qua REST/Repository và GraphQL query.

---

## 5) Verify checklist

- `bin/magento setup:upgrade`
- `bin/magento setup:di:compile`
- `bin/magento cache:flush`
- Kiểm tra attribute đã có trong `customer_address` forms.
- Kiểm tra extension attribute trả ra khi gọi repository API.
- Kiểm tra GraphQL field custom trả đúng dữ liệu.

---

## 6) Prompt mẫu tái sử dụng

```text
Dùng blueprint `.spec/examples/integration/magento-module-address-extension-graphql-blueprint.md`.
Tạo module `<Vendor_Module>` để mở rộng `customer_address`:
- thêm EAV attribute,
- expose qua extension attributes,
- expose thêm field GraphQL resolver.

Chỉ sửa trong phạm vi: `app/code/<Vendor>/<Module>`.
Output bắt buộc:
1) Danh sách file theo phase,
2) Code cho từng file,
3) Verify steps đã chạy.
```

---

## 7) Lưu ý quan trọng

- `module.xml` nên khai báo dependency với `Magento_Customer`.
- Tên attribute code phải nhất quán giữa:
  - Data Patch
  - Resolver logic
  - GraphQL field mapping
  - Extension attribute accessors
- Khi plugin set extension attributes, luôn xử lý trường hợp `getExtensionAttributes()` trả `null`.
