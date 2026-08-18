# GraphQL — Schema (Guide): Store (queries + mutations)

Nguồn chính: Adobe Commerce GraphQL schema cho nhóm **Store**, tập trung vào truy vấn cấu hình storefront/system và mutation `contactUs`.

---

## 1. Store (nhóm schema)

- Nhóm Store chủ yếu phục vụ:
  - đọc cấu hình store view, locale, currency, CMS, reCAPTCHA
  - đọc nội dung CMS blocks/pages và dynamic blocks
  - submit form liên hệ qua `contactUs`.
- Có cả phần query và mutation, nhưng mutation hiện tại chỉ có `contactUs`.
- Một số query/mutation có ghi chú phạm vi triển khai SaaS/PaaS tùy tính năng.

---

## 2. Store — danh sách queries (mục lục)

| Query | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `availableStores` | Lấy danh sách store views để làm store switcher | §3 |
| `cmsBlocks` | Lấy nội dung CMS blocks theo identifiers | §4 |
| `cmsPage` | Lấy nội dung CMS page theo identifier | §5 |
| `countries` | Lấy danh sách quốc gia khả dụng | §6 |
| `country` | Lấy chi tiết một quốc gia | §7 |
| `currency` | Lấy cấu hình tiền tệ và tỷ giá | §8 |
| `dynamicBlocks` | Lấy dynamic blocks theo filter | §9 |
| `recaptchaV3Config` | Lấy cấu hình reCAPTCHA v3 | §10 |
| `recaptchaFormConfig` | Lấy cấu hình reCAPTCHA cho 1 form type | §11 |
| `recaptchaFormConfigs` | Lấy cấu hình reCAPTCHA cho nhiều form types | §12 |
| `storeConfig` | Lấy cấu hình store (base + extended fields) | §13 |

---

## 3. `availableStores`

- Dùng để triển khai store switcher đa store view.
- Input đáng chú ý:
  - `useCurrentGroup`:
    - `true`: trả các store cùng parent store group
    - `false`/không truyền: phạm vi parent website.
- Kết quả chịu ảnh hưởng header `Store` của request.

---

## 4. `cmsBlocks`

- Lấy thông tin CMS blocks từ danh sách `identifiers`.
- Kết quả thường dùng các field: `identifier`, `title`, `content`.
- `content` có thể chứa HTML/CSS và cả phần tử hệ thống/ẩn.

---

## 5. `cmsPage`

- Lấy thông tin CMS page theo `identifier` (ví dụ `no-route`).
- Kết quả gồm các trường SEO và nội dung như:
  - `title`, `content`, `content_heading`, `meta_*`.
- Nếu identifier không hợp lệ sẽ trả lỗi tương ứng từ backend.

---

## 6. `countries`

- Trả toàn bộ quốc gia hệ thống hỗ trợ.
- Dữ liệu gồm:
  - mã quốc gia 2/3 ký tự
  - tên locale/english
  - `available_regions` (null nếu không có vùng/tỉnh).

---

## 7. `country`

- Lấy chi tiết một quốc gia theo `id` (ví dụ `AU`).
- Dùng khi checkout/address form cần dữ liệu quốc gia cụ thể.
- Có thể trả lỗi nếu thiếu `id` hoặc không tìm thấy mapping quốc gia.

---

## 8. `currency`

- Trả cấu hình tiền tệ của store:
  - `base_currency_code`
  - `default_display_currency_code`
  - `available_currency_codes`
  - `exchange_rates`.
- Hữu ích cho UI chuyển currency và hiển thị tỷ giá tham chiếu.

---

## 9. `dynamicBlocks`

- Trả danh sách dynamic blocks theo `DynamicBlocksFilterInput`.
- Thường dùng `type: SPECIFIED` cho kịch bản CMS page/PWA.
- Hỗ trợ pagination (`pageSize`, `currentPage`).
- Có một số field phụ thuộc module mở rộng (`audiences`, module liên quan PWA commerce).

---

## 10. `recaptchaV3Config`

- Trả cấu hình reCAPTCHA v3 tổng quát:
  - `minimum_score`, `website_key`, `badge_position`, `failure_message`, `forms`.
- Dùng để biết form types nào đang bật bảo vệ reCAPTCHA v3.

---

## 11. `recaptchaFormConfig`

- Trả cấu hình reCAPTCHA cho một `formType`.
- Nếu form type tắt reCAPTCHA thì `configurations` sẽ là `null`.
- Dùng khi frontend cần render widget theo từng form đơn lẻ.

---

## 12. `recaptchaFormConfigs`

- Trả cấu hình reCAPTCHA cho nhiều `formTypes` trong một request.
- Giảm round-trip so với gọi nhiều lần `recaptchaFormConfig`.
- Phù hợp khi một page có nhiều form cần kiểm tra/bật reCAPTCHA.

---

## 13. `storeConfig`

- Query trung tâm để lấy thông tin cấu hình store.
- Có thể đọc:
  - base config (store code/name, base URLs, locale, timezone)
  - theme/CMS/catalog/customer settings
  - token lifetime, fixed product tax settings
  - order cancellation settings (nếu có field tương ứng).
- Có thể query non-default store bằng cách set header `Store`.

---

## 14. Store — mutations (mục lục)

| Mutation | Mô tả ngắn | Xem chi tiết |
|---|---|---|
| `contactUs` | Gửi nội dung Contact Us form | §15 |

---

## 15. `contactUs`

- Mục đích: submit Contact Us form từ storefront.
- Input `ContactUsInput` thường gồm:
  - `name`, `email`, `telephone`, `comment`.
- Output: `status` biểu thị gửi thành công/thất bại.

---

## 16. Ghi chú triển khai nhanh (headless)

- Cấu hình theo store view:
  - luôn truyền đúng `Store` header để lấy config và CMS content đúng ngữ cảnh.
- reCAPTCHA:
  - ưu tiên `recaptchaFormConfigs` khi trang có nhiều form.
  - fallback sang `recaptchaFormConfig` cho truy vấn form đơn.
- CMS content:
  - sanitize/kiểm soát render vì `content` có thể chứa HTML tùy biến.
- Store switcher:
  - dùng `availableStores` + `useCurrentGroup` để giới hạn đúng phạm vi hiển thị.
- Contact form:
  - chuẩn hóa validation client trước khi gọi `contactUs` để giảm lỗi đầu vào.
