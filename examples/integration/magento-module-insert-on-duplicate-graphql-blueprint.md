# Magento Module Blueprint: `NullTraceX_InsertOnDuplicate` (GraphQL Trigger + insertOnDuplicate)

Nguồn chuẩn: `app/code/NullTraceX/InsertOnDuplicate`

## Bộ file chính

- `registration.php`
- `etc/module.xml`
- `etc/schema.graphqls`
- `Model/Resolver/TestInsert.php`
- `Service/AddDemoEmployeeData.php`

## Pattern module

- Expose GraphQL query `test_insert`.
- Resolver gọi service layer để thực thi nghiệp vụ.
- Service dùng resource connection + `insertOnDuplicate` để upsert dữ liệu hàng loạt.

## Dependency ngầm

- Service hiện tại phụ thuộc `NullTraceX\Employee\Model\ResourceModel\Employee`.
- Khi clone module này, cần kiểm tra module/resource phụ thuộc đã tồn tại.

## Khi nào dùng

- Seed hoặc sync dữ liệu demo/reference theo batch.
- Trigger thao tác DB custom từ API GraphQL nội bộ.

## Verify nhanh

- Chạy query GraphQL `test_insert`.
- Kiểm tra dữ liệu được insert/update đúng trong bảng đích.
- Đảm bảo transaction rollback khi gặp exception.
