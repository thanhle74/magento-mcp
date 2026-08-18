# GraphQL — Schema (Guide): Cart

Tóm tắt nhóm **Cart** trên Adobe (guide). Chi tiết field và ví dụ: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Cart (nhóm schema)

Nguồn: [Cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/)

Luồng người mua ảnh hưởng giỏ hàng gồm:

- Chọn sản phẩm; chỉnh số lượng hoặc **xoá** khỏi giỏ.
- Xem **tổng chi phí** các dòng đã chọn.
- **Áp dụng / gỡ** coupon, gift card, reward points, store credit (đổi tổng).
- Đặt **địa chỉ giao** và phương thức vận chuyển.
- Đặt **phương thức thanh toán** và địa chỉ thanh toán.

Trên Adobe, nhóm còn có **Queries**, **Mutations** (thêm SP, checkout, …), **Interfaces** — mở sidebar trên trang [GraphQL schema — Cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/). Trong file này: **queries** §2–§4; **mutations** mục lục §5, chi tiết §6–§39; **interfaces** (Cart / `CartItemInterface`) §40.

---

## 2. Cart — danh sách queries

Nguồn: [Cart queries](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/)

| Query | Ghi chú ngắn |
|-------|----------------|
| `cart` | Nội dung giỏ; object `Cart` cũng trả về từ nhiều **mutation** (thêm SP, chuẩn bị checkout, …). |
| `pickupLocations` | Điểm **lấy hàng tại cửa hàng** khi **Inventory Management (MSI)** đã cài và cấu hình; hữu ích khi khách đã chọn mặt hàng. |

---

## 3. `cart`

Nguồn: [cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/cart/)

- Lấy thông tin một giỏ cụ thể: `cart(cart_id: String!): Cart`.
- Logic giỏ nằm trong module **`Quote`**: quote = nội dung shopping cart; theo dõi từng dòng (số lượng, giá cơ sở), ước lượng phí ship, subtotal, coupon, phương thức thanh toán, v.v.
- Trang **Reference** trên Adobe có nhánh **SaaS** / **PaaS** — chọn đúng môi trường.
- Adobe cung cấp sample query (API playground, Luma sample data); có thể đổi `cart_id` thành biến.

---

## 4. `pickupLocations`

Nguồn: [pickupLocations](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/pickup-locations/)

- Trả về danh sách **điểm lấy hàng** khả dụng.
- **Bộ lọc vùng (area):** bán kính + `search_term` — định dạng `khu vực/thành/mã bưu điện` + `:` + **mã quốc gia 2 chữ HOA** (vd. `Texas:US`, `Austin:US`, `78740:US`).
- **Bộ lọc thuộc tính:** quốc gia, mã bưu điện, vùng, thành, đường, tên, mã điểm pickup, … Có thể kết hợp nhiều filter.
- **Không** hỗ trợ tìm theo **SKU assignment intersections** (theo Adobe).
- Nếu **không** truyền filter: trả về các điểm pickup gán cho **Sales Channel** mà store đang dùng.
- **`ProductInfoInput` / danh sách SKU:** nếu có, response chỉ gồm những nơi mà **tất cả** sản phẩm trong danh sách đều có thể pickup tại chỗ; thiếu một SKU là location có thể bị loại.
- Hỗ trợ **phân trang** và **sắp xếp** (kể cả theo **khoảng cách** khi dùng lọc area).
- Kiểu trả về: `PickupLocations` (pagination + danh sách `PickupLocation`).
- Cú pháp (theo doc):  
  `pickupLocations(area: AreaInput, filters: PickupLocationFilterInput, sort: PickupLocationSortInput, pageSize: Int, currentPage: Int): PickupLocations`  
  (trong ví dụ thực tế có thể có thêm tham số như `productsInfo` — đối chiếu đúng bản reference.)
- Reference **SaaS** / **PaaS** trên Adobe.

---

## 5. Cart — mutations (mục lục)

Nguồn mục lục: [Cart mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/) (sidebar **Cart → Mutations** trên [GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/)).

