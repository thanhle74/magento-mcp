# REST B2B Integrations (Adobe Commerce)

Nguon chinh:

- [B2B integrations](https://developer.adobe.com/commerce/webapi/rest/b2b/)
- [Integrate with B2B using REST](https://developer.adobe.com/commerce/webapi/rest/b2b/integrations/)
- [Integrate with the Company module](https://developer.adobe.com/commerce/webapi/rest/b2b/company/)
- [Manage company objects](https://developer.adobe.com/commerce/webapi/rest/b2b/company-object/)
- [Manage company users](https://developer.adobe.com/commerce/webapi/rest/b2b/company-users/)
- [Manage company roles](https://developer.adobe.com/commerce/webapi/rest/b2b/roles/)
- [Manage company structures](https://developer.adobe.com/commerce/webapi/rest/b2b/company-structures/)
- [Integrate with the NegotiableQuote module](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-quote/)
- [Manage negotiable quotes](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-manage/)
- [Update a negotiable quote](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-update/)
- [Negotiable quote checkout](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-checkout/)
- [Place a negotiable quote order](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-order-workflow/)
- [Initiate a negotiable quote by seller](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-by-seller-workflow/)
- [Integrate with the SharedCatalog module](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-catalog/)
- [Manage shared catalogs](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-manage/)
- [Assign categories and products to a shared catalog](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-product-assign/)
- [Assign companies to a shared catalog](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-company/)
- [Integrate with the CompanyCredit module](https://developer.adobe.com/commerce/webapi/rest/b2b/company-credit/)
- [Manage company credit](https://developer.adobe.com/commerce/webapi/rest/b2b/credit-manage/)
- [Develop B2B extensions](https://developer.adobe.com/commerce/webapi/rest/b2b/extensions/)
- [Adobe Commerce B2B release notes](https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/release-notes)

---

## 1. Scope va actor trong B2B

REST B2B phuc vu mo hinh company account:

- **Seller**: admin user trong backend.
- **Buyer**: customer thuoc company account.

Company la thuc the trung tam, ket noi cac nhom tinh nang:

- Company profile + company users + roles/permissions + hierarchy
- Company Credit
- Shared Catalog
- Negotiable Quote
- Purchase Order / Requisition List (tuy module)

Luu y:

- Day la tinh nang **Adobe Commerce only** (khong co trong Magento Open Source).
- Nhieu endpoint B2B REST hien la huong PaaS; voi ACCS can uu tien cac API/mutation duoc Adobe huong dan cho SaaS.

---

## 2. Module map (B2B)

Theo tai lieu Adobe, B2B la bo module mo rong dat tren Adobe Commerce. Khong phai module nao cung expose REST endpoint.

Nhom thuong gap co REST:

- `Company`
- `CompanyCredit`
- `NegotiableQuote`
- `PurchaseOrder`
- `SharedCatalog`

Nhom co tinh nang B2B nhung REST co the han che/khong co tuy module:

- `PurchaseOrderRule`
- `RequisitionList`
- mot so module bo tro cho bundle/configurable/gift card trong B2B

---

## 3. Integrate with B2B using REST (tong quan endpoint)

Nguon:

- [Integrate with B2B using REST](https://developer.adobe.com/commerce/webapi/rest/b2b/integrations/)

Trang tong quan nay liet ke endpoint theo module. Trong pham vi request hien tai, nhom Company la quan trong nhat:

- Company management
- Company users
- Company roles
- Company hierarchy/teams

Phan duoi tap trung vao cac endpoint thuc te cua nhom nay.

---

## 4. Company objects (`companyCompanyRepositoryV1`)

Nguon:

- [Manage company objects](https://developer.adobe.com/commerce/webapi/rest/b2b/company-object/)

### 4.1 Endpoints

- `POST /V1/company/`
- `PUT /V1/company/:companyId`
- `GET /V1/company/:companyId`
- `DELETE /V1/company/:companyId`
- `GET /V1/company/` (search/list)

### 4.2 Thuoc tinh quan trong

- `company_name`, `company_email`
- dia chi (`street`, `city`, `country_id`, `region`, `postcode`)
- `super_user_id` (company admin customer)
- `customer_group_id` (gan shared catalog)
- `status` (pending/approved/rejected/blocked)

### 4.3 Notes

- Tao company can `super_user_id` da ton tai.
- Xoa company se deactive member va go company assignment khoi customer profile.
- Search qua `GET /V1/company?searchCriteria...`.

---

## 5. Company users (`customerCustomerRepositoryV1`)

Nguon:

- [Manage company users](https://developer.adobe.com/commerce/webapi/rest/b2b/company-users/)

### 5.1 Endpoints

- `POST /V1/customers/` (tao customer)
- `PUT /V1/customers/:customerId` (gan/cap nhat `company_attributes`)
- `DELETE /V1/customers/:customerId` (xoa user, PaaS only)

### 5.2 Company attributes thuong dung

- `company_id`
- `job_title`
- `status` (`0` inactive, `1` active)
- `telephone`

### 5.3 Notes

- Luong thuong dung: tao customer thuong -> cap nhat `extension_attributes.company_attributes`.
- Neu deactive/xoa user co child users, he thong re-parent theo quy tac B2B.
- Adobe ghi ro ACCS khong ho tro cac REST endpoint phan nay; voi SaaS can dung GraphQL customer mutations.

---

## 6. Company roles (`companyRoleRepositoryV1`)

Nguon:

- [Manage company roles](https://developer.adobe.com/commerce/webapi/rest/b2b/roles/)

### 6.1 Endpoints

- `POST /V1/company/role/`
- `PUT /V1/company/role/:id`
- `GET /V1/company/role/:roleId`
- `DELETE /V1/company/role/:roleId`
- `GET /V1/company/role/` (search/list)

### 6.2 Core model

- Role gom `role_name`, `company_id`, va `permissions[]`.
- Moi permission map toi resource ACL (`resource_id`) va `allow|deny`.
- `Magento_Company::index` can co trong payload role.

### 6.3 Notes

- Update role can gui full set permission mong muon (khong chi delta).
- Khong the xoa role neu do la role duy nhat cua company.
- Nguon resource ACL bao gom Sales, Negotiable Quote, Purchase Orders, Company Profile/User management, Company credit.

---

## 7. Company structures: teams + hierarchy

Nguon:

- [Manage company structures](https://developer.adobe.com/commerce/webapi/rest/b2b/company-structures/)

### 7.1 Teams (`companyTeamRepositoryV1`)

Endpoints:

- `POST /V1/team/:companyId`
- `PUT /V1/team/:teamId`
- `GET /V1/team/:teamId`
- `DELETE /V1/team/:teamId`
- `GET /V1/team/` (search/list)

Notes:

- Team moi duoc tao duoi Company Admin node.
- Khong xoa duoc team neu con member gan vao team.

### 7.2 Hierarchy (`companyHierarchyV1`)

Endpoints:

- `GET /V1/hierarchy/:id`
- `PUT /V1/hierarchy/move/:id`

Notes:

- Dung de lay cay cau truc company (team + users) va di chuyen node.
- Khong dung endpoint nay de xoa team/user; chi move node trong hierarchy.

---

## 8. Header va auth cho B2B REST

Thong thuong B2B REST su dung auth PaaS:

- `Authorization: Bearer <admin_or_integration_token>`
- `Content-Type: application/json`

Khi user thuoc nhieu company, co the can:

- `X-Adobe-Company: <company-id>`

Neu endpoint thuoc nhom protected (co captcha):

- them `X-Captcha` hoac `X-ReCaptcha` theo cau hinh.

---

## 9. Thuc thi goi y (headless integration)

1. Tao/chon company admin customer.
2. Tao company object.
3. Tao company roles (quyen toi thieu theo vai tro).
4. Tao user va gan vao company.
5. Tao team + sap xep hierarchy.
6. Validate bang search/list endpoints (`searchCriteria`) cho company/role/team.

---

## 10. Negotiable Quote (REST B2B)

Nguon:

- [Integrate with the NegotiableQuote module](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-quote/)
- [Manage negotiable quotes](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-manage/)
- [Update a negotiable quote](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-update/)
- [Negotiable quote checkout](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-checkout/)
- [Place a negotiable quote order](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-order-workflow/)
- [Initiate a negotiable quote by seller](https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-by-seller-workflow/)

### 10.1 Lifecycle va status

Negotiable quote co cac trang thai seller/buyer nhu Draft, New, Open, Submitted, Updated, Ordered, Declined, Expired. Internal state map quan trong:

- `created`
- `processing_by_customer`
- `processing_by_admin`
- `submitted_by_customer`
- `submitted_by_admin`
- `ordered` / `declined` / `expired`

### 10.2 Endpoints chinh de quan ly quote

- `POST /V1/negotiableQuote/request`
- `POST /V1/negotiableQuote/draft`
- `PUT /V1/negotiableQuote/:quoteId`
- `POST /V1/negotiableQuote/submitToCustomer`
- `POST /V1/negotiableQuote/decline`
- `POST /V1/negotiableQuote/pricesUpdated`
- `GET /V1/negotiableQuote/:quoteId/comments`
- `GET /V1/negotiableQuote/attachmentContent`
- `PUT /V1/negotiableQuote/:quoteId/shippingMethod`

### 10.3 Fields quan trong khi update quote

Trong `quote.extension_attributes.negotiable_quote`:

- `negotiated_price_type` (`1` percent, `2` fixed discount, `3` proposed total)
- `negotiated_price_value`
- `shipping_price`
- `quote_name`
- `expiration_period` (`YYYY-MM-DD`)

Luu y:

- Trong practical flow, seller luon can set negotiated price truoc submit.
- Buyer chi add/update/remove item trong mot so state va phu thuoc dieu kien quote.

### 10.4 Checkout cho negotiable quote

Endpoints nhom `negotiable-carts`:

- Shipping:
  - `POST /V1/negotiable-carts/:cartId/estimate-shipping-methods`
  - `POST /V1/negotiable-carts/:cartId/estimate-shipping-methods-by-address-id`
  - `POST /V1/negotiable-carts/:cartId/shipping-information`
- Billing:
  - `POST /V1/negotiable-carts/:cartId/billing-address`
  - `GET /V1/negotiable-carts/:cartId/billing-address`
- Coupon:
  - `PUT /V1/negotiable-carts/:cartId/coupons/:couponCode`
  - `DELETE /V1/negotiable-carts/:cartId/coupons`
- Gift card:
  - `POST /V1/negotiable-carts/:cartId/giftCards`
  - `DELETE /V1/negotiable-carts/:cartId/giftCards/:giftCardCode`
- Payment:
  - `POST /V1/negotiable-carts/:cartId/set-payment-information` (khong place order)
  - `POST /V1/negotiable-carts/:cartId/payment-information` (place order)
  - `GET /V1/negotiable-carts/:cartId/payment-information`
- Totals:
  - `GET /V1/negotiable-carts/:cartId/totals`

### 10.5 Hai workflow can biet

- **Buyer initiated**: customer tao quote -> seller counter/discount -> buyer accept va checkout.
- **Seller initiated**: admin tao draft quote cho buyer -> add item + discount + submit -> buyer review/checkout.

Note ve SaaS:

- Nhieu endpoint REST PaaS duoc Adobe danh dau khong ho tro tren ACCS; Adobe huong dan dung GraphQL mutations/query thay the trong cac step tuong ung.

---

## 11. Shared Catalog (REST B2B)

Nguon:

- [Integrate with the SharedCatalog module](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-catalog/)
- [Manage shared catalogs](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-manage/)
- [Assign categories and products to a shared catalog](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-product-assign/)
- [Assign companies to a shared catalog](https://developer.adobe.com/commerce/webapi/rest/b2b/shared-cat-company/)

### 11.1 Concept

- Co 2 loai shared catalog: `public` va `custom`.
- Chi co 1 public catalog, khong the delete.
- Moi company chi gan duoc 1 shared catalog tai mot thoi diem.

### 11.2 Manage shared catalog objects

Service: `sharedCatalogSharedCatalogRepositoryV1`

Endpoints:

- `POST /V1/sharedCatalog`
- `PUT /V1/sharedCatalog/:id`
- `GET /V1/sharedCatalog/:sharedCatalogId`
- `DELETE /V1/sharedCatalog/:sharedCatalogId` (chi custom)
- `GET /V1/sharedCatalog/` (search/list)

Fields hay dung:

- `name` (unique)
- `type` (`0` custom, `1` public)
- `store_id`
- `tax_class_id`
- `customer_group_id` (system generated)

### 11.3 Assign categories va products

Categories (`sharedCatalogCategoryManagementV1`):

- `POST /V1/sharedCatalog/:id/assignCategories`
- `POST /V1/sharedCatalog/:id/unassignCategories`
- `GET /V1/sharedCatalog/:id/categories`

Products (`sharedCatalogProductManagementV1`):

- `POST /V1/sharedCatalog/:id/assignProducts`
- `POST /V1/sharedCatalog/:id/unassignProducts`
- `GET /V1/sharedCatalog/:id/products`

Luu y:

- Assign category khong tu dong assign products; can goi products API rieng.
- Unassign product khoi shared catalog khong xoa khoi category goc.

### 11.4 Assign companies

Service: `sharedCatalogCompanyManagementV1`

- `POST /V1/sharedCatalog/:sharedCatalogId/assignCompanies`
- `POST /V1/sharedCatalog/:sharedCatalogId/unassignCompanies`
- `GET /V1/sharedCatalog/:sharedCatalogId/companies`

Luu y:

- Assign la update additive.
- Company da gan catalog khac se bi move sang catalog moi.
- Unassign tu custom catalog se fallback ve public catalog.

---

## 12. Company Credit (REST B2B)

Nguon:

- [Integrate with the CompanyCredit module](https://developer.adobe.com/commerce/webapi/rest/b2b/company-credit/)
- [Manage company credit](https://developer.adobe.com/commerce/webapi/rest/b2b/credit-manage/)

### 12.1 Core model

Company credit co 3 so chinh:

- `credit_limit`
- `available_limit`
- `balance` (outstanding)

### 12.2 Credit limit management

Endpoints:

- `PUT /V1/companyCredits/:id`
- `GET /V1/companyCredits/:creditId`
- `GET /V1/companyCredits/company/:companyId`
- `GET /V1/companyCredits/` (search)

### 12.3 Balance operations

Endpoints:

- `POST /V1/companyCredits/:creditId/increaseBalance`
- `POST /V1/companyCredits/:creditId/decreaseBalance`

`operationType`:

- `1` Allocated
- `2` Updated
- `3` Purchased
- `4` Reimbursed
- `5` Refunded
- `6` Reverted

### 12.4 Credit history

Endpoints:

- `GET /V1/companyCredits/history`
- `PUT /V1/companyCredits/history/:historyId`

Dung de truy vet transaction va cap nhat metadata (vi du purchase order/comment).

---

## 13. Develop B2B extensions va Release notes

Nguon:

- [Develop B2B extensions](https://developer.adobe.com/commerce/webapi/rest/b2b/extensions/)
- [Adobe Commerce B2B release notes](https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/release-notes)

### 13.1 Develop B2B extensions

Trang `extensions` la diem vao Module Reference Guide, dung de:

- xem architecture/module level cho tung B2B package
- mapping service contracts va extension points truoc khi custom hoa

### 13.2 Release notes (track version compatibility + behavior changes)

Nhom thay doi can theo doi:

- patch/security compatibility theo tung Commerce release line (`2.4.6`, `2.4.7`, `2.4.8`, `2.4.9-beta`)
- fix/behavior quanh Negotiable Quote, Shared Catalog, Purchase Orders, Requisition List
- khac biet ho tro GraphQL App Server va PHP theo tung major B2B line

Practical recommendation:

- Truoc khi nang cap B2B extension, doi chieu release notes voi line Commerce va payment flow quan trong (PayPal/Payflow, checkout, quote conversion, shared catalog APIs).

---

## 14. Lien ket trong `.spec`

- REST Overview: [`./overview.md`](./overview.md)
- REST Inventory: [`./inventory.md`](./inventory.md)
- REST Tutorials: [`./tutorials.md`](./tutorials.md)
- Web API get-started: [`../web-api.md`](../web-api.md)
- GraphQL B2B:
  - [`../graphql/schema-b2b-company.md`](../graphql/schema-b2b-company.md)
  - [`../graphql/schema-b2b-purchase-order.md`](../graphql/schema-b2b-purchase-order.md)
  - [`../graphql/schema-b2b-purchase-order-rule.md`](../graphql/schema-b2b-purchase-order-rule.md)
  - [`../graphql/schema-b2b-requisition-list.md`](../graphql/schema-b2b-requisition-list.md)
