# GraphQL — Schema (Guide): Attributes

Tóm tắt nhánh **Schema** trên Adobe (mục lục trái: queries/mutations/interfaces theo domain). Chi tiết field, đối số, ví dụ đầy đủ: mở từng link **Nguồn**.  
**Tra đúng chữ ký theo bản cài đặt:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) (vd. 2.4.8) — xem [`reference.md`](./reference.md).

---

## 1. GraphQL schema (trang mục lục)

Nguồn: [GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/)

Adobe đã **sắp xếp lại** tài liệu reference GraphQL để dễ tìm query, mutation, interface và kiểu dữ liệu liên quan. Dùng **điều hướng trái** trên trang Schema để xem usage và ví dụ cho từng phần trong schema Commerce.

---

## 2. Attributes (nhóm schema)

Nguồn: [Attributes](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/)

- **Queries:** lấy giá trị / metadata cho **custom attributes** và **EAV** (thuộc tính hệ thống). Custom attribute là thuộc tính merchant thêm (vd. mô tả sản phẩm dạng shape, volume). EAV do hệ thống định nghĩa.
- **Mutations** (cùng nhóm trên Adobe): gán **custom attributes** lên entity như cart, order, invoice, … — **độc lập** với EAV cấu hình trong Admin; **không áp dụng** cho product, category, customer theo nghĩa EAV truyền thống (xem doc Adobe). Tóm tắt: [Custom attribute mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/) — trong spec: **§9–§17**.
- **Interfaces:** [Attribute interfaces and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/interfaces/) — trong spec: **§18**.
- Chi tiết từng query: [Attributes queries](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/).

---

## 3. Attributes — danh sách queries

Nguồn: [Attributes queries](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/)

Các query sau phục vụ custom và EAV metadata:

| Query | Ghi chú ngắn |
|-------|----------------|
| `attributesForm` | EAV gắn form frontend customer / địa chỉ |
| `attributesList` | Danh sách metadata theo `entity_type` |
| `attributesMetadata` | **Deprecated** — chỉ khi cài PWA Metapackage; dùng `customAttributeMetadataV2` |
| `customAttributeMetadata` | **Deprecated** — dùng `customAttributeMetadataV2` |
| `customAttributeMetadataV2` | Bản thay thế; nên ưu tiên cho code mới |

---

## 4. `attributesForm`

Nguồn: [attributesForm](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-form/)

- Trả về các **EAV attributes** gắn với **form frontend** (customer, customer address).
- Cú pháp (theo doc): `attributesForm(formCode: String!): AttributesFormOutput!`
- Ví dụ `formCode`: `customer_register_address` (xem thêm ví dụ đầy đủ trên Adobe).

---

## 5. `attributesList`

Nguồn: [attributesList](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-list/)

- Trả về **danh sách metadata** thuộc tính cho một `entity_type`.
- Cú pháp: `attributesList(entityType: AttributeEntityTypeEnum!): AttributesMetadataOutput`
- Giá trị `entity_type` do module EAV cung cấp; Adobe nêu ví dụ: `CUSTOMER`, `CUSTOMER_ADDRESS`, `CATALOG_PRODUCT`, `RMA_ITEM`.
- Reference trên Adobe có nhánh **SaaS** / **PaaS** — chọn đúng môi trường.

---

## 6. `attributesMetadata` (deprecated)

Nguồn: [attributesMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-metadata/)

- Chỉ có khi cài **PWA Metapackage for Magento Open Source Extensions** — **đã deprecated**; dùng **`customAttributeMetadataV2`**.
- Trả về nội dung tương tự `customAttributeMetadata` nhưng thêm `data_type`, `sort_order`, `ui_input`, … phục vụ filter/search/layered navigation; format khác `customAttributeMetadata`.
- Tham số (theo doc): `entityType`, `attributeUids`, `showSystemAttributes`.

---

## 7. `customAttributeMetadata` (deprecated)

Nguồn: [customAttributeMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/custom-attribute-metadata/)

