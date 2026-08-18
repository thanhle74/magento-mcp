# Web APIs (Get Started) — REST/SOAP/Auth/Security

Nguồn chính:

- [Getting started with Adobe Commerce web APIs](https://developer.adobe.com/commerce/webapi/get-started/)

---

## 1. Tổng quan Get Started

Web API framework của Adobe Commerce/Magento Open Source hỗ trợ:

- `REST`, `SOAP` và `GraphQL`.
- Các cơ chế xác thực theo loại client: token, OAuth, session.
- Phân quyền dựa trên tài nguyên khai báo trong `webapi.xml` + ACL.

Mục tiêu tài liệu này là tóm tắt nhanh phần **Get Started** cho backend integration và security baseline.

---

## 2. Cấu trúc request REST cơ bản

Nguồn:

- [Construct a request](https://developer.adobe.com/commerce/webapi/get-started/gs-web-api-request/)
- [Using cURL to run requests](https://developer.adobe.com/commerce/webapi/get-started/gs-curl/)
- [Status codes and REST responses](https://developer.adobe.com/commerce/webapi/get-started/gs-web-api-response/)

Các thành phần chính:

- `HTTP verb`: `GET`, `POST`, `PUT`, `DELETE`.
- `Endpoint`: `<host>/rest/<store_code>/V1/...`
- `Headers`: `Authorization`, `Content-Type`, `Accept`, và các header ngữ cảnh.
- `Payload`: tham số URI + body JSON/XML.

Header thường dùng:

| Header | Ghi chú |
|--------|--------|
| `Authorization` | `Bearer <token>` khi endpoint không phải anonymous |
| `Content-Type` | Bắt buộc khi có body; thường `application/json` |
| `Accept` | Kiểu response mong muốn (`json`/`xml`) |
| `X-Adobe-Company` | Scope company cho user thuộc nhiều company (B2B) |
| `X-Captcha` / `X-ReCaptcha` | Bắt buộc khi form bật CAPTCHA/reCAPTCHA |

---

## 3. HTTP status và error format

Nguồn:

- [Status codes and REST responses](https://developer.adobe.com/commerce/webapi/get-started/gs-web-api-response/)

HTTP code thường gặp:

- `200`: thành công.
- `400`: request không hợp lệ / validation fail.
- `401`: thiếu/sai auth hoặc không đủ quyền theo token.
- `403`: bị cấm truy cập.
- `404`: endpoint không tồn tại.
- `405`: sai HTTP method cho endpoint.
- `500`: lỗi hệ thống.

Error payload điển hình:

- `message`
- `parameters` (nếu có)

---

## 4. Authentication overview (PaaS)

Nguồn:

- [Authentication introduction](https://developer.adobe.com/commerce/webapi/get-started/authentication/)

Tài nguyên truy cập theo user type:

- **Admin/Integration**: theo ACL đã cấp.
- **Customer**: tài nguyên `anonymous` và `self`.
- **Guest**: chỉ tài nguyên `anonymous`.

Lưu ý triển khai:

- `acl.xml` định nghĩa cây quyền.
- `webapi.xml` gán quyền cụ thể cho từng route (`resource ref="..."`).

---

## 5. Token-based authentication

Nguồn:

- [Token-based authentication](https://developer.adobe.com/commerce/webapi/get-started/authentication/gs-authentication-token/)

Loại token và TTL mặc định:

| Token | TTL mặc định |
|------|--------------|
| Integration | Không hết hạn (đến khi revoke) |
| Admin | 4 giờ |
| Customer | 1 giờ |

Endpoint lấy token phổ biến:

- Customer: `POST /V1/integration/customer/token`
- Admin (2FA providers): `POST /V1/tfa/provider/.../authenticate`

Dùng token:

- Gắn vào `Authorization: Bearer <token>`.

Ghi chú:

- Có cron dọn expired tokens theo giờ.
- Với integration token, dùng flow OAuth đầy đủ là an toàn hơn cấu hình bearer standalone.

---

## 6. OAuth-based authentication (Integrations)

Nguồn:

- [OAuth-based authentication](https://developer.adobe.com/commerce/webapi/get-started/authentication/gs-authentication-oauth/)
- [Create an integration](https://developer.adobe.com/commerce/webapi/get-started/create-integration/)
- [OAuth error codes](https://developer.adobe.com/commerce/webapi/get-started/authentication/oauth-errors/)

Luồng chính:

1. Merchant tạo integration trong Admin.
2. Activate integration (gửi `oauth_consumer_key`, `oauth_consumer_secret`, `oauth_verifier`, `store_base_url` về callback).
3. App gọi `POST /oauth/token/request` lấy request token.
4. App gọi `POST /oauth/token/access` + verifier để lấy access token.
5. Gọi API với `Authorization: OAuth ...` đã ký `HMAC-SHA256`.

OAuth error codes cần theo dõi:

- `nonce_used`, `signature_invalid`, `consumer_key_rejected`, `permission_denied`, `method_not_allowed`,...

---

## 7. Session-based authentication (PaaS)

Nguồn:

- [Session-based authentication](https://developer.adobe.com/commerce/webapi/get-started/authentication/gs-authentication-session/)

Đặc điểm:

- Dùng session/cookie từ storefront (customer) hoặc Admin UI context.
- Phù hợp cho JS widgets/Ajax calls nội bộ.
- Khách chưa đăng nhập vẫn có thể gọi endpoints `anonymous`.

---

## 8. API security: Input limiting + Rate limiting

Nguồn:

- [Input limiting](https://developer.adobe.com/commerce/webapi/get-started/api-security/)
- [Rate limiting](https://developer.adobe.com/commerce/webapi/get-started/rate-limiting/)

### Input limiting

- Giới hạn input list size cho REST đồng bộ/bất đồng bộ.
- Giới hạn page size cho REST/GraphQL pagination.
- Có thể bật qua Admin; PaaS hỗ trợ CLI/env.php/env vars.

Ví dụ CLI:

- `bin/magento config:set webapi/validation/input_limit_enabled 1`
- `bin/magento config:set graphql/validation/input_limit_enabled 1`

### Rate limiting (chống carding)

- Áp dụng cho entry points liên quan `payment-information`/`order` (REST) và `placeOrder` flow qua GraphQL.
- Cần cấu hình backpressure logger (thường Redis) + policy limits.
- Nếu vi phạm:
  - REST thường trả `429 Too Many Requests`
  - GraphQL thường trả `200` với `errors[].extensions.category = graphql-too-many-requests`

Config thường dùng:

- `sales/backpressure/enabled`
- `sales/backpressure/guest_limit`
- `sales/backpressure/limit`
- `sales/backpressure/period`

---

## 9. SOAP services

Nguồn:

- [Using SOAP services](https://developer.adobe.com/commerce/webapi/get-started/soap-web-api-calls/)

Điểm chính:

- WSDL tạo theo service được request.
- Endpoint pattern:
  - `http://<host>/soap/<optional_store_code>?wsdl&services=<service_1>,<service_2>`
- Có thể dùng bearer token trong header khi gọi SOAP protected resources.

---

## 10. Create Integration (module-based)

Nguồn:

- [Create an integration](https://developer.adobe.com/commerce/webapi/get-started/create-integration/)

Khung triển khai:

- Tạo module skeleton (`etc`, `etc/integration`, `Setup`).
- Khai báo `module.xml`, `composer.json`, `registration.php`.
- Dùng `ConfigBasedIntegrationManager` trong setup data để nạp integration config.
- Khai báo quyền trong `etc/integration/api.xml`.
- Optionally pre-config integration trong `etc/integration/config.xml`.

---

## 11. Web API functional testing

Nguồn:

- [Web API functional testing](https://developer.adobe.com/commerce/webapi/get-started/web-api-functional-testing/)

Ý chính:

- Framework test Web API từ góc nhìn client, cho REST/SOAP.
- Test class kế thừa `Magento\TestFramework\TestCase\WebapiAbstract`.
- Có annotation `@magentoApiDataFixture` cho fixtures sống qua HTTP calls trong test.
- Cần cấu hình `dev/tests/api-functional/phpunit_*.xml` và các biến môi trường test.

---

## Liên kết

- REST guide (PaaS vs SaaS): [`rest/overview.md`](./rest/overview.md)
- REST B2B integrations: [`rest/b2b.md`](./rest/b2b.md)
- REST Inventory integrations (MSI): [`rest/inventory.md`](./rest/inventory.md)
- REST tutorials (order processing): [`rest/tutorials.md`](./rest/tutorials.md)
- GraphQL usage/reference: [`graphql/README.md`](./graphql/README.md)
- GraphQL App Server: [`graphql-app-server.md`](./graphql-app-server.md)
- Service Contracts: [`service-contracts.md`](./service-contracts.md)
- Quy tắc chung: [`../constitution.md`](../constitution.md)
