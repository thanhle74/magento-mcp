# GraphQL — Schema (Guide): Uploads (mutations)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Uploads**, dùng để upload file lên Amazon S3 thông qua presigned URL trong Adobe Commerce SaaS.

---

## 1. Uploads (nhóm schema)

- Đây là nhóm schema hỗ trợ upload file theo mô hình 2-step:
  - `initiateUpload` để lấy presigned URL + key
  - upload nhị phân trực tiếp lên S3 bằng HTTP `PUT`
  - `finishUpload` để finalize upload.
- Theo tài liệu Adobe, đây là tính năng **SaaS only**.
- Mục tiêu chính:
  - tách upload binary khỏi GraphQL payload
  - dùng key trả về để gắn vào entity/attribute ở mutation khác.

---

## 2. Uploads — danh sách mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `initiateUpload` | Khởi tạo upload, trả presigned URL và key | §3 |
| `finishUpload` | Xác nhận/finalize upload sau khi PUT lên S3 | §4 |

---

## 3. `initiateUpload`

- Mục đích: bắt đầu phiên upload và trả URL upload tạm thời.
- Input chính:
  - `key`: tên file đầu vào (không chứa slash)
  - `media_resource_type`: loại resource mục tiêu.
- Các `media_resource_type` thường gặp:
  - `CUSTOMER_ATTRIBUTE_ADDRESS_FILE`
  - `CUSTOMER_ATTRIBUTE_ADDRESS_IMAGE`
  - `CUSTOMER_ATTRIBUTE_FILE`
  - `CUSTOMER_ATTRIBUTE_IMAGE`
  - `NEGOTIABLE_QUOTE_ATTACHMENT`.
- Output thường gồm:
  - `upload_url` (presigned URL để PUT file)
  - `key` (identifier duy nhất/hash key)
  - `expires_at`.

---

## 4. `finishUpload`

- Mục đích: hoàn tất quy trình upload sau khi file đã được PUT lên S3.
- Input chính:
  - `key` nhận từ `initiateUpload`
  - `media_resource_type`.
- Commerce sẽ xác minh file tại bucket tạm, rồi finalize/move sang vị trí dùng chính thức.
- Output thường gồm:
  - `success`
  - `key`
  - `message`.

---

## 5. Luồng triển khai chuẩn (headless)

1. Gọi `initiateUpload` lấy `upload_url` + `key`.
2. Client upload file trực tiếp lên `upload_url` bằng HTTP `PUT` binary.
3. Gọi `finishUpload` với `key` để finalize.
4. Dùng `key` trả về để set vào mutation create/update entity (không dùng URL S3 thô).

---

## 6. Ghi chú triển khai nhanh

- Time-bound URL:
  - cần upload trước khi `expires_at` hết hạn.
- Retry:
  - nếu PUT thất bại/hết hạn, gọi lại `initiateUpload` để lấy URL mới.
- Validation:
  - backend/attribute config có thể giới hạn loại file và kích thước (ví dụ custom attribute file/image).
- Data model:
  - lưu giá trị key đã hash trong entity attribute, không lưu path tạm thời.