- **Deprecated** — chuyển sang **`customAttributeMetadataV2`**.
- Trả về **kiểu thuộc tính** theo `attribute_code` + `entity_type`; hỗ trợ custom, extension, EAV (thứ tự ưu tiên khi trùng: custom → extension → EAV). Output **`StorefrontProperties`** mô tả thuộc tính product; cấu hình Admin: **Stores → Attributes → Product → … → Storefront Properties**.
- Cú pháp: `customAttributeMetadata(attributes: [AttributeInput!]!): CustomAttributeMetadata`
- Reference **PaaS** trên doc.

---

## 8. `customAttributeMetadataV2` (nên dùng)

Nguồn: [customAttributeMetadataV2](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/custom-attribute-metadata-v2/)

- Metadata cho từng cặp **`entity_type` + `attribute_code`**; **thay** `attributesMetadata` và `customAttributeMetadata`.
- So với các query cũ: **mọi entity type** có thể mở rộng query; truy cập **đầy đủ thuộc tính EAV**.
- Cú pháp: `customAttributeMetadataV2(attributes: [AttributeInput!]): AttributesMetadataOutput!`
- Reference **SaaS** / **PaaS** trên Adobe.

---

## 9. Custom attribute mutations (tổng quan)

Nguồn: [Custom attribute mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/)

- Trên **Adobe Commerce as a Cloud Service (SaaS)** chức năng có **sẵn**; **PaaS / on-prem** cần **cài thêm module** (xem dưới).
- **Custom attributes** mở rộng mô hình dữ liệu core **không** bắt buộc đổi code hay schema DB cố định (vd. `duns_number`, `industry_type` cho company). Khác **EAV trong Admin**; **không** dùng cho product / category / customer theo nghĩa EAV truyền thống (theo Adobe).
- Các mutation dưới đây gán cặp **`attribute_code` / `value`** (mảng `custom_attributes`). **Mọi ID là string.** Để **xoá** một custom attribute: **gọi lại mutation không** gửi attribute đó (Adobe mô tả cho từng mutation).
- Khi **quote → order**, custom attributes trên cart (và item) được **copy** sang order (vd. `setCustomAttributesOnCart` — xem trang mutation).

**Mutation (theo mục lục Adobe):**

| Mutation | Ghi chú |
|----------|---------|
| `setCustomAttributesOnCart` | Giỏ hàng |
| `setCustomAttributesOnCartItem` | Dòng giỏ |
| `setCustomAttributesOnCompany` | **SaaS only** trên bảng Adobe (B2B Company) |
| `setCustomAttributesOnCreditMemo` | Credit memo |
| `setCustomAttributesOnCreditMemoItem` | Dòng credit memo |
| `setCustomAttributesOnInvoice` | Invoice |
| `setCustomAttributesOnInvoiceItem` | Dòng invoice |
| `setCustomAttributesOnNegotiableQuote` | **SaaS only** — negotiable quote (B2B) |

**Entity hỗ trợ custom attributes** (danh sách trên Adobe): `Cart`, `CartItemInterface`, `Company` (SaaS), `CreditMemo`, `CreditMemoItem`, `CreditMemoItemInterface`, `CustomerOrder`, `Invoice`, `InvoiceItem`, `InvoiceItemInterface`, `NegotiableQuote` (SaaS), `Order`, `OrderItem`, `OrderItemInterface`, `Quote`, `QuoteItem`.

### Cài đặt trên PaaS / on-prem (Adobe Commerce)

Nguồn: cùng trang [Custom attribute mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/) (mục *Install custom attribute support*).

- **Điều kiện:** Adobe Commerce (cloud hoặc on-prem) **2.4.5+**, PHP **8.1+**; **Magento Open Source không được hỗ trợ** (theo doc).
- Cài package: `composer require magento/out-of-process-custom-attributes=^0.2.0 --with-dependencies`
- Bật module: `Magento_CustomAttributeSerializable`, `Magento_CustomAttributeSerializableGraphQl`
- On-prem: `bin/magento setup:upgrade && bin/magento cache:clean`

---

## 10. `setCustomAttributesOnCart`

Nguồn: [setCustomAttributesOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-cart/)

