# Magento Module Blueprint: `NullTraceX_Store` (Website/StoreGroup Web API Extension)

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
