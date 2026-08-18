# Module Skeleton Pack (Portable)

Mục tiêu: giúp AI tạo module Magento nhanh và đúng kiến trúc khi chỉ có thư mục `.spec`.

Pack này dùng placeholder:

- `<Vendor>`
- `<Module>`
- `<Entity>` (ví dụ: `Employee`)
- `<entity>` (ví dụ: `employee`)
- `<table_name>` (ví dụ: `nulltracex_employee`)
- `<entity_id>` (ví dụ: `employee_id`)

---

## Cách dùng nhanh

1. Dùng `file-map.md` để tạo đúng cây file.
2. Dùng `templates.md` để điền code skeleton cho các file cốt lõi.
3. Thay placeholder theo module mục tiêu.
4. Chạy verify:
   - `bin/magento setup:upgrade`
   - `bin/magento setup:di:compile`
   - `bin/magento cache:flush`

---

## Prompt mẫu

```text
Đọc `.spec/examples/integration/module-skeleton/file-map.md`
và `.spec/examples/integration/module-skeleton/templates.md`.

Tạo module `app/code/<Vendor>/<Module>` với entity `<Entity>`.
Chỉ sửa trong phạm vi `app/code/<Vendor>/<Module>`.
Output bắt buộc:
1) Danh sách file tạo,
2) Nội dung code theo skeleton,
3) Verify steps đã chạy.
```