- Input: `CartCustomAttributesInput` — `cart_id`, `custom_attributes[]` (`attribute_code`, `value`).
- Trả về giỏ đã cập nhật; khi chuyển quote thành order, custom attributes **được copy** sang order.

---

## 11. `setCustomAttributesOnCartItem`

Nguồn: [setCustomAttributesOnCartItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-cart-item/)

- Input: `CartItemCustomAttributesInput` — `cart_id`, `cart_item_id`, `custom_attributes[]`.

---

## 12. `setCustomAttributesOnCompany`

Nguồn: [setCustomAttributesOnCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-company/)

- Input: `SetCustomAttributesOnCompanyInput` — `company_id`, `custom_attributes[]`.
- Trang Adobe đánh dấu **SaaS only**; PaaS có thể cài module bổ sung (xem §9).

---

## 13. `setCustomAttributesOnCreditMemo`

Nguồn: [setCustomAttributesOnCreditMemo](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-credit-memo/)

- Input: `CreditMemoCustomAttributesInput` — `credit_memo_id`, `custom_attributes[]`.
- Output: `CreditMemoOutput` (vd. field `credit_memo` trong ví dụ Adobe).

---

## 14. `setCustomAttributesOnCreditMemoItem`

Nguồn: [setCustomAttributesOnCreditMemoItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-credit-memo-item/)

- Input: `CreditMemoItemCustomAttributesInput` — `credit_memo_id`, `credit_memo_item_id`, `custom_attributes[]`.

---

## 15. `setCustomAttributesOnInvoice`

Nguồn: [setCustomAttributesOnInvoice](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-invoice/)

- Input: `InvoiceCustomAttributesInput` — `invoice_id`, `custom_attributes[]`.
- Output: `InvoiceOutput` (entity `invoice`).

---

## 16. `setCustomAttributesOnInvoiceItem`

Nguồn: [setCustomAttributesOnInvoiceItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-invoice-item/)

- Input: `InvoiceItemCustomAttributesInput` — `invoice_id`, `invoice_item_id`, `custom_attributes[]`.

---

## 17. `setCustomAttributesOnNegotiableQuote`

Nguồn: [setCustomAttributesOnNegotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-negotiable-quote/)

- Input: `SetCustomAttributesOnNegotiableQuoteInput` — `negotiable_quote_id`, `custom_attributes[]`.
- Output: `SetCustomAttributesOnNegotiableQuoteOutput` (vd. `negotiable_quote`).
- Trang Adobe ghi **SaaS only** cho mục reference tương ứng.

---

## 18. Attribute interfaces và implementations

Nguồn: [Attribute interfaces and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/interfaces/)

- Adobe Commerce **PaaS** (cloud + on-prem) định nghĩa các **GraphQL interface** để truy cập thuộc tính hệ thống và custom attributes của merchant; bảng **interface → type cụ thể** có link sang **GraphQL API reference** (PaaS: `graphql-api/index.html`; **SaaS**: `graphql-api/saas/index.html`) — chọn đúng bản với stack của bạn.
- Interface chính: `AttributeSelectedOptionInterface`, `AttributeValueInterface`, `CustomAttributeMetadataInterface`, `CustomAttributeOptionInterface` (implementations: `AttributeSelectedOption`, `AttributeValue`, `AttributeSelectedOptions`, `AttributeMetadata`, `AttributeOptionMetadata`, … — đầy đủ trên Adobe).
- **SaaS** thêm hai implementation của `AttributeValueInterface`: **`AttributeFile`**, **`AttributeImage`** (file ảnh lên Amazon S3). Khi migrate từ Cloud Infrastructure hoặc on-prem, đây là thay đổi **không tương thích ngược**; nếu dùng custom attribute dạng file/ảnh phải cập nhật client theo implementation mới (theo Adobe).
- Phần **Example usage** trên doc: query `customer { custom_attributes { ... on AttributeValue / AttributeSelectedOptions } }` với fragment — xem trang gốc.

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Reference theo phiên bản: [`reference.md`](./reference.md)
- Lọc query theo custom attributes (Usage): [`usage.md`](./usage.md) §4