**Thêm SP & áp khuyến mãi**

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `addProductsToCart` | [add-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/) | §6 |
| `addSimpleProductsToCart` | [add-simple-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-simple-products/) | §7 |
| `addConfigurableProductsToCart` | [add-configurable-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-configurable-products/) | §8 |
| `addBundleProductsToCart` | [add-bundle-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-bundle-products/) | §9 |
| `addDownloadableProductsToCart` | [add-downloadable-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-downloadable-products/) | §10 |
| `addVirtualProductsToCart` | [add-virtual-products](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-virtual-products/) | §11 |
| `applyCouponToCart` | [apply-coupon](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupon/) | §12 |
| `applyCouponsToCart` | [apply-coupons](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupons/) | §13 |
| `applyGiftCardToCart` | [apply-giftcard](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-giftcard/) | §14 |
| `applyRewardPointsToCart` | [apply-reward-points](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-reward-points/) | §15 |

**Gỡ dòng / mã, đổi số dư gift card, đặt hàng, tạo giỏ, estimate, merge, store credit**

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `removeItemFromCart` | [remove-item](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-item/) | §16 |
| `removeGiftCardFromCart` | [remove-giftcard](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-giftcard/) | §17 |
| `removeCouponsFromCart` | [remove-coupons](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupons/) | §18 |
| `removeCouponFromCart` | [remove-coupon](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupon/) | §19 |
| `redeemGiftCardBalanceAsStoreCredit` | [redeem-giftcard-balance](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/redeem-giftcard-balance/) | §20 |
| `placeOrder` | [place-order](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/place-order/) | §21 |
| `mergeCarts` | [merge](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/merge/) | §22 |
| `estimateTotals` | [estimate-totals](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-totals/) | §23 |
| `estimateShippingMethods` | [estimate-shipping-methods](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-shipping-methods/) | §24 |
| `createGuestCart` | [create-guest-cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-guest-cart/) | §25 |
| `createEmptyCart` | [create-empty-cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-empty-cart/) | §26 |
| `clearCart` | [clear-cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/clear-cart/) | §27 |
| `assignCustomerToGuestCart` | [assign-customer-to-guest-cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/assign-customer-to-guest-cart/) | §28 |
| `applyStoreCreditToCart` | [apply-store-credit](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-store-credit/) | §29 |

**Chỉnh dòng, địa chỉ, vận chuyển, thanh toán, email guest, quà tặng, gỡ reward / store credit**

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `updateCartItems` | [update-items](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/update-items/) | §30 |
| `setShippingMethodsOnCart` | [set-shipping-method](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-method/) | §31 |
| `setShippingAddressesOnCart` | [set-shipping-address](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-address/) | §32 |
| `setPaymentMethodOnCart` | [set-payment-method](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-method/) | §33 |
| `setPaymentMethodAndPlaceOrder` | [set-payment-place-order](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-place-order/) | §34 |
| `setGuestEmailOnCart` | [set-guest-email](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-guest-email/) | §35 |
| `setGiftOptionsOnCart` | [set-gift-options](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-gift-options/) | §36 |
| `setBillingAddressOnCart` | [set-billing-address](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-billing-address/) | §37 |
| `removeStoreCreditFromCart` | [remove-store-credit](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-store-credit/) | §38 |
| `removeRewardPointsFromCart` | [remove-reward-points](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-reward-points/) | §39 |

**Interfaces (schema Cart)**

| Nội dung | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `CartItemInterface` — các kiểu triển khai | [interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/interfaces/) | §40 |

---

## 6. `addProductsToCart`

Nguồn: [addProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/)

- Thêm **mọi loại** sản phẩm vào giỏ trong **một lần gọi**; Adobe **khuyến nghị** dùng mutation này thay cho các mutation chỉ đích danh một loại SP (`addSimpleProductsToCart`, `addConfigurableProductsToCart`, …).
- Tham số: `cartId: String!`, `cartItems: [CartItemInput!]!` → `AddProductsToCartOutput`.
- `CartItemInput` có **`selected_options`** và **`entered_options`**: selected = chọn sẵn (dropdown, bundle, configurable, downloadable link, gift card amount, grouped, …); entered = nhập text/file/custom amount/message (theo doc). Tham chiếu option bằng **`uid`** (quy ước trong tài liệu Adobe).

---

## 7. `addSimpleProductsToCart`

Nguồn: [addSimpleProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-simple-products/)

- `addSimpleProductsToCart(input: AddSimpleProductsToCartInput): AddSimpleProductsToCartOutput` (cú pháp tóm tắt trên Adobe).

---

