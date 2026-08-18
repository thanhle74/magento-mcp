# REST Tutorials (Order Processing + Inventory)

Nguon chinh:

- [REST tutorials](https://developer.adobe.com/commerce/webapi/rest/tutorials/)
- [Order processing tutorial](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/)
- [Generate the admin token (prerequisite)](https://developer.adobe.com/commerce/webapi/rest/tutorials/prerequisite-tasks/)

---

## 1. Tong quan REST tutorials

Phan REST Tutorials tap trung vao cac luong nghiep vu phuc tap, trong do noi bat la:

- Order processing (10 buoc, PaaS only)
- Order processing with Inventory Management (14 buoc, PaaS only)
- Product tutorials (configurable, grouped, bundle, product images)

Tai lieu nay tom tat 2 luong chinh:

- **Order processing** (10 buoc)
- **Order processing with Inventory Management** (14 buoc)
- **Create configurable product using bulk APIs** (4 buoc)
- **Create and manage grouped products**
- **Create bundle products** (4 buoc)
- **Working with product images** (4 buoc)

---

## 2. Prerequisites chung

Theo huong dan Adobe, truoc khi chay tutorial can:

- Cai dat Adobe Commerce instance co sample data (Luma)
- Co REST client (Postman duoc khuyen nghi)
- Biet cau truc REST call trong Commerce
- Co tai lieu REST reference san sang de tra cuu
- Kich hoat 2FA (vi du Google Authenticator) cho admin

Tham khao:

- [REST tutorials landing](https://developer.adobe.com/commerce/webapi/rest/tutorials/)
- [Order processing tutorial](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/)

---

## 3. Luong 10 buoc: Order processing (PaaS)

### Step 1 - Configure store

Link: [Step 1. Configure the store](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-config-store/)

Muc tieu:

- Bat payment method offline phu hop (thuong `banktransfer`)
- Tat cart price rule free shipping de de theo doi tinh phi ship
- Xac nhan offline shipping methods (flatrate/tablerate) da bat

Ghi chu:

- Sau khi doi config trong Admin, nho refresh cache.

### Step 2 - Get admin token

Link: [Step 2. Get the admin token](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-admin-token/)

Endpoint chinh:

- `POST /V1/tfa/provider/google/authenticate`

Payload yeu cau:

- `username`, `password`, `otp` (6 so tu app 2FA)

Ket qua:

- Nhan admin bearer token (mac dinh het han sau 4 gio)

### Step 3 - Create customer

Link: [Step 3. Create a customer](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-create-customer/)

Endpoints chinh:

- `POST /V1/customers` (tao account)
- `POST /V1/integration/customer/token` (lay customer token)

Ket qua:

- Co customer account + customer bearer token de thao tac cart `mine`.

### Step 4 - Create quote (cart)

Link: [Step 4. Create a quote](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-create-quote/)

Endpoint chinh:

- `POST /V1/carts/mine`

Ket qua:

- Tra ve `quoteId` (cung co the thay bang `cartId` trong mot so endpoint).

### Step 5 - Add items to cart

Link: [Step 5. Add items to the cart](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-add-items/)

Endpoint chinh:

- `POST /V1/carts/mine/items`

Kieu san pham duoc minh hoa:

- Simple
- Downloadable
- Configurable (can `option_id` + `option_value`)
- Bundle (can `bundle_options` va `option_selections`)

Luu y guest flow:

- Dung endpoint `V1/guest-carts/<cartId>/items`, khong gui bearer token.

### Step 6 - Prepare for checkout

Link: [Step 6. Prepare for checkout](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-prepare-checkout/)

Hai call chinh:

- `POST /V1/carts/mine/estimate-shipping-methods`
- `POST /V1/carts/mine/shipping-information`

Muc tieu:

- Uoc tinh phi ship
- Set dia chi shipping/billing + chon shipping method
- Nhan danh sach payment methods + totals

### Step 7 - Create order

Link: [Step 7. Create an order](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-create-order/)

Hai call chinh:

- `POST /V1/carts/mine/payment-information` (dat payment, tao order)
- `GET /V1/orders/{orderId}` (admin review order details)

Muc tieu:

- Convert quote thanh order.

### Step 8 - Create invoice

Link: [Step 8. Create an invoice](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-create-invoice/)

Endpoints chinh:

- `POST /V1/order/{orderId}/invoice`
- `GET /V1/invoices/{invoiceId}`

Muc tieu:

- Capture payment (offline scenario) va tao invoice.

### Step 9 - Create shipment

Link: [Step 9. Create a shipment](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-create-shipment/)

Endpoint chinh:

- `POST /V1/order/{orderId}/ship`

Luu y:

- Payload can `order_item_id` dung item can ship.
- Co the truyen them `tracks` de gan ma van don.

### Step 10 - Issue partial refund

Link: [Step 10. Issue a partial refund](https://developer.adobe.com/commerce/webapi/rest/tutorials/orders/order-issue-refund/)

Endpoints quan trong:

- `POST /V1/order/{orderId}/refund` (offline)
- `POST /V1/invoice/{invoiceId}/refund` (online payment)

Muc tieu:

- Tao credit memo va cap nhat order/invoice trong mot call.

---

## 4. Mapping nhanh endpoint theo phase

| Phase | Endpoint |
|------|----------|
| Auth admin | `POST /V1/tfa/provider/google/authenticate` |
| Auth customer | `POST /V1/integration/customer/token` |
| Cart create | `POST /V1/carts/mine` |
| Cart items | `POST /V1/carts/mine/items` |
| Shipping estimate | `POST /V1/carts/mine/estimate-shipping-methods` |
| Shipping info | `POST /V1/carts/mine/shipping-information` |
| Place order | `POST /V1/carts/mine/payment-information` |
| Invoice | `POST /V1/order/{id}/invoice` |
| Shipment | `POST /V1/order/{id}/ship` |
| Refund | `POST /V1/order/{id}/refund` |

---

## 5. Notes cho headless/integration teams

- Tinh nhat quan user context: admin token chi dung cho admin operations, customer token dung cho cart/customer calls.
- Guest va logged-in co endpoint khac nhau (`mine` vs `guest-carts/<cartId>`), can chuan hoa trong service layer.
- Cac step shipping/payment phu thuoc config store (payment method, shipping methods, cart rules), nen version hoa env config de test on dinh.
- Nho bo sung logging cho `quoteId`, `orderId`, `invoiceId`, `shipmentId`, `creditmemoId` de trace full lifecycle.

---

## 6. Tutorial: Order processing with Inventory Management (14 buoc, PaaS)

Nguon:

- [Inventory tutorial landing](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/)
- [Step 1. Configure your environment](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/configure-environment/)
- [Step 2. Create sources](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-sources/)
- [Step 3. Create stocks](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-stock/)
- [Step 4. Link stocks and sources](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/assign-source-to-stock/)
- [Step 5. Reassign products to custom sources](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/reassign-products-to-another-source/)
- [Step 6. Create a customer and generate a customer token](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-customer/)
- [Step 7. Create a cart and add products to it](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-cart-add-products/)
- [Step 8. Prepare for checkout](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/prepare-for-checkout/)
- [Step 9. Create an order](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-order/)
- [Step 10. Create an invoice](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-invoice/)
- [Step 11. Run the Source Selection Algorithms](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/run-ssa/)
- [Step 12. Create a shipment](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/create-shipment/)
- [Step 13. Bulk transfer products](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/bulk-transfer-products/)
- [Step 14. Create an order for in-store pickup (optional)](https://developer.adobe.com/commerce/webapi/rest/tutorials/inventory/in-store-pickup/)

### 6.1 Muc tieu va pham vi

- Mo rong luong order processing co ban bang MSI concepts: source, stock, source-item, SSA.
- Minh hoa fulfillment theo da source (partial shipments) thay vi mot kho duy nhat.
- Co su dung endpoint inventory de tinh salable quantity va de nghi nguon xuat kho.

### 6.2 Prerequisites bo sung

- Da cai Adobe Commerce + sample data, co REST client va admin token.
- Da bat offline payment method phu hop (thuong `banktransfer`) va delivery methods can test.
- Da cau hinh distance provider (neu test distance-based SSA) va flush cache sau config.
- Luu y tutorial nay la **PaaS only**.

### 6.3 Tom tat 14 buoc

**Step 1 - Configure environment**

- Cau hinh payment/delivery methods, distance provider.
- Tat cart rule free shipping de de theo doi shipping charge.
- Flush cache sau thay doi config.

**Step 2 - Create sources**

- Tao cac source warehouse/store bang `POST /V1/inventory/sources`.
- Co the danh dau pickup locations qua extension attributes tren source.

**Step 3 - Create stocks**

- Tao stock bang `POST /V1/inventory/stocks`, map sales channel (website) vao stock.
- Ghi nhan `stock_id` de dung cho cac buoc sau.

**Step 4 - Link stocks and sources**

- Link source vao stock bang `POST /V1/inventory/stock-source-links`.
- Set `priority` cho SSA.
- Reindex + flush cache sau khi link.

**Step 5 - Reassign products to custom sources**

- Unassign khoi default source: `POST /V1/inventory/source-items-delete`.
- Assign source item moi: `POST /V1/inventory/source-items`.
- Canh bao: can xu ly don dang mo truoc khi unassign source.

**Step 6 - Create customer + token**

- Tao customer bang `POST /V1/customers`.
- Lay customer token bang `POST /V1/integration/customer/token`.

**Step 7 - Create cart and add products**

- Tao cart: `POST /V1/carts/mine`.
- Kiem tra salable qty: `GET /V1/inventory/get-product-salable-quantity/:sku/:stockId`.
- Them items: `POST /V1/carts/mine/items`.

**Step 8 - Prepare for checkout**

- Uoc tinh shipping va set shipping/billing + payment methods.
- Endpoint chinh:
  - `POST /V1/carts/mine/estimate-shipping-methods`
  - `POST /V1/carts/mine/shipping-information`

**Step 9 - Create order**

- Place order qua `POST /V1/carts/mine/payment-information`.
- Tao reservation theo stock cho so luong dat hang.

**Step 10 - Create invoice**

- Capture payment (offline): `POST /V1/order/{orderId}/invoice`.
- Co the lay invoice de doc `order_item_id`: `GET /V1/invoices/{invoiceId}`.

**Step 11 - Run SSA**

- List algorithms: `GET /V1/inventory/source-selection-algorithm-list`.
- Tinh recommendation: `POST /V1/inventory/source-selection-algorithm-result`.
- Ket qua tra ve source + qty deduce de lap shipment plan.

**Step 12 - Create shipment**

- Dung `POST /V1/order/{orderId}/ship` (khuyen nghi hon `POST /V1/shipment`).
- Co the tao nhieu partial shipments theo tung source.
- Truyen `arguments.extension_attributes.source_code` de chon source xuat kho.

**Step 13 - Bulk transfer products**

- Chuyen toan bo ton giua source:
  - `POST /V1/inventory/bulk-product-source-transfer`
- Chuyen mot phan ton:
  - `POST /V1/inventory/bulk-partial-source-transfer`

**Step 14 - In-store pickup order (optional)**

- Minh hoa dat don pickup thay vi shipping.
- Dung pickup-related APIs/workflow de xac dinh va xu ly dia diem nhan hang.

### 6.4 Endpoint map nhanh (inventory tutorial)

| Phase | Endpoint |
|------|----------|
| Create source | `POST /V1/inventory/sources` |
| Create stock | `POST /V1/inventory/stocks` |
| Link stock-source | `POST /V1/inventory/stock-source-links` |
| Reassign source items | `POST /V1/inventory/source-items` / `POST /V1/inventory/source-items-delete` |
| Salable qty check | `GET /V1/inventory/get-product-salable-quantity/:sku/:stockId` |
| List SSA | `GET /V1/inventory/source-selection-algorithm-list` |
| Run SSA | `POST /V1/inventory/source-selection-algorithm-result` |
| Create shipment by source | `POST /V1/order/{id}/ship` + `source_code` |
| Bulk transfer | `POST /V1/inventory/bulk-product-source-transfer` |
| Partial transfer | `POST /V1/inventory/bulk-partial-source-transfer` |

### 6.5 Notes cho teams

- Luon tach ro 3 lop: **reservation**, **salable quantity**, **quantity per source**.
- Sau thay doi topology inventory (stock-source links), can reindex va flush cache.
- Khong unassign source item khi con pending orders cua SKU do neu chua co migration plan.
- Chot strategy SSA (`priority` hay `distance`) theo business logic fulfillment.
- Khi multi-source shipment, luu log day du `order_item_id`, `source_code`, `shipment_id`.

---

## 7. Tutorial: Create configurable product using bulk APIs

Nguon:

- [Create a configurable product using bulk APIs](https://developer.adobe.com/commerce/webapi/rest/tutorials/bulk-configurable-product/)
- [Step 1. Plan the product](https://developer.adobe.com/commerce/webapi/rest/tutorials/bulk-configurable-product/plan-product/)
- [Step 2. Create the configurable and simple products](https://developer.adobe.com/commerce/webapi/rest/tutorials/bulk-configurable-product/create-configurable-simple-products/)
- [Step 3. Define configurable product options](https://developer.adobe.com/commerce/webapi/rest/tutorials/bulk-configurable-product/define-config-product-options/)
- [Step 4. Create the personalization option](https://developer.adobe.com/commerce/webapi/rest/tutorials/bulk-configurable-product/create-personalization-option/)

### 7.1 Muc tieu

- Tao 1 configurable product + cac simple child products trong mot luong bulk.
- Gan configurable attribute (vi du size) va link child products vao parent.
- Them customizable option (vi du text personalization) bang bulk endpoint.

### 7.2 Luu y truoc khi chay

- Tutorial yeu cau admin token cho tat ca call.
- Can chay consumer async de xu ly bulk requests:  
  `bin/magento queue:consumers:start async.operations.all`
- Route bulk khong dung path param truc tiep, can doi sang dang `bySku` theo quy tac bulk.

### 7.3 Tom tat 4 buoc

**Step 1 - Plan product**

- Xac dinh attribute set, category IDs, attributes dung cho configurable options.
- Thuong phai query cac gia tri he thong (vi du `attribute_set_id`, `attribute_id`, `value_index`).

**Step 2 - Create configurable + simple products**

- Dung bulk endpoint: `POST /rest/<store>/async/bulk/V1/products`.
- Gui mot mang payload gom parent configurable + cac simple products.
- Bulk response tra `bulk_uuid`, can theo doi status neu can.

**Step 3 - Define configurable options**

- Gan configurable attribute:
  - `POST /rest/<store>/async/bulk/V1/configurable-products/bySku/options`
- Link simple children vao parent:
  - `POST /rest/<store>/async/bulk/V1/configurable-products/bySku/child`

**Step 4 - Create personalization option**

- Them custom option cho product:
  - `POST /rest/<store>/async/bulk/V1/products/options`
- Vi du them text field voi gioi han ky tu va gia phu troi.

### 7.4 Endpoint map nhanh

| Phase | Endpoint |
|------|----------|
| Bulk create products | `POST /rest/<store>/async/bulk/V1/products` |
| Set configurable attribute | `POST /rest/<store>/async/bulk/V1/configurable-products/bySku/options` |
| Link child products | `POST /rest/<store>/async/bulk/V1/configurable-products/bySku/child` |
| Add custom option | `POST /rest/<store>/async/bulk/V1/products/options` |

---

## 8. Tutorial: Create and manage grouped products

Nguon:

- [Create and manage grouped products](https://developer.adobe.com/commerce/webapi/rest/tutorials/grouped-product/)

### 8.1 Muc tieu

- Tao grouped product (container) va them cac simple products lien ket.
- Cap nhat nhom bang cach them/xoa linked products.
- Minh hoa cach add grouped product vao cart.

### 8.2 Luong thuc hien

**Step 1 - Create empty grouped product**

- Endpoint: `POST /V1/products`
- Product `type_id` dat la `grouped`.

**Step 2 - Populate grouped product**

- Endpoint: `POST /V1/products/{groupedSku}/links`
- Gui mang `items` voi `link_type=associated` de them simple products.

**Step 3 - Add one more simple product**

- Endpoint: `PUT /V1/products/{groupedSku}/links`
- Co the xoa lien ket qua:
  - `DELETE /V1/products/{sku}/links/{type}/{linkedProductSku}`

**Step 4 - Add grouped product to cart (minh hoa)**

- Endpoint: `POST /V1/carts/mine/items`
- Dung `sku` cua grouped product trong `cartItem`.

### 8.3 Endpoint map nhanh

| Phase | Endpoint |
|------|----------|
| Create grouped product | `POST /V1/products` |
| Add associated links (batch) | `POST /V1/products/{groupedSku}/links` |
| Add/update one link | `PUT /V1/products/{groupedSku}/links` |
| Remove one linked product | `DELETE /V1/products/{sku}/links/{type}/{linkedProductSku}` |
| Add grouped to cart | `POST /V1/carts/mine/items` |

---

## 9. Tutorial: Create bundle products

Nguon:

- [Step 1. Plan the product](https://developer.adobe.com/commerce/webapi/rest/tutorials/bundle-product/plan-product/)
- [Step 2. Create the simple products](https://developer.adobe.com/commerce/webapi/rest/tutorials/bundle-product/create-simple-products/)
- [Step 3. Create the bundle product](https://developer.adobe.com/commerce/webapi/rest/tutorials/bundle-product/create-bundle-product/)
- [Step 4. Update bundle product options and option links](https://developer.adobe.com/commerce/webapi/rest/tutorials/bundle-product/update-options-and-links/)

### 9.1 Muc tieu

- Tao bundle product voi cac lua chon (options) gom nhieu simple products.
- Dinh nghia quan he option-link (vi du `RAM`, `Monitor`) va gia tri gia/qty cho tung linked product.
- Cap nhat option va option links sau khi bundle da tao.

### 9.2 Tom tat 4 buoc

**Step 1 - Plan product**

- Thu thap `attribute_set_id`, category IDs, tax/visibility values.
- Xac dinh danh sach simple SKUs se dung lam thanh phan bundle.
- Luu y tutorial mau dung `Default` attribute set va tim gia tri bang REST search endpoints.

**Step 2 - Create simple products**

- Tao cac simple products bang `POST /V1/products` (vd `RAM-12GB`, `RAM-24GB`, `Monitor-15`, `Monitor-17`).
- Gan category links + stock item + custom attributes can thiet.

**Step 3 - Create bundle product**

- Tao bundle parent bang `POST /V1/products` voi `type_id=bundle`.
- Truyen `extension_attributes.bundle_product_options` de khai bao options va product links ngay trong payload.
- Dung `saveOptions=true` de luu option cung luc tao product.

**Step 4 - Update options and links (optional)**

- Lay thong tin bundle va `option_id`: `GET /V1/products/{bundleSku}`.
- Cap nhat option: `PUT /V1/bundle-products/options/{optionId}`.
- Cap nhat link trong option: `PUT /V1/bundle-products/{sku}/links/{optionId}`.

### 9.3 Endpoint map nhanh

| Phase | Endpoint |
|------|----------|
| Create simple product | `POST /V1/products` |
| Create bundle product | `POST /V1/products` (`type_id=bundle`, `saveOptions=true`) |
| Read bundle details | `GET /V1/products/{bundleSku}` |
| Update bundle option | `PUT /V1/bundle-products/options/{optionId}` |
| Update bundle option link | `PUT /V1/bundle-products/{sku}/links/{optionId}` |

### 9.4 Notes cho teams

- Bundle payload co nested structure sau: product -> extension_attributes -> bundle_product_options -> product_links.
- `option_id` va link `id` la du lieu he thong sinh; can read-back truoc khi update.
- Sau khi tao/cap nhat bundle, neu storefront chua thay doi ngay thi can reindex va flush cache.

---

## 10. Tutorial: Working with product images

Nguon:

- [Add and manage product images tutorial](https://developer.adobe.com/commerce/webapi/rest/tutorials/image/)
- [Step 1. Get a list of product images](https://developer.adobe.com/commerce/webapi/rest/tutorials/image/list/)
- [Step 2. Add a new image to a product](https://developer.adobe.com/commerce/webapi/rest/tutorials/image/new/)
- [Step 3. Update an image of a product](https://developer.adobe.com/commerce/webapi/rest/tutorials/image/update/)
- [Step 4. Delete an image of a product](https://developer.adobe.com/commerce/webapi/rest/tutorials/image/delete/)

### 10.1 Muc tieu

- Liet ke media gallery images cho mot SKU.
- Them anh moi vao product bang payload co `base64`.
- Cap nhat anh ton tai theo `imageId`.
- Xoa anh khoi product media gallery.

### 10.2 Tom tat 4 buoc

**Step 1 - List product images**

- Endpoint: `GET /V1/products/{sku}/media`
- Nhan danh sach image metadata (`id`, `file`, `types`, `position`, ...).
- `id` se duoc dung cho cac buoc update/delete.

**Step 2 - Add new image**

- Endpoint: `POST /V1/products/{sku}/media`
- Payload can `entry.content.base64_encoded_data`, `type`, `name`.
- Response tra `imageId` moi.

**Step 3 - Update existing image**

- Endpoint: `PUT /V1/products/{sku}/media/{imageId}`
- Co the doi binary (base64), label, position, va image role types.

**Step 4 - Delete image**

- Endpoint: `DELETE /V1/products/{sku}/media/{imageId}`
- Payload rong; response `true` neu xoa thanh cong.

### 10.3 Endpoint map nhanh

| Phase | Endpoint |
|------|----------|
| List images | `GET /V1/products/{sku}/media` |
| Add image | `POST /V1/products/{sku}/media` |
| Update image | `PUT /V1/products/{sku}/media/{imageId}` |
| Delete image | `DELETE /V1/products/{sku}/media/{imageId}` |

### 10.4 Notes cho teams

- Dung MIME type dung (`image/png`, `image/jpeg`, ...) trong `entry.content.type`.
- Payload base64 lon co the can timeout cao hon o client/proxy.
- De tranh mismatch `imageId`, nen always list images truoc update/delete.
- Sau thao tac media, storefront cache/CDN co the can invalidation de thay doi hien thi ngay.

---

## Lien ket trong `.spec`

- REST overview: [`./overview.md`](./overview.md)
- REST B2B: [`./b2b.md`](./b2b.md)
- REST Inventory (MSI): [`./inventory.md`](./inventory.md)
- Web APIs get started: [`../web-api.md`](../web-api.md)
