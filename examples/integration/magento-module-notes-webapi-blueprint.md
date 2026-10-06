# Magento Module Blueprint: `NullTraceX_Notes` (Custom Web API + Repository + Bulk Position Update)

> ⚠️ **STUB — blueprint rút gọn**: chỉ liệt kê cấu trúc file. Đọc
> [`config/references/network/web-api.md`](../../config/references/network/web-api.md) cho pattern
> Web API đầy đủ và [`custom-rest-api-pagination-blueprint.md`](custom-rest-api-pagination-blueprint.md)
> cho blueprint REST + SearchCriteria hoàn chỉnh **trước khi implement**.

Nguồn chuẩn: `app/code/NullTraceX/Notes`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/db_schema.xml` — bảng `nulltracex_notes` (declarative schema)
- `etc/di.xml`
- `etc/webapi.xml`
- `etc/acl.xml`
- `Api/Data/NoteInterface.php`
- `Api/Data/UpdatePositionItemInterface.php`
- `Api/NoteRepositoryInterface.php`
- `Model/Note.php`
- `Model/Data/UpdatePositionItem.php`
- `Model/ResourceModel/Note.php`
- `Model/ResourceModel/Note/Collection.php`
- `Model/NoteRepository.php`

## Pattern module

- Tạo entity custom bằng declarative schema (`nulltracex_notes`).
- Expose CRUD + bulk APIs qua `webapi.xml`.
- Repository xử lý:
  - search criteria list
  - create/update/delete
  - `updatePosition` dạng batch bằng `insertOnDuplicate`
  - `deleteByIds` dạng bulk transaction

## `etc/webapi.xml` — 4 route tương ứng service contract

Route chỉ hợp lệ khi method tương ứng **tồn tại trên interface**; ACL resource
phải khớp `etc/acl.xml` của module.

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">
    <route url="/V1/nulltracex/notes" method="GET">
        <service class="NullTraceX\Notes\Api\NoteRepositoryInterface" method="getList"/>
        <resources>
            <resource ref="NullTraceX_Notes::notes_manage"/>
        </resources>
    </route>
    <route url="/V1/nulltracex/notes/create" method="POST">
        <service class="NullTraceX\Notes\Api\NoteRepositoryInterface" method="save"/>
        <resources>
            <resource ref="NullTraceX_Notes::notes_manage"/>
        </resources>
    </route>
    <route url="/V1/nulltracex/notes/update-position" method="PUT">
        <service class="NullTraceX\Notes\Api\NoteRepositoryInterface" method="updatePosition"/>
        <resources>
            <resource ref="NullTraceX_Notes::notes_manage"/>
        </resources>
    </route>
    <route url="/V1/nulltracex/notes/batch-delete" method="POST">
        <service class="NullTraceX\Notes\Api\NoteRepositoryInterface" method="deleteByIds"/>
        <resources>
            <resource ref="NullTraceX_Notes::notes_manage"/>
        </resources>
    </route>
</routes>
```

## Khi nào dùng

- Module service-oriented cần REST API custom rõ hợp đồng.
- Use case cần batch update vị trí/hierarchy nhanh.

## Verify nhanh

- `bin/magento setup:upgrade`
- Test route webapi chính:
  - `GET /V1/nulltracex/notes`
  - `POST /V1/nulltracex/notes/create`
  - `PUT /V1/nulltracex/notes/update-position`
  - `POST /V1/nulltracex/notes/batch-delete`
- Kiểm tra ACL token tương ứng truy cập đúng quyền.

## Liên kết

- Web API (route, auth, status codes): [config/references/network/web-api.md](../../config/references/network/web-api.md)
- Service Contracts (Api/ interface + repository): [config/references/core/service-contracts.md](../../config/references/core/service-contracts.md)
- SearchCriteria / getList: [config/references/core/search-criteria-data-layer.md](../../config/references/core/search-criteria-data-layer.md)
- Declarative schema: [config/references/core/declarative-schema.md](../../config/references/core/declarative-schema.md)
- ACL: [config/references/security/acl.md](../../config/references/security/acl.md)
- Blueprint REST hoàn chỉnh: [custom-rest-api-pagination-blueprint.md](custom-rest-api-pagination-blueprint.md)
