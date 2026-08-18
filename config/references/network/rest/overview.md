# REST API (Guide) — PaaS vs SaaS

Nguon chinh:

- [REST API overview](https://developer.adobe.com/commerce/webapi/rest/)
- [REST API reference](https://developer.adobe.com/commerce/webapi/rest/reference/)

---

## 1. REST overview

REST API duoc dung cho:

- Mobile app / shopping app
- Tich hop ERP/CRM/PIM
- Backend integrations va automation

Tai lieu Adobe tach ro 2 nhanh:

- **PaaS** (Adobe Commerce on-prem / Cloud + Magento Open Source)
- **SaaS** (Adobe Commerce as a Cloud Service - ACCS)

---

## 2. Endpoint va URL structure khac nhau

### PaaS

- Mau URL: `https://<host>/rest/<store-view-code>/<endpoint>`
- Co prefix `/rest` va store scope nam trong URL.

### SaaS (ACCS)

- Mau URL: `https://<server>.api.commerce.adobe.com/<tenant-id>/<endpoint>`
- Khong dung `/rest` trong URL.
- Store scope truyen qua header `Store`.

---

## 3. Authentication khac nhau

### PaaS

- Token-based (admin/customer token)
- OAuth 1.0a integration
- Session-based cho mot so context noi bo

### SaaS (ACCS)

- Dung **Adobe IMS OAuth 2** (khong dung token generation kieu cu cua PaaS).
- Hai mode chinh:
  - Server-to-server auth
  - User auth (interactive)

Nguon:

- [REST Authentication in ACCS](https://developer.adobe.com/commerce/webapi/rest/authentication/)
- [Server-to-server auth](https://developer.adobe.com/commerce/webapi/rest/authentication/server-to-server/)
- [User auth](https://developer.adobe.com/commerce/webapi/rest/authentication/user/)

---

## 4. REST reference

Adobe tach rieng reference theo nen tang:

- [PaaS REST reference](https://developer.adobe.com/commerce/webapi/reference/rest/paas/)
- [SaaS REST reference](https://developer.adobe.com/commerce/webapi/reference/rest/saas/)

Khuyen nghi:

- Voi project Magento 2.4.x self-hosted/on-prem/cloud PaaS: uu tien PaaS reference.
- Voi ACCS: chi dung SaaS reference + IMS auth flow.

---

## 5. ACCS server-to-server flow (rut gon)

1. Tao IMS credentials trong Adobe Developer Console.
2. Lay access token tu `ims/token/v3` bang `grant_type=client_credentials`.
3. Goi API kem:
   - `Authorization: Bearer <access_token>`
   - `x-api-key: <client_id>`
   - `x-gw-ims-org-id: <org_id>`
4. Cache token theo `expires_in`, refresh khi sap het han.

Scope quan trong:

- `commerce.accs` (bat buoc cho REST ACCS)

---

## 6. ACCS user auth flow (rut gon)

1. Tao OAuth app credentials (Web App / SPA / Native).
2. Redirect user den IMS authorize endpoint.
3. Nhan authorization code tai redirect URI.
4. Exchange code lay access token/refresh token.
5. Goi API trong context quyen admin user da xac thuc.

---

## 7. Header mau theo nen tang

### PaaS

- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- (tuy endpoint) cac header context khac

### SaaS (ACCS)

- `Authorization: Bearer <ims_token>`
- `Content-Type: application/json`
- `Store: <all|default|store_view_code>`
- `x-api-key: <client_id>`
- `x-gw-ims-org-id: <org_id>`

---

## 8. Lien ket trong `.spec`

- REST B2B: [`./b2b.md`](./b2b.md)
- REST Inventory: [`./inventory.md`](./inventory.md)
- REST Tutorials: [`./tutorials.md`](./tutorials.md)
- Web APIs Get Started: [`../web-api.md`](../web-api.md)

---

## 9. Use REST endpoints (muc luc thao tac)

Nguon:

- [Using REST endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/)

Nhanh nay tap trung vao cac pattern su dung endpoint:

- Generate local API reference
- Search (`/V1/products`, `/V1/search`)
- Filtered response (`fields=...`)
- Protected endpoints (Captcha/reCaptcha)
- Restrict anonymous APIs
- Async endpoints
- Bulk endpoints
- Bulk operation status endpoints
- Search operation status theo `searchCriteria`

---

## 10. Search patterns

Nguon:

- [Search using REST endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches/)
- [Search for products with the /search endpoint](https://developer.adobe.com/commerce/webapi/rest/use-rest/search-endpoint/)

### 10.1 `searchCriteria` chuan

Mau query:

- `searchCriteria[filter_groups][i][filters][j][field]`
- `searchCriteria[filter_groups][i][filters][j][value]`
- `searchCriteria[filter_groups][i][filters][j][condition_type]`

Logic:

- Nhieu `filters` trong **cung** `filter_group` -> OR
- Nhieu `filter_groups` -> AND

### 10.2 `V1/products` vs `V1/search`

- `V1/products`: truy cap truc tiep product data, linh hoat attribute/filter, phu hop backend filtering.
- `V1/search`: gan giong search storefront (relevance + buckets/aggregations), phu hop search term nguoi dung.
- SaaS khong ho tro `GET /V1/search`; dung `V1/products`/GraphQL thay the theo scenario.

---

## 11. Filtered responses (`fields`)

Nguon:

- [Retrieve filtered responses](https://developer.adobe.com/commerce/webapi/rest/use-rest/retrieve-filtered-responses/)

Co the them `fields=` de giam payload response:

- Truong don: `fields=sku,name,price`
- Object day du: `fields=billing_address,customer_firstname`
- Object chon field: `fields=items[name,qty,sku]`
- Nested: `fields=extension_attributes[category_links,stock_item[item_id,qty]]`

Co the ket hop voi `searchCriteria`.

---

## 12. Protected endpoints va anonymous API security (PaaS)

Nguon:

- [Protected endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/protected-endpoints/)
- [Restricting access to anonymous web APIs](https://developer.adobe.com/commerce/webapi/rest/use-rest/anonymous-api-security/)

### 12.1 Protected endpoints

- Khi bat CAPTCHA/reCAPTCHA, endpoint tuong ung can `X-Captcha` hoac `X-ReCaptcha`.
- Token loai integration co the la ngoai le theo rule Adobe o mot so endpoint protected.
- Headless storefront van phai render captcha widget phia UI de lay header hop le.

### 12.2 Anonymous API restriction

- Adobe co co che chan mac dinh mot tap endpoint anonymous co nguy co lo du lieu nhay cam (catalog/cms/store...).
- Co the anh huong tich hop cu neu truoc do goi endpoint anonymous.
- Co the cau hinh trong Admin (`Web API Security`) hoac tuy bien qua extension `di.xml` khi can.

---

## 13. Asynchronous endpoints

Nguon:

- [Asynchronous web endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/asynchronous-web-endpoints/)

Dac diem:

- Ho tro `POST`, `PUT`, `DELETE`, `PATCH` (GET khong ho tro).
- Tra ve `bulk_uuid` + `request_items` (`accepted`) khi request duoc nhan vao queue.

Khac nhau ve route:

- **PaaS**: `/rest/<store_code>/async/V1/...`
- **SaaS**: `/V1/async/...` sau tenant base URL

Store scope:

- PaaS co the qua `<store_code>` trong route (`default`, `all`, code cu the)
- SaaS dung header `Store`

---

## 14. Bulk endpoints

Nguon:

- [Bulk endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/bulk-endpoints/)

Dac diem:

- Gui mang request bodies trong mot call.
- He thong tach message va day queue theo tung item.
- Response chua `bulk_uuid` de theo doi trang thai xu ly.

Khac nhau ve route:

- **PaaS**: `/rest/<store_code>/async/bulk/V1/...`
- **SaaS**: `/V1/async/bulk/...`

Luu y:

- Route co path params (`:sku`, `:entryId`...) can doi sang dang `bySku`, `byEntryId` trong bulk route.
- PaaS thuong can queue infra phu hop; SaaS da managed queue.

---

## 15. Bulk operation status tracking

Nguon:

- [Bulk operation status endpoints](https://developer.adobe.com/commerce/webapi/rest/use-rest/operation-status-endpoints/)
- [Search for the status of a bulk operation](https://developer.adobe.com/commerce/webapi/rest/use-rest/operation-status-search/)

Endpoints chinh:

- `GET /V1/bulk/:bulkUuid/status`
- `GET /V1/bulk/:bulkUuid/operation-status/:status`
- `GET /V1/bulk/:bulkUuid/detailed-status`
- `GET /V1/bulk/?searchCriteria...` (search theo status, topic, start_time, bulk_uuid)

Status codes:

- `1` complete
- `2` failed but retryable
- `3` failed requires change before retry
- `4` open
- `5` rejected

---

## 16. Generate local REST reference (PaaS)

Nguon:

- [Generate a local API Reference](https://developer.adobe.com/commerce/webapi/rest/quick-reference/generate-local/)

Diem chinh:

- Swagger UI local: `http://<commerce_host>/swagger`
- Async docs: `?type=async`
- Theo store: `?store=<store_code>`
- Co the lay schema:
  - `/rest/<store_code>/schema?services=<...>`
  - `/rest/<store_code>/schema?services=all`
- Tu 2.4.4, swagger UI khong chay o production mode (chi developer mode).
- Can can nhac security cua endpoint `/swagger` (disable module hoac rewrite neu can).

---

## 17. REST Modules (PaaS va Adobe Commerce features)

Nguon:

- [Catalog module](https://developer.adobe.com/commerce/webapi/rest/modules/catalog/)
- [Manage prices for multiple products](https://developer.adobe.com/commerce/webapi/rest/modules/catalog/catalog-pricing/)
- [Custom attributes](https://developer.adobe.com/commerce/webapi/rest/modules/custom-attributes/)
- [Import API](https://developer.adobe.com/commerce/webapi/rest/modules/import/)
- [Multicoupon API](https://developer.adobe.com/commerce/webapi/rest/modules/multicoupon/)
- [Refunds](https://developer.adobe.com/commerce/webapi/rest/modules/sales/)

### 17.1 Catalog module

- `Catalog` module phuc vu product/category management.
- Category API (`POST /V1/categories`) ho tro `custom_attributes` cho SEO/display fields (vi du `meta_title`, `meta_description`, `url_key`, `url_path`, `is_anchor`...).
- Thuc te tich hop hay dung: category provisioning + custom metadata dong bo tu PIM/ERP.

### 17.2 Catalog pricing APIs (batch pricing)

Nhieu endpoint de cap nhat gia hang loat trong mot call:

- Special price:
  - `POST /V1/products/special-price`
  - `POST /V1/products/special-price-information`
  - `POST /V1/products/special-price-delete`
- Tier prices:
  - `POST /V1/products/tier-prices`
  - `PUT /V1/products/tier-prices`
  - `POST /V1/products/tier-prices-information`
  - `POST /V1/products/tier-prices-delete`
- Base prices:
  - `POST /V1/products/base-prices`
  - `POST /V1/products/base-prices-information`
- Cost values:
  - `POST /V1/products/cost`
  - `POST /V1/products/cost-information`
  - `POST /V1/products/cost-delete`

Notes:

- Cac APIs nay tap trung vao pricing records, khong can gui full product payload.
- Special price scheduling tren Adobe Commerce co rang buoc date range va scope (global catalog price scope).

### 17.3 Custom attributes module

- Cho phep set `custom_attributes` tren nhieu business entities (cart, order, invoice, creditmemo, company, negotiable quote... tuy context ho tro).
- Tren SaaS, mot so use case customer/guest cart duoc Adobe khuyen nghi dung GraphQL mutation thay cho REST.
- PaaS can cai them module ho tro custom attributes theo huong dan Adobe neu chua co san.

### 17.4 Import module (`import/csv`, `import/json`)

- Muc tieu: import du lieu hang loat (products/customers/advanced pricing/stock sources...).
- Endpoints:
  - `POST /rest/<store_code>/V1/import/csv` (PaaS only)
  - `POST /rest/<store_code>/V1/import/json`
- Validation modes:
  - `validation-stop-on-errors`
  - `validation-skip-errors` + `allowed_error_count`

Notes:

- SaaS khong ho tro `import/csv`; uu tien `import/json`.
- JSON import ho tro nested arrays/objects cho cac product types (configurable, bundle, downloadable...) va metadata phong phu hon.

### 17.5 Multicoupon module (Adobe Commerce only)

- Tu Adobe Commerce 2.4.7, ho tro multiple coupons cho mot cart.
- Nhom endpoint `V2` (song song voi `V1`) de quan ly coupon list:
  - `GET /V2/carts/<cartId>/coupons` hoac `GET /V2/carts/mine/coupons`
  - `POST /V2/carts/:cartId/coupons` (append)
  - `PUT /V2/carts/:cartId/coupons` (replace)
  - `POST /V2/carts/:cartId/deleteByCodes` (delete by coupon codes)

### 17.6 Sales refunds module

- Hoan tien online payment:
  - `POST /V1/invoice/:invoiceId/refund` (`salesRefundInvoiceV1`)
- Hoan tien offline payment:
  - `POST /V1/order/:orderId/refund` (`salesRefundOrderV1`)
- Ngoai ra con creditmemo services (`salesCreditmemoManagement`, `salesCreditmemoRepository`) cho scenarios cu the.

---

## 18. SaaS Integrations (ACCS)

Nguon:

- [Email triggering through REST](https://developer.adobe.com/commerce/webapi/rest/saas-integrations/custom-email/)
- [Gift card account API](https://developer.adobe.com/commerce/webapi/rest/saas-integrations/gift-card-accounts/)
- [Login as Customer](https://developer.adobe.com/commerce/webapi/rest/saas-integrations/login-as-customer/)
- [Upload files to Amazon S3](https://developer.adobe.com/commerce/webapi/rest/saas-integrations/s3-uploads/)

### 18.1 Custom email (SaaS only)

- Endpoint: `POST /V1/custom-email/send`
- Dung de trigger email on-demand tu integration service bang:
  - `templateId`
  - `recipientEmail`
  - `variables` (optional)
- Adobe khuyen nghi goi qua async route de tranh long-lived HTTP:
  - `POST /V1/async/custom-email/send`

### 18.2 Gift card accounts (SaaS only)

- Account-level API (khong phai cart-level), phu hop cho admin/integration provisioning.
- REST CRUD:
  - `POST /V1/giftcardaccounts`
  - `GET /V1/giftcardaccounts`
  - `GET /V1/giftcardaccounts/:id`
  - `GET /V1/giftcardaccounts/code/:code`
  - `PUT /V1/giftcardaccounts/:id`
  - `DELETE /V1/giftcardaccounts/:id`
- Bulk provisioning:
  - `POST /V1/import/json` voi `entity=giftcardaccount`.

### 18.3 Login as Customer (SaaS only)

- Endpoint: `POST /V1/customer/:customerId/otp`
- Trả one-time code (OTC), sau do exchange qua GraphQL de lay customer token.
- ACL can thiet: `Magento_LoginAsCustomer::login`.

### 18.4 S3 uploads (SaaS only)

- Luong upload 2-phase:
  1. `POST /V1/media/initiate-upload` (lay presigned URL + key)
  2. Upload binary truc tiep len S3 bang HTTP PUT
  3. `POST /V1/media/finish-upload` (finalize)
  4. Gan returned key vao entity attribute (vi du category image)
- Ho tro mot so `media_resource_type` nhu `CATEGORY_IMAGE`, `NEGOTIABLE_QUOTE_ATTACHMENT`, customer attribute files/images...

---