## 8. `addConfigurableProductsToCart`

Nguồn: [addConfigurableProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-configurable-products/)

- `addConfigurableProductsToCart(input: AddConfigurableProductsToCartInput) { AddConfigurableProductsToCartOutput }`.

---

## 9. `addBundleProductsToCart`

Nguồn: [addBundleProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-bundle-products/)

- `addBundleProductsToCart(input: AddBundleProductsToCartInput): AddBundleProductsToCartOutput`.
- Ví dụ trên Adobe dùng sample data (vd. bundle **Sprite Yoga Companion Kit**, SKU `24-WG080`).

---

## 10. `addDownloadableProductsToCart`

Nguồn: [addDownloadableProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-downloadable-products/)

- Adobe **khuyến nghị** dùng **`addProductsToCart`** cho mọi loại SP.
- Downloadable: cần `cart_id`, SKU, quantity; đôi khi phải có ID cho **downloadable links**; có thể thêm customizable options.
- `addDownloadableProductsToCart(input: AddDownloadableProductsToCartInput): AddDownloadableProductsToCartOutput`. Trang doc có nhãn **PaaS only** ở phần đầu (đối chiếu reference đúng bản).

---

## 11. `addVirtualProductsToCart`

Nguồn: [addVirtualProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-virtual-products/)

- `addVirtualProductsToCart(input: AddVirtualProductsToCartInput): AddVirtualProductsToCartOutput`.

---

## 12. `applyCouponToCart`

Nguồn: [applyCouponToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupon/)

- Áp **một** mã coupon đã định nghĩa trong **cart price rules**.
- `applyCouponToCart(input: ApplyCouponToCartInput) { ApplyCouponToCartOutput }`.

---

## 13. `applyCouponsToCart`

Nguồn: [applyCouponsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupons/)

- Áp **một hoặc nhiều** mã coupon; `ApplyCouponsToCartInput` có field **`type`**: `APPEND` (giữ coupon đã áp) hoặc `REPLACE` (**thay** toàn bộ bằng danh sách mới).
- `applyCouponsToCart(input: ApplyCouponsToCartInput) { ApplyCouponToCartOutput }`.
- Trên Adobe có badge **Exclusive feature — Adobe Commerce** (xem trang gốc).

---

## 14. `applyGiftCardToCart`

Nguồn: [applyGiftCardToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-giftcard/)

- Áp mã **gift card** có sẵn vào giỏ: `applyGiftCardToCart(input: ApplyGiftCardToCartInput): ApplyGiftCardToCartOutput` (input gồm `cart_id`, `gift_card_code`).
- **Adobe Commerce** only (badge trên doc); bảng lỗi mẫu: mã sai, không tìm thấy cart, thiếu/empty `gift_card_code` hoặc `cart_id` (xem **Errors** trên Adobe).

---

## 15. `applyRewardPointsToCart`

Nguồn: [applyRewardPointsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-reward-points/)

- Áp **reward points** vào giỏ; **không** chỉ định số điểm — nếu số dư nhỏ hơn tổng giỏ thì dùng hết dư, không thì áp đủ để về 0; **bỏ phần lẻ** điểm (theo Adobe). Gỡ bằng `removeRewardPointsFromCart`.
- `applyRewardPointsToCart(cartId: ID!): ApplyRewardPointsToCartOutput`.
- **Adobe Commerce** only (badge trên doc).

---

## 16. `removeItemFromCart`

Nguồn: [removeItemFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-item/)

- Xoá **toàn bộ số lượng** của một dòng giỏ (`cart_item_id`). Nếu xoá hết dòng, **giỏ vẫn tồn tại** (quote còn).
- `removeItemFromCart(input: RemoveItemFromCartInput): RemoveItemFromCartOutput`.
- Bảng **Errors** trên Adobe: item không thuộc giỏ, không tìm thấy `cart_id`, thiếu tham số, khách thao tác giỏ người khác, v.v.

---

## 17. `removeGiftCardFromCart`

Nguồn: [removeGiftCardFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-giftcard/)

- Gỡ một **gift card** đã áp trước đó: `removeGiftCardFromCart(input: RemoveGiftCardFromCartInput): RemoveGiftCardFromCartOutput` (`cart_id`, `gift_card_code`).
- **Adobe Commerce** only (badge trên doc).

---

