# Magento Module Blueprint: `NullTraceX_Store` (Website/StoreGroup Web API Extension)

> ⚠️ **STUB — blueprint rút gọn**: chỉ liệt kê cấu trúc file. Đọc
> [`config/references/network/web-api.md`](../../config/references/network/web-api.md) cho pattern
> Web API và [`config/references/ops/multi-site-management.md`](../../config/references/ops/multi-site-management.md)
> cho domain website/store-group **trước khi implement**.

Nguồn chuẩn: `app/code/NullTraceX/Store`

## Bộ file chính

- `registration.php`
- `etc/module.xml` (sequence với `Magento_Store`)
- `etc/di.xml`
- `etc/webapi.xml`
- `Api/Data/NullTraceXWebsiteInterface.php`
- `Api/Data/NullTraceXGroupInterface.php`
- `Api/NullTraceXWebsiteRepositoryInterface.php`
- `Api/NullTraceXGroupRepositoryInterface.php`
- `Model/NullTraceXWebsite.php`
- `Model/NullTraceXGroup.php`
- `Model/NullTraceXWebsiteRepository.php`
- `Model/NullTraceXGroupRepository.php`

## Pattern module

- Mở rộng repository contract cho `Website` và `Group`:
  - thêm `save`
  - thêm `deleteById`
- Ánh xạ interface -> implementation bằng `di.xml`.
- Expose endpoint Web API riêng để create/update/delete website & store groups.

## `etc/di.xml` — ánh xạ interface → implementation

Đây là trường hợp `<preference>` **hợp lệ** (constitution cấm preference khi có thể dùng plugin —
nhưng interface tự định nghĩa của module cần 1 implementation mặc định thì preference là cách chuẩn):

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <preference for="NullTraceX\Store\Api\NullTraceXWebsiteRepositoryInterface"
                type="NullTraceX\Store\Model\NullTraceXWebsiteRepository"/>
    <preference for="NullTraceX\Store\Api\NullTraceXGroupRepositoryInterface"
                type="NullTraceX\Store\Model\NullTraceXGroupRepository"/>
</config>
```

## Khi nào dùng

- Cần automation quản lý website/store-group qua API.
- Cần custom validation/business flow trước khi save/delete store entities.

## Verify nhanh

- `bin/magento setup:upgrade`
- `bin/magento cache:flush`
- Test routes:
  - `POST /V1/store/websites`
  - `DELETE /V1/store/websites/:id`
  - `POST /V1/store/storeGroups`
  - `DELETE /V1/store/storeGroups/:id`
- Kiểm tra quyền `Magento_Backend::store`.

> ⚠️ Save/delete website + store group là thao tác rủi ro cao (ảnh hưởng scope toàn hệ thống,
> cache + config cần flush): luôn giới hạn ACL, validate kỹ input và never dùng trên production
> ngoài automation đã review.

## Liên kết

- Web API (route, auth, status codes): [config/references/network/web-api.md](../../config/references/network/web-api.md)
- Multi-site / store scope domain: [config/references/ops/multi-site-management.md](../../config/references/ops/multi-site-management.md)
- Service Contracts: [config/references/core/service-contracts.md](../../config/references/core/service-contracts.md)
- ACL: [config/references/security/acl.md](../../config/references/security/acl.md)
