# GraphQL — Usage (endpoint, token, cache, filter, lỗi, headers, introspection, CAPTCHA, bảo mật query, staging)

Tóm tắt theo tài liệu Adobe; chi tiết và ví dụ đầy đủ: mở từng link **Nguồn**.

---

## 1. Chạy query và mutation (tổng quan)

Nguồn: [GraphQL — Usage](https://developer.adobe.com/commerce/webapi/graphql/usage/)

- GraphQL gom vào **một endpoint**; frontend (PWA, headless, v.v.) dùng schema reference để biết query/mutation.
- Cùng nhánh Usage trên Adobe: các mục còn lại được tóm tắt tại **§2–§10** dưới đây.

---

## 2. Authorization & token

Nguồn: [Authorization tokens](https://developer.adobe.com/commerce/webapi/graphql/usage/authorization-tokens/)

- Request thường cần **Bearer token** (customer hoặc admin tùy operation) — không log/commmit token.
- Phân quyền sai → thường thấy **401** và payload lỗi (xem §5).
- Cấu hình và luồng lấy token: đọc đầy đủ trang Adobe (customer vs admin, integration, v.v.).

---

## 3. Caching

Nguồn: [Caching](https://developer.adobe.com/commerce/webapi/graphql/usage/caching/)

- Magento có cơ chế cache phù hợp GraphQL (full-page / application — theo doc và phiên bản).
- Custom resolver/schema: cần hiểu **cache tag** và invalidation để tránh dữ liệu cũ; chi tiết trên trang Adobe.

---

## 4. Filtering với custom attributes

Nguồn: [Filtering with custom attributes (custom filters)](https://developer.adobe.com/commerce/webapi/graphql/usage/custom-filters/)

- Dùng khi cần lọc **thuộc tính tùy chỉnh** trong query (products, v.v.) theo đúng cú pháp và index của Commerce.
- Đối chiếu schema **Products** / **attributes** trong reference cùng phiên bản.

---

## 5. HTTP status & response / lỗi

Nguồn: [GraphQL status codes and responses](https://developer.adobe.com/commerce/webapi/graphql/usage/api-response/)

Tóm tắt hành vi thường gặp:

| HTTP | Ý nghĩa (tóm tắt) |
|------|-------------------|
| **200** | Thành công (có thể vẫn có mảng `errors` trong body GraphQL). |
| **401** | Unauthorized — token sai/thiếu hoặc không đủ quyền cho đối tượng. |
| **403** | Forbidden — không được phép vì lý do khác 401. |
| **500** | Lỗi hệ thống (DB, network, exception không xử lý, …). |

Payload lỗi GraphQL thường có: `message`, `locations`, `path`, `extensions` (vd. `category`: `graphql-authorization`).

Ví dụ từ doc: query `customer { email }` không có token hợp lệ → lỗi authorization, `data.customer` có thể `null`.

---

## 6. Request headers

Nguồn: [GraphQL headers](https://developer.adobe.com/commerce/webapi/graphql/usage/headers/)

- Hỗ trợ **GET** và **POST**; **mutation** bắt buộc **POST**. Query có thể gửi qua query string URL (cần encode) — một số query GET có thể cache (xem mục Caching trên Adobe).
- Header thường gặp:

| Header | Ghi chú ngắn |
|--------|----------------|
| **Authorization** | `Bearer <token>` — customer/admin; cách lấy token: mục Authorization. |
| **Content-Type** | `application/json` — bắt buộc. |
| **Store** | Mã **store view** (`default` hoặc code đã tạo). |
| **Content-Currency** | Mã tiền tệ (vd. `USD`) — khi khác default của store view. |
| **Preview-Version** | Timestamp (epoch seconds) — preview **staged content**; staging: **Adobe Commerce** (xem §10). |
| **X-Adobe-Company** | Company UID khi user thuộc nhiều company (B2B). |
| **X-Captcha** / **X-ReCaptcha** | Giá trị CAPTCHA / reCAPTCHA khi form bật (xem §8). |
| **X-Magento-Cache-Id** | Cho customer đã đăng nhập — hash phục vụ cache theo ngữ cảnh (xem doc Caching). |

GraphiQL / Altair: nhập cặp header trong UI; **curl**: mỗi `-H` một header (ví dụ doc dùng `Authorization` + `Content-Type`).

---

## 7. Introspection queries

Nguồn: [Introspection queries](https://developer.adobe.com/commerce/webapi/graphql/usage/introspection-queries/)

- Introspection cho phép đọc meta schema (`__schema`, danh sách query/mutation, kiểu field…) — theo chuẩn GraphQL.
- **Tắt introspection** (khuyến nghị production): trong `app/etc/env.php`:

```php
'graphql' => [
    'disable_introspection' => true,
],
```

- Ví dụ: liệt kê query/mutation qua `__schema.queryType` / `mutationType`; chi tiết cú pháp và query mẫu trên Adobe.

---

## 8. Protected mutations

Nguồn: [Protected mutations](https://developer.adobe.com/commerce/webapi/graphql/usage/protected-mutations/)

- Khi storefront bật **CAPTCHA** / **reCAPTCHA** cho form tương ứng, mutation gửi server thường phải kèm **`X-Captcha`** (text người dùng nhập) hoặc **`X-ReCaptcha`** (giá trị từ Google API), trừ khi dùng **integration authorization token** (khi đó không thay thế bằng bỏ header đối với Admin/Bearer thông thường — đọc kỹ bảng form/mutation trên Adobe).
- Cấu hình form: **Stores** → **Configuration** → **Customers** → **CAPTCHA** / **Security** → **Google reCAPTCHA Storefront**.

---

## 9. Security configuration (độ phức tạp & độ sâu query)

Nguồn: [GraphQL security configuration](https://developer.adobe.com/commerce/webapi/graphql/usage/security-configuration/)

- Có thể giới hạn **page size** tối đa (chung Web API — xem **API security** trên Adobe).
- Module **`GraphQl`** (`GraphQl/etc/di.xml`) cho phép override qua module tùy chỉnh:

| Tham số | Mặc định | Ý nghĩa |
|---------|----------|---------|
| `queryComplexity` | 300 | Tối đa điểm phức tạp (field, fragment, …) mỗi query — giảm rủi ro DDoS/query nặng. |
| `queryDepth` | 20 | Độ sâu tối đa cây trả về — chỉnh nếu query hợp lệ của bạn không cần sâu như mặc định. |

Cách tính điểm complexity (field, inline fragment, fragment spread lặp) và ví dụ query — xem trang Adobe.

---

## 10. Staging queries (Adobe Commerce)

Nguồn: [Staging queries](https://developer.adobe.com/commerce/webapi/graphql/usage/staging-queries/)

- **Content Staging** / **campaign**: lên lịch thay đổi storefront; preview GraphQL dùng các query được liệt kê trên Adobe (vd. `categoryList`, `products`).
- Query `products` trong ngữ cảnh staging: **không** dùng full-text **`search`** (staged content không index) — **bỏ** input `search`.
- **Hai header bắt buộc** cho staging preview:

| Header | Mô tả ngắn |
|--------|------------|
| **Authorization** | `Bearer <admin_token>` — token **admin** (doc gợi ý luồng 2FA qua REST, vd. `POST /V1/tfa/provider/google/authenticate`). |
| **Preview-Version** | Timestamp (epoch seconds) nằm **trong** khoảng thời gian campaign đang xem. |

- Thiếu/sai token hoặc thiếu một trong hai header → lỗi authorization. Timestamp không trùng campaign đang lên lịch → kết quả như **storefront hiện tại** (không preview staged).
- **Không** gửi hai header này cho query/mutation **không** phục vụ staging — ứng dụng trả lỗi.
- Tính năng staging đầy đủ là **Adobe Commerce**; xem thêm Merchant User Guide về Content Staging / campaign trên Experience League khi cấu hình.

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Schema reference: [`reference.md`](./reference.md)
