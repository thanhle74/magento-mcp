# Magento Module Blueprint: `NullTraceX_Notes` (Custom Web API + Repository + Bulk Position Update)

Nguồn chuẩn: `app/code/NullTraceX/Notes`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/db_schema.xml`
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