## 18. `removeCouponsFromCart`

Nguồn: [removeCouponsFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupons/)

- Gỡ **một hoặc nhiều** coupon đã áp; giỏ phải còn **ít nhất một** dòng SP mới gỡ được (theo Adobe).
- `removeCouponsFromCart(input: RemoveCouponsFromCartInput) { RemoveCouponFromCartOutput }`.
- **Adobe Commerce** only (badge trên doc).

---

## 19. `removeCouponFromCart`

Nguồn: [removeCouponFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupon/)

- Gỡ **một** coupon đã áp; giỏ phải còn ít nhất một dòng.
- `removeCouponFromCart(input: RemoveCouponFromCartInput) { RemoveCouponFromCartOutput }`.

---

## 20. `redeemGiftCardBalanceAsStoreCredit`

Nguồn: [redeemGiftCardBalanceAsStoreCredit](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/redeem-giftcard-balance/) (Adobe còn có đường dẫn song song dưới nhánh GraphQL schema **Customer** — cùng nội dung mutation; ưu tiên URL đầy đủ `commerce/webapi/…` khi tra.)

- Chuyển **toàn bộ số dư** gift card sang **store credit**; gift card phải **còn redeem được** và **không** được có số dư 0 lúc gọi; sau khi thành công số dư gift card về **0** (theo Adobe).
- Chỉ gọi cho **customer đã đăng nhập** (kèm [authorization token](https://developer.adobe.com/commerce/webapi/graphql/usage/authorization-tokens/)).
- `redeemGiftCardBalanceAsStoreCredit(input: GiftCardAccountInput) { GiftCardAccount }` (vd. `gift_card_code`).
- **Adobe Commerce** only (badge trên doc).

---

## 21. `placeOrder`

Nguồn: [placeOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/place-order/)

- Chuyển giỏ thành **đơn hàng**, trả về order id; quản lý đơn sau đặt thường qua REST/SOAP (theo Adobe).
- Trước khi gọi: tạo giỏ, thêm SP, billing, shipping, shipping method, payment; **guest** cần email trên giỏ.
- Từ **2.4.7**, `PlaceOrderOutput` có thể có **`orderV2`** (vd. token cho `guestOrderByToken`).
- Nếu bật module **AsyncOrder**, mutation có thể chạy **bất đồng bộ** (mặc định đồng bộ).
- `placeOrder(input: PlaceOrderInput) { PlaceOrderOutput }`.

---

## 22. `mergeCarts`

Nguồn: [mergeCarts](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/merge/)

- Gộp nội dung **giỏ guest** (`source_cart_id`) vào **giỏ customer đã đăng nhập**; gọi khi **customer đã login**. `destination_cart_id` tùy chọn — không truyền thì dùng giỏ customer hiện tại.
- Trùng SP thì **cộng số lượng**; thành công thì **xoá** giỏ guest gốc.
- Đối chiều **`assignCustomerToGuestCart`** (merge ngược chiều ý nghĩa — xem §28).
- `mergeCarts(source_cart_id: String!, destination_cart_id: String): Cart!`

---

## 23. `estimateTotals`

Nguồn: [estimateTotals](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-totals/)

- Ước tính **tổng giỏ gồm thuế** theo địa chỉ / phương thức ship (vd. `EstimateTotalsInput`: `cart_id`, `address`, `shipping_method`).
- `estimateTotals(input: EstimateTotalsInput!): EstimateTotalsOutput!`

---

## 24. `estimateShippingMethods`

Nguồn: [estimateShippingMethods](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-shipping-methods/)

- Ước tính **phí vận chuyển** theo vị trí: cùng kiểu input **`EstimateTotalsInput!`** trên doc (vd. `cart_id`, `address`) → mảng **`AvailableShippingMethod`**.
- `estimateShippingMethods(input: EstimateTotalsInput!): [AvailableShippingMethod]`

---

## 25. `createGuestCart`

Nguồn: [createGuestCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-guest-cart/)

- Tạo giỏ **guest** rỗng; hệ thống sinh `cart_id` hoặc gán qua input (`CreateGuestCartInput`, vd. `cart_uid` trong ví dụ Adobe).
- `createGuestCart(input: CreateGuestCartInput) { CreateGuestCartOutput }`
- **Errors** (theo doc): giỏ id đã tồn tại, độ dài id, customer đã login không được tạo guest cart như vậy.

---

## 26. `createEmptyCart`

Nguồn: [createEmptyCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-empty-cart/)

- **Deprecated** — Adobe khuyến nghị **`createGuestCart`**.
- Tạo giỏ rỗng cho guest hoặc customer đã login (customer cần **authorization token** trong header).
- Trả về **String** (cart id) với `createEmptyCart` không tham số, hoặc `input.cart_id` cố định 32 ký tự (theo ví dụ).

---

## 27. `clearCart`

Nguồn: [clearCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/clear-cart/)

- Xoá **tất cả dòng** khỏi giỏ chỉ định: `clearCart(input: ClearCartInput) { ClearCartOutput }` (vd. input `uid` trên Adobe).
- Trang doc: **PaaS only** + badge **Adobe Commerce** (đối chiếu bản bạn dùng).

---

## 28. `assignCustomerToGuestCart`

Nguồn: [assignCustomerToGuestCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/assign-customer-to-guest-cart/)

- Gộp giỏ **customer đã login** vào **giỏ guest** chỉ định; vô hiệu hoá giỏ customer, SP chuyển sang guest; **masked_id** đổi, **`quote_id` giữ** (theo Adobe). Cần **customer token**.
- Khác **`mergeCarts`** (guest → customer): xem mô tả trên Adobe.
- `assignCustomerToGuestCart(cart_id: String!): Cart!`

---

## 29. `applyStoreCreditToCart`

Nguồn: [applyStoreCreditToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-store-credit/)

- Áp **store credit** vào giỏ (bật store credit trên store). Số dư hiển thị lúc gọi mutation **chưa trừ** cho đến khi **đặt hàng** (theo Adobe). Nếu store credit ≥ grand total, đặt payment **`free`** trong `setPaymentMethodOnCart`.
- `applyStoreCreditToCart(input: ApplyStoreCreditToCartInput): ApplyStoreCreditToCartOutput`
- **Adobe Commerce** only (badge trên doc).

---

## 30. `updateCartItems`

Nguồn: [updateCartItems](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/update-items/)

- Sửa dòng trong giỏ (vd. đổi số lượng); mutation **không** tự “tính toán” số lượng hợp lệ thay cho bạn (theo Adobe).
- Đặt **`quantity: 0`** để **xoá** dòng khỏi giỏ.
- `updateCartItems(input: UpdateCartItemsInput): UpdateCartItemsOutput` (cú pháp tóm tắt trên Adobe).

---

## 31. `setShippingMethodsOnCart`

Nguồn: [setShippingMethodsOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-method/)

- Gán **một hoặc nhiều** phương thức giao hàng cho giỏ; doc liệt kê carrier/method mặc định (DHL, FedEx, flatrate, freeshipping, tablerate, UPS, USPS, …).
- **Không** gọi mutation này cho đơn **in-store pickup**: thay vào đó dùng thuộc tính **`pickup_location_code`** trong **`setShippingAddressesOnCart`** (theo Adobe).
- `setShippingMethodsOnCart(input: SetShippingMethodsOnCartInput): SetShippingMethodsOnCartOutput` — đối chiếu tên kiểu chính xác trên reference bản bạn dùng.

---

## 32. `setShippingAddressesOnCart`

Nguồn: [setShippingAddressesOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-address/)

- Đặt **một hoặc nhiều** địa chỉ giao hàng cho giỏ.
- **Không** cần địa chỉ giao khi: giỏ chỉ có **virtual items**; hoặc khi đặt billing đã set **`same_as_shipping: true`** (ứng dụng dùng cùng địa chỉ làm shipping).
- `setShippingAddressesOnCart(input: SetShippingAddressesOnCartInput): SetShippingAddressesOnCartOutput`

---

## 33. `setPaymentMethodOnCart`

Nguồn: [setPaymentMethodOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-method/)

- Gán **phương thức thanh toán** cho giỏ. Offline (vd. `banktransfer`, `cashondelivery`, `checkmo`, `free`, `purchaseorder`) và online (Braintree, PayPal, …) — với online, payload cần object **bổ sung** đúng từng cổng (vd. `braintree` + `payment_method_nonce`, … theo doc).
- `setPaymentMethodOnCart(input: SetPaymentMethodOnCartInput): SetPaymentMethodOnCartOutput`

---

## 34. `setPaymentMethodAndPlaceOrder`

Nguồn: [setPaymentMethodAndPlaceOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-place-order/)

- **Deprecated** — Adobe khuyến nghị **`setPaymentMethodOnCart`** + **`placeOrder`** (có thể gọi cùng request nếu use case cho phép).
- Vẫn mô tả: đặt payment và **chuyển giỏ thành đơn**; trả về **order** (GraphQL không quản lý đơn đầy đủ — backend/REST/SOAP).
- Điều kiện trước khi gọi (theo doc): cart có SP, billing, shipping (nếu không virtual), shipping method (nếu không virtual), guest thì đã gán **email** trên giỏ.
- Nếu bật module **`AsyncOrder`**, mutation có thể chạy **bất đồng bộ**; mặc định **đồng bộ**.
- Input: `SetPaymentMethodAndPlaceOrderInput` → `PlaceOrderOutput` (theo doc).

---

## 35. `setGuestEmailOnCart`

Nguồn: [setGuestEmailOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-guest-email/)

- Với **guest**, phải gán **email** cho giỏ trước khi **place order**. Customer đã login có email từ tài khoản — không dùng mutation này (doc: không cho phép khi đã đăng nhập).
- `setGuestEmailOnCart(input: SetGuestEmailOnCartInput): SetGuestEmailOnCartOutput`

---

## 36. `setGiftOptionsOnCart`

Nguồn: [setGiftOptionsOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-gift-options/)

- Cấu hình quà ở **cấp giỏ**: gift message, gift wrapping, gift receipt, thiệp in — tùy bật trên admin và **phiên bản** (gift message: Open Source; nhiều tùy chọn còn lại: **Adobe Commerce** theo badge doc).
- Xoá gift message: đặt `gift_message` **null**; xoá wrapping: `gift_wrapping_id` **null**. Gift theo **từng dòng**: dùng **`updateCartItems`**.
- Có thể kiểm tra bật/tắt qua các field **`storeConfig`** doc liệt kê (`allow_gift_receipt`, `allow_gift_wrapping_on_order`, …).
- `setGiftOptionsOnCart(input: SetGiftOptionsOnCartInput): SetGiftOptionsOnCartOutput`

---

## 37. `setBillingAddressOnCart`

Nguồn: [setBillingAddressOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-billing-address/)

- Đặt **địa chỉ thanh toán** cho giỏ. Nếu **`same_as_shipping: true`**, billing trùng shipping.
- `setBillingAddressOnCart(input: SetBillingAddressOnCartInput): SetBillingAddressOnCartOutput`

---

## 38. `removeStoreCreditFromCart`

Nguồn: [removeStoreCreditFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-store-credit/)

- Gỡ store credit đã áp bằng **`applyStoreCreditToCart`**; tổng giỏ tính lại. Cần **store credit** bật trên store; **Adobe Commerce** (badge doc). Mutation cần **customer hợp lệ** (authorization token — theo bảng lỗi Adobe).
- `removeStoreCreditFromCart(input: RemoveStoreCreditFromCartInput): RemoveStoreCreditFromCartOutput`

---

## 39. `removeRewardPointsFromCart`

Nguồn: [removeRewardPointsFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-reward-points/)

- Gỡ toàn bộ **reward points** đã áp bằng **`applyRewardPointsToCart`**. **Adobe Commerce** (badge doc).
- Cú pháp trên trang guide: `removeRewardPointsFromCart(cartId: ID!): RemoveRewardPointsFromCartOutput` — nếu lỗi tham chiếu `cart_id` vs `cartId`, đối chiếu **introspection** / reference đúng bản.

---

## 40. Cart — interfaces (`CartItemInterface`)

Nguồn: [Cart — Interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/interfaces/)

- Trang **Interfaces** trong nhóm Cart mô tả **`CartItemInterface`** và các **implementation**: `BundleCartItem`, `ConfigurableCartItem`, `DownloadableCartItem`, `GiftCardCartItem`, `SimpleCartItem`, `VirtualCartItem` (danh sách đầy đủ và field: trên Adobe + reference phiên bản).

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Nhóm Attributes (custom attributes trên cart): [`schema-attributes.md`](./schema-attributes.md) §9–§11
- Tutorial checkout: [GraphQL checkout tutorial](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/) (cổng Adobe)
