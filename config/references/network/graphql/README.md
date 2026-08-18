# GraphQL — Web API (Adobe Commerce)

Tài liệu gốc nằm trên **Adobe Developer — Commerce Web APIs → GraphQL**. Trong spec này, toàn bộ mục **Usage** (endpoint, token, cache, filter, response, headers, introspection, protected mutations, security, staging) gom tại [`usage.md`](./usage.md); **Reference** schema theo phiên bản tại [`reference.md`](./reference.md); **Release Notes** tại [`release-notes.md`](./release-notes.md); nhóm **Tutorial** (checkout 10 bước) tại [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md). Nhánh **Schema (guide)** — mục lục query/mutation theo domain trên Adobe: [`schema-attributes.md`](./schema-attributes.md) (**Attributes**), [`schema-cart.md`](./schema-cart.md) (**Cart** — queries §2–§4; mutations mục lục §5 chi tiết §6–§39; **interfaces** `CartItemInterface` §40), [`schema-catalog-service.md`](./schema-catalog-service.md) (**Catalog Service** + **`productSearch`** Live Search — §1–§9), [`schema-checkout.md`](./schema-checkout.md) (**Checkout** — queries §2–§6, mutations §7–§13), [`schema-payment-methods.md`](./schema-payment-methods.md) (**Core payment methods** — tổng quan §1, methods §2–§12), [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) (**Payment Services extension** — workflows §2–§8, operations §9), [`schema-b2b-company.md`](./schema-b2b-company.md) (**Company (B2B)** — queries §1–§7, mutations §8–§20), [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) (**Negotiable quotes (B2B)** — queries §1–§5, mutations §6–§19, interfaces §20, unions §21), [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) (**Purchase orders (B2B)** — queries §2 + mutations §3–§11), [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) (**Purchase order rules (B2B)** — queries §2–§3, mutations §4–§8, interfaces §9–§10), [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) (**Requisition lists (B2B)** — mutations §2–§12, interfaces §13–§14), [`schema-customer.md`](./schema-customer.md) (**Customer** — queries §1–§10, mutations §11–§34), [`schema-gift-registry.md`](./schema-gift-registry.md) (**Gift registry** — queries §1–§7, mutations §8–§18), [`schema-orders.md`](./schema-orders.md) (**Orders** — queries §19–§21, mutations §2–§12, interfaces §13–§17), [`schema-products.md`](./schema-products.md) (**Products** — queries §2–§12, mutations §13–§24, interfaces §26–§41), [`schema-store.md`](./schema-store.md) (**Store** — queries §2–§13, mutations §14–§15), [`schema-uploads.md`](./schema-uploads.md) (**Uploads** — mutations §2–§4), [`schema-wishlist.md`](./schema-wishlist.md) (**Wish list** — queries §2–§3, mutations §4–§14, interfaces §15–§16).

Nhánh **Development** (định nghĩa `schema.graphqls`, resolver/batch resolver, mở rộng schema, Identity/cache tag, urlResolver tùy chỉnh, debug, exception, functional test): [`development.md`](./development.md).  
**App Server / resolver stateless** (ràng buộc khi chạy long-lived PHP): [`../graphql-app-server.md`](../graphql-app-server.md) — bổ sung cho doc Adobe, không thay thế.

---

## Phiên bản (align với project)

- Constitution: **Magento 2.4.8** → khi tra **GraphQL API reference**, chọn bản **2.4.8** (PaaS / Magento Open Source / Adobe Commerce on-prem), không nhầm với chỉ **SaaS** nếu bạn không dùng stack đó.

---

## Mục lục nhanh

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Schema reference (queries/mutations theo bản) | [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) | [`reference.md`](./reference.md) |
| Schema guide (mục lục theo domain: Attributes, Cart, Catalog Service, Checkout, payment methods, payment services extension, B2B, Customer, Gift registry, Orders, Products, …) | [GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/) | [`schema-attributes.md`](./schema-attributes.md) §1; [`schema-cart.md`](./schema-cart.md) §1; [`schema-catalog-service.md`](./schema-catalog-service.md) §1; [`schema-checkout.md`](./schema-checkout.md) §1; [`schema-payment-methods.md`](./schema-payment-methods.md) §1; [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §1; [`schema-b2b-company.md`](./schema-b2b-company.md) §1; [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §1; [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §1; [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §1; [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §1; [`schema-customer.md`](./schema-customer.md) §1; [`schema-gift-registry.md`](./schema-gift-registry.md) §1; [`schema-orders.md`](./schema-orders.md) §1; [`schema-products.md`](./schema-products.md) §1; [`schema-store.md`](./schema-store.md) §1; [`schema-uploads.md`](./schema-uploads.md) §1; [`schema-wishlist.md`](./schema-wishlist.md) §1; nhóm khác → Adobe |
| Chạy query/mutation, endpoint, usage tổng quan | [GraphQL — Usage](https://developer.adobe.com/commerce/webapi/graphql/usage/) | [`usage.md`](./usage.md) §1 |
| Tutorial đặt hàng 10 bước (checkout) | [GraphQL tutorials](https://developer.adobe.com/commerce/webapi/graphql/tutorials/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §1 |
| GraphQL release notes | [Release notes](https://developer.adobe.com/commerce/webapi/graphql/release-notes/) | [`release-notes.md`](./release-notes.md) §1 |
| Authorization / token | [Authorization](https://developer.adobe.com/commerce/webapi/graphql/usage/authorization-tokens/) | [`usage.md`](./usage.md) §2 |
| Caching | [Caching](https://developer.adobe.com/commerce/webapi/graphql/usage/caching/) | [`usage.md`](./usage.md) §3 |
| Lọc theo custom attributes | [Custom filters](https://developer.adobe.com/commerce/webapi/graphql/usage/custom-filters/) | [`usage.md`](./usage.md) §4 |
| HTTP status & payload lỗi | [Status codes and responses](https://developer.adobe.com/commerce/webapi/graphql/usage/api-response/) | [`usage.md`](./usage.md) §5 |
| Request headers (Store, Currency, Preview, Captcha, …) | [Headers](https://developer.adobe.com/commerce/webapi/graphql/usage/headers/) | [`usage.md`](./usage.md) §6 |
| Introspection (`__schema`, tắt trên production) | [Introspection queries](https://developer.adobe.com/commerce/webapi/graphql/usage/introspection-queries/) | [`usage.md`](./usage.md) §7 |
| Mutation cần CAPTCHA / reCAPTCHA | [Protected mutations](https://developer.adobe.com/commerce/webapi/graphql/usage/protected-mutations/) | [`usage.md`](./usage.md) §8 |
| Giới hạn độ phức tạp/độ sâu query | [Security configuration](https://developer.adobe.com/commerce/webapi/graphql/usage/security-configuration/) | [`usage.md`](./usage.md) §9 |
| Preview nội dung staging (Adobe Commerce) | [Staging queries](https://developer.adobe.com/commerce/webapi/graphql/usage/staging-queries/) | [`usage.md`](./usage.md) §10 |

### Development (schema, resolver, mở rộng)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Định nghĩa schema module (`schema.graphqls`, query/mutation/enum, `@doc`, caching) | [Define schema](https://developer.adobe.com/commerce/webapi/graphql/develop/) | [`development.md`](./development.md) §1 |
| Resolvers (`ResolverInterface`, batch) | [Resolvers](https://developer.adobe.com/commerce/webapi/graphql/develop/resolvers/) | [`development.md`](./development.md) §2 |
| Mở rộng schema (stitching, plugin, …) | [Extend existing schema](https://developer.adobe.com/commerce/webapi/graphql/develop/extend-existing-schema/) | [`development.md`](./development.md) §3 |
| Identity / cache tags (`IdentityInterface`, `@cache`) | [Identity class](https://developer.adobe.com/commerce/webapi/graphql/develop/identity-class/) | [`development.md`](./development.md) §4 |
| `urlResolver` + URL rewrite | [Custom urlResolver](https://developer.adobe.com/commerce/webapi/graphql/develop/create-custom-url-resolver/) | [`development.md`](./development.md) §5 |
| Debug (Xdebug, PhpStorm) | [Debugging](https://developer.adobe.com/commerce/webapi/graphql/develop/debugging/) | [`development.md`](./development.md) §6 |
| Exception (`ClientAware`, `GraphQl*Exception`) | [Exceptions](https://developer.adobe.com/commerce/webapi/graphql/develop/exceptions/) | [`development.md`](./development.md) §7 |
| Functional testing | [Functional testing](https://developer.adobe.com/commerce/webapi/graphql/develop/functional-testing/) | [`development.md`](./development.md) §8 |

### Tutorial — Checkout (10 bước)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| GraphQL tutorials (tổng quan) | [GraphQL tutorials](https://developer.adobe.com/commerce/webapi/graphql/tutorials/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §1 |
| GraphQL checkout tutorial | [GraphQL checkout tutorial](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §2 |
| Step 1: Create a customer | [create-customer](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/create-customer/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §3 |
| Step 2: Create an empty cart | [create-cart](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/create-cart/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §4 |
| Step 3: Add products to cart | [add-product-to-cart](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/add-product-to-cart/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §5 |
| Step 4: Set shipping address | [set-shipping-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-shipping-address/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §6 |
| Step 5: Set billing address | [set-billing-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-billing-address/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §7 |
| Step 6: Set delivery method | [set-delivery-method](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-delivery-method/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §8 |
| Step 7: Apply coupon | [apply-coupon](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/apply-coupon/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §9 |
| Step 8: Set email on cart (guest) | [set-email-address](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-email-address/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §10 |
| Step 9: Set payment method | [set-payment-method](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/set-payment-method/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §11 |
| Step 10: Place order | [place-order](https://developer.adobe.com/commerce/webapi/graphql/tutorials/checkout/place-order/) | [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md) §12 |

### Schema — Attributes (queries EAV / custom metadata)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Attributes (tổng quan queries + mutations) | [Attributes](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/) | [`schema-attributes.md`](./schema-attributes.md) §2 |
| Danh sách queries | [Attributes queries](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/) | [`schema-attributes.md`](./schema-attributes.md) §3 |
| `attributesForm` | [attributesForm](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-form/) | [`schema-attributes.md`](./schema-attributes.md) §4 |
| `attributesList` | [attributesList](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-list/) | [`schema-attributes.md`](./schema-attributes.md) §5 |
| `attributesMetadata` (deprecated) | [attributesMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/attributes-metadata/) | [`schema-attributes.md`](./schema-attributes.md) §6 |
| `customAttributeMetadata` (deprecated) | [customAttributeMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/custom-attribute-metadata/) | [`schema-attributes.md`](./schema-attributes.md) §7 |
| `customAttributeMetadataV2` | [customAttributeMetadataV2](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/queries/custom-attribute-metadata-v2/) | [`schema-attributes.md`](./schema-attributes.md) §8 |

### Schema — Attributes (mutations `setCustomAttributesOn*`)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Custom attribute mutations (tổng quan, cài PaaS, bảng mutation) | [Custom attribute mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/) | [`schema-attributes.md`](./schema-attributes.md) §9 |
| `setCustomAttributesOnCart` | [setCustomAttributesOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-cart/) | [`schema-attributes.md`](./schema-attributes.md) §10 |
| `setCustomAttributesOnCartItem` | [setCustomAttributesOnCartItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-cart-item/) | [`schema-attributes.md`](./schema-attributes.md) §11 |
| `setCustomAttributesOnCompany` | [setCustomAttributesOnCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-company/) | [`schema-attributes.md`](./schema-attributes.md) §12 |
| `setCustomAttributesOnCreditMemo` | [setCustomAttributesOnCreditMemo](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-credit-memo/) | [`schema-attributes.md`](./schema-attributes.md) §13 |
| `setCustomAttributesOnCreditMemoItem` | [setCustomAttributesOnCreditMemoItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-credit-memo-item/) | [`schema-attributes.md`](./schema-attributes.md) §14 |
| `setCustomAttributesOnInvoice` | [setCustomAttributesOnInvoice](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-invoice/) | [`schema-attributes.md`](./schema-attributes.md) §15 |
| `setCustomAttributesOnInvoiceItem` | [setCustomAttributesOnInvoiceItem](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-invoice-item/) | [`schema-attributes.md`](./schema-attributes.md) §16 |
| `setCustomAttributesOnNegotiableQuote` | [setCustomAttributesOnNegotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/mutations/set-custom-negotiable-quote/) | [`schema-attributes.md`](./schema-attributes.md) §17 |
| Attribute interfaces (PaaS / SaaS) | [Interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/attributes/interfaces/) | [`schema-attributes.md`](./schema-attributes.md) §18 |

### Schema — Cart (queries)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Cart (tổng quan shopper / sidebar) | [Cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/) | [`schema-cart.md`](./schema-cart.md) §1 |
| Danh sách queries | [Cart queries](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/) | [`schema-cart.md`](./schema-cart.md) §2 |
| `cart` | [cart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/cart/) | [`schema-cart.md`](./schema-cart.md) §3 |
| `pickupLocations` | [pickupLocations](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/queries/pickup-locations/) | [`schema-cart.md`](./schema-cart.md) §4 |

### Schema — Cart (mutations — thêm SP & khuyến mãi)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Mục lục mutations | [Cart mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/) | [`schema-cart.md`](./schema-cart.md) §5 |
| `addProductsToCart` | [addProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-products/) | [`schema-cart.md`](./schema-cart.md) §6 |
| `addSimpleProductsToCart` | [addSimpleProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-simple-products/) | [`schema-cart.md`](./schema-cart.md) §7 |
| `addConfigurableProductsToCart` | [addConfigurableProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-configurable-products/) | [`schema-cart.md`](./schema-cart.md) §8 |
| `addBundleProductsToCart` | [addBundleProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-bundle-products/) | [`schema-cart.md`](./schema-cart.md) §9 |
| `addDownloadableProductsToCart` | [addDownloadableProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-downloadable-products/) | [`schema-cart.md`](./schema-cart.md) §10 |
| `addVirtualProductsToCart` | [addVirtualProductsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/add-virtual-products/) | [`schema-cart.md`](./schema-cart.md) §11 |
| `applyCouponToCart` | [applyCouponToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupon/) | [`schema-cart.md`](./schema-cart.md) §12 |
| `applyCouponsToCart` | [applyCouponsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-coupons/) | [`schema-cart.md`](./schema-cart.md) §13 |
| `applyGiftCardToCart` | [applyGiftCardToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-giftcard/) | [`schema-cart.md`](./schema-cart.md) §14 |
| `applyRewardPointsToCart` | [applyRewardPointsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-reward-points/) | [`schema-cart.md`](./schema-cart.md) §15 |

### Schema — Cart (mutations — gỡ dòng/mã, redeem, đặt hàng, giỏ, estimate)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| `removeItemFromCart` | [removeItemFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-item/) | [`schema-cart.md`](./schema-cart.md) §16 |
| `removeGiftCardFromCart` | [removeGiftCardFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-giftcard/) | [`schema-cart.md`](./schema-cart.md) §17 |
| `removeCouponsFromCart` | [removeCouponsFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupons/) | [`schema-cart.md`](./schema-cart.md) §18 |
| `removeCouponFromCart` | [removeCouponFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-coupon/) | [`schema-cart.md`](./schema-cart.md) §19 |
| `redeemGiftCardBalanceAsStoreCredit` | [redeemGiftCardBalanceAsStoreCredit](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/redeem-giftcard-balance/) | [`schema-cart.md`](./schema-cart.md) §20 |
| `placeOrder` | [placeOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/place-order/) | [`schema-cart.md`](./schema-cart.md) §21 |
| `mergeCarts` | [mergeCarts](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/merge/) | [`schema-cart.md`](./schema-cart.md) §22 |
| `estimateTotals` | [estimateTotals](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-totals/) | [`schema-cart.md`](./schema-cart.md) §23 |
| `estimateShippingMethods` | [estimateShippingMethods](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/estimate-shipping-methods/) | [`schema-cart.md`](./schema-cart.md) §24 |
| `createGuestCart` | [createGuestCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-guest-cart/) | [`schema-cart.md`](./schema-cart.md) §25 |
| `createEmptyCart` | [createEmptyCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/create-empty-cart/) | [`schema-cart.md`](./schema-cart.md) §26 |
| `clearCart` | [clearCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/clear-cart/) | [`schema-cart.md`](./schema-cart.md) §27 |
| `assignCustomerToGuestCart` | [assignCustomerToGuestCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/assign-customer-to-guest-cart/) | [`schema-cart.md`](./schema-cart.md) §28 |
| `applyStoreCreditToCart` | [applyStoreCreditToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/apply-store-credit/) | [`schema-cart.md`](./schema-cart.md) §29 |

### Schema — Cart (mutations — chỉnh dòng, địa chỉ, ship, thanh toán, guest email, quà, gỡ reward/credit)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| `updateCartItems` | [updateCartItems](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/update-items/) | [`schema-cart.md`](./schema-cart.md) §30 |
| `setShippingMethodsOnCart` | [setShippingMethodsOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-method/) | [`schema-cart.md`](./schema-cart.md) §31 |
| `setShippingAddressesOnCart` | [setShippingAddressesOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-shipping-address/) | [`schema-cart.md`](./schema-cart.md) §32 |
| `setPaymentMethodOnCart` | [setPaymentMethodOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-method/) | [`schema-cart.md`](./schema-cart.md) §33 |
| `setPaymentMethodAndPlaceOrder` | [setPaymentMethodAndPlaceOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-payment-place-order/) | [`schema-cart.md`](./schema-cart.md) §34 |
| `setGuestEmailOnCart` | [setGuestEmailOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-guest-email/) | [`schema-cart.md`](./schema-cart.md) §35 |
| `setGiftOptionsOnCart` | [setGiftOptionsOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-gift-options/) | [`schema-cart.md`](./schema-cart.md) §36 |
| `setBillingAddressOnCart` | [setBillingAddressOnCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/set-billing-address/) | [`schema-cart.md`](./schema-cart.md) §37 |
| `removeStoreCreditFromCart` | [removeStoreCreditFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-store-credit/) | [`schema-cart.md`](./schema-cart.md) §38 |
| `removeRewardPointsFromCart` | [removeRewardPointsFromCart](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/mutations/remove-reward-points/) | [`schema-cart.md`](./schema-cart.md) §39 |

### Schema — Cart (interfaces)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| `CartItemInterface` (implementations) | [Cart — Interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/cart/interfaces/) | [`schema-cart.md`](./schema-cart.md) §40 |

### Schema — Catalog Service, Live Search & Product Recommendations

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Storefront Services (tổng quan) | [Storefront Services](https://developer.adobe.com/commerce/webapi/graphql/schema/storefront-services/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §1 |
| Catalog Service (tổng quan) | [Catalog Service](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §1 |
| `categories` | [categories](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/categories/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §3 |
| `products` | [products](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/products/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §4 |
| `attributeMetadata` | [attributeMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/attribute-metadata/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §5 |
| `productSearch` | [productSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/live-search/queries/product-search/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §6 |
| `refineProduct` | [refineProduct](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/refine-product/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §7 |
| `variants` | [variants](https://developer.adobe.com/commerce/webapi/graphql/schema/catalog-service/queries/product-variants/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §8 |
| `recommendations` | [recommendations](https://developer.adobe.com/commerce/webapi/graphql/schema/product-recommendations/queries/recommendations/) | [`schema-catalog-service.md`](./schema-catalog-service.md) §9 |

### Schema — Checkout (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Checkout (tổng quan) | [Checkout](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/) | [`schema-checkout.md`](./schema-checkout.md) §1 |
| Danh sách queries | [Checkout queries](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/) | [`schema-checkout.md`](./schema-checkout.md) §2 |
| `checkoutAgreements` | [checkoutAgreements](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/agreements/) | [`schema-checkout.md`](./schema-checkout.md) §3 |
| `customerPaymentTokens` | [customerPaymentTokens](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/customer-payment-tokens/) | [`schema-checkout.md`](./schema-checkout.md) §4 |
| `getHostedProUrl` | [getHostedProUrl](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-hosted-pro-url/) | [`schema-checkout.md`](./schema-checkout.md) §5 |
| `getPayflowLinkToken` | [getPayflowLinkToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/queries/get-payflow-link-token/) | [`schema-checkout.md`](./schema-checkout.md) §6 |
| Danh sách checkout mutations | [Checkout mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/) | [`schema-checkout.md`](./schema-checkout.md) §7 |
| `createBraintreeClientToken` | [createBraintreeClientToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-braintree-client-token/) | [`schema-checkout.md`](./schema-checkout.md) §8 |
| `createKlarnaPaymentsSession` | [createKlarnaPaymentsSession](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-klarna-payments-session/) | [`schema-checkout.md`](./schema-checkout.md) §9 |
| `createPayflowProToken` | [createPayflowProToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-payflow-pro-token/) | [`schema-checkout.md`](./schema-checkout.md) §10 |
| `createPaypalExpressToken` | [createPaypalExpressToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/create-paypal-express-token/) | [`schema-checkout.md`](./schema-checkout.md) §11 |
| `deletePaymentToken` | [deletePaymentToken](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/delete-payment-token/) | [`schema-checkout.md`](./schema-checkout.md) §12 |
| `handlePayflowProResponse` | [handlePayflowProResponse](https://developer.adobe.com/commerce/webapi/graphql/schema/checkout/mutations/handle-payflow-pro-response/) | [`schema-checkout.md`](./schema-checkout.md) §13 |

### Schema — Core payment methods

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Core payment methods (tổng quan) | [Core GraphQL payment methods](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §1 |
| Braintree | [Braintree](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §3 |
| Braintree Vault | [Braintree Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/braintree-vault/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §4 |
| Klarna | [Klarna](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/klarna/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §5 |
| PayPal Express Checkout | [PayPal Express Checkout](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/paypal-express-checkout/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §6 |
| Express Checkout for other PayPal solutions | [payflow_express](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-express/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §7 |
| PayPal Payflow Link | [Payflow Link](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-link/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §8 |
| PayPal Payflow Pro | [Payflow Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §9 |
| PayPal Payflow Pro Vault | [Payflow Pro Vault](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro-vault/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §10 |
| PayPal Payments Advanced | [Payments Advanced](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payments-advanced/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §11 |
| PayPal Website Payments Pro Hosted Solution | [Hosted Pro](https://developer.adobe.com/commerce/webapi/graphql/payment-methods/hosted-pro/) | [`schema-payment-methods.md`](./schema-payment-methods.md) §12 |

### Schema — Payment Services extension

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Payment Services extension (tổng quan) | [Payment Services extension](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §1 |
| Workflows (mục lục) | [Workflows](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §2 |
| Checkout workflow | [checkout](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/checkout/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §3 |
| Minicart workflow | [minicart](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/minicart/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §4 |
| Add product to new cart on PDP | [cart-pdp](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/cart-pdp/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §5 |
| Vault a card during checkout | [vault-with-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-with-purchase/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §6 |
| Vault a card without purchase | [vault-without-purchase](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vault-without-purchase/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §7 |
| Checkout with vaulted card | [vaulted-card](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/workflows/vaulted-card/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §8 |
| Payment Services queries (mục lục) | [Payment Services queries](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §9 |
| `getPaymentConfig` | [getPaymentConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-config/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §10 |
| `getPaymentOrder` | [getPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-order/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §11 |
| `getPaymentSDK` | [getPaymentSDK](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-payment-sdk/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §12 |
| `getVaultConfig` | [getVaultConfig](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/queries/get-vault-config/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §13 |
| Payment Services mutations (mục lục) | [Payment Services mutations](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §14 |
| `syncPaymentOrder` | [syncPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/sync-payment-order/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §15 |
| `setCartAsInactive` | [setCartAsInactive](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/set-cart-inactive/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §16 |
| `createVaultCardSetupToken` | [createVaultCardSetupToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-setup-token/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §17 |
| `createVaultCardPaymentToken` | [createVaultCardPaymentToken](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-vault-card-payment-token/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §18 |
| `createPaymentOrder` | [createPaymentOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/create-payment-order/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §19 |
| `completeOrder` | [completeOrder](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/complete-order/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §20 |
| `addProductsToNewCart` | [addProductsToNewCart](https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/mutations/add-products-new-cart/) | [`schema-payment-services-extension.md`](./schema-payment-services-extension.md) §21 |

### Schema — Company (B2B) (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Company (B2B) | [Company (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §1 |
| Company queries (mục lục) | [Company (B2B) queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §2 |
| `company` | [company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/company/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §3 |
| `isCompanyAdminEmailAvailable` | [isCompanyAdminEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-admin-email-available/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §4 |
| `isCompanyEmailAvailable` | [isCompanyEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-email-available/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §5 |
| `isCompanyRoleNameAvailable` | [isCompanyRoleNameAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-role-name-available/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §6 |
| `isCompanyUserEmailAvailable` | [isCompanyUserEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-user-email-available/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §7 |
| Company mutations (mục lục) | [Company (B2B) mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §8 |
| `createCompany` | [createCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §9 |
| `createCompanyRole` | [createCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-role/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §10 |
| `createCompanyTeam` | [createCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-team/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §11 |
| `createCompanyUser` | [createCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-user/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §12 |
| `deleteCompanyRole` | [deleteCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-role/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §13 |
| `deleteCompanyTeam` | [deleteCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-team/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §14 |
| `deleteCompanyUser` | [deleteCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-user/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §15 |
| `updateCompany` | [updateCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §16 |
| `updateCompanyRole` | [updateCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-role/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §17 |
| `updateCompanyStructure` | [updateCompanyStructure](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-structure/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §18 |
| `updateCompanyTeam` | [updateCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-team/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §19 |
| `updateCompanyUser` | [updateCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-user/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §20 |
| `CompanyStructureEntity` (union) | [CompanyStructureEntity](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/unions/structure-entity/) | [`schema-b2b-company.md`](./schema-b2b-company.md) §21 |

### Schema — Negotiable quotes (B2B) (queries + mutations + interfaces + unions)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Negotiable quote (B2B) | [Negotiable quote (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §1 |
| Negotiable quote queries (mục lục) | [Negotiable quote queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §2 |
| `negotiableQuote` | [negotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quote/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §3 |
| `negotiableQuotes` | [negotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/quotes/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §4 |
| `negotiableQuoteTemplates` | [negotiableQuoteTemplates](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/queries/templates/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §5 |
| Negotiable quote mutations (mục lục) | [Negotiable quote mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §6 |
| `updateNegotiableQuoteQuantities` | [updateNegotiableQuoteQuantities](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/update-quantities/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §7 |
| `setQuoteTemplateExpirationDate` | [setQuoteTemplateExpirationDate](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-quote-template-expiration-date/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §8 |
| `setNegotiableQuoteShippingMethods` | [setNegotiableQuoteShippingMethods](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-methods/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §9 |
| `setNegotiableQuoteShippingAddress` | [setNegotiableQuoteShippingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-shipping-address/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §10 |
| `setNegotiableQuotePaymentMethod` | [setNegotiableQuotePaymentMethod](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-payment-method/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §11 |
| `setNegotiableQuoteBillingAddress` | [setNegotiableQuoteBillingAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/set-billing-address/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §12 |
| `sendNegotiableQuoteForReview` | [sendNegotiableQuoteForReview](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/send-for-review/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §13 |
| `requestNegotiableQuote` | [requestNegotiableQuote](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/request/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §14 |
| `removeNegotiableQuoteItems` | [removeNegotiableQuoteItems](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/remove-items/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §15 |
| `placeNegotiableQuoteOrderV2` | [placeNegotiableQuoteOrderV2](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order-v2/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §16 |
| `placeNegotiableQuoteOrder` | [placeNegotiableQuoteOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/place-order/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §17 |
| `deleteNegotiableQuotes` | [deleteNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/delete/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §18 |
| `closeNegotiableQuotes` | [closeNegotiableQuotes](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/mutations/close/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §19 |
| Negotiable quote interfaces | [Negotiable quote interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/interfaces/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §20 |
| Negotiable quote unions | [Negotiable quote unions](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/negotiable-quote/unions/) | [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md) §21 |

### Schema — Purchase orders (B2B) (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Purchase orders (B2B) | [Purchase orders (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §1 |
| Purchase orders queries via `customer` | [Purchase orders (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §2 |
| Purchase order mutations (mục lục) | [Purchase order mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §3 |
| `addPurchaseOrderComment` | [addPurchaseOrderComment](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/add-comment/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §4 |
| `addPurchaseOrderItemsToCart` | [addPurchaseOrderItemsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/add-items-to-cart/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §5 |
| `approvePurchaseOrders` | [approvePurchaseOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/approve/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §6 |
| `cancelPurchaseOrders` | [cancelPurchaseOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/cancel/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §7 |
| `placeOrderForPurchaseOrder` | [placeOrderForPurchaseOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/place-order/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §8 |
| `placePurchaseOrder` | [placePurchaseOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/place-purchase-order/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §9 |
| `rejectPurchaseOrders` | [rejectPurchaseOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order/mutations/reject/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §10 |
| `validatePurchaseOrders` | [validatePurchaseOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/validate/) | [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md) §11 |

### Schema — Purchase order rules (B2B) (queries + mutations + interfaces)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Purchase order rules (B2B) | [Purchase order approval rules (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §1 |
| Purchase order rules queries via `customer` | [Purchase order approval rules (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §2 |
| Purchase order rule queries (mục lục) | [Purchase order approval rules (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §3 |
| Purchase order rule mutations (mục lục) | [Purchase order approval rule (B2B) mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §4 |
| `createPurchaseOrderApprovalRule` | [createPurchaseOrderApprovalRule](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/create/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §5 |
| `deletePurchaseOrderApprovalRule` | [deletePurchaseOrderApprovalRule](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/delete/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §6 |
| `updatePurchaseOrderApprovalRule` | [updatePurchaseOrderApprovalRule](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/update/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §7 |
| `validatePurchaseOrders` | [validatePurchaseOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/mutations/validate/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §8 |
| `PurchaseOrderApprovalRuleConditionInterface` | [PurchaseOrderApprovalRuleConditionInterface attributes and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/interfaces/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §9 |
| Condition implementations (`Amount` / `Quantity`) | [PurchaseOrderApprovalRuleConditionInterface attributes and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/purchase-order-rule/interfaces/) | [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md) §10 |

### Schema — Requisition lists (B2B) (mutations + interfaces)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Requisition lists (B2B) | [Requisition lists (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §1 |
| Requisition list mutations (mục lục) | [Requisition list (B2B) mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §2 |
| `addProductsToRequisitionList` | [addProductsToRequisitionList](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/add-products/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §3 |
| `addRequisitionListItemsToCart` | [addRequisitionListItemsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/add-items-to-cart/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §4 |
| `clearCustomerCart` | [clearCustomerCart](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/clear-customer-cart/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §5 |
| `copyItemsBetweenRequisitionLists` | [copyItemsBetweenRequisitionLists](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/copy-items/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §6 |
| `createRequisitionList` | [createRequisitionLists](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/create/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §7 |
| `deleteRequisitionList` | [deleteRequisitionList](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/delete/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §8 |
| `deleteRequisitionListItems` | [deleteRequisitionListItems](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/delete-items/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §9 |
| `moveItemsBetweenRequisitionLists` | [moveItemsBetweenRequisitionLists](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/move-items/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §10 |
| `updateRequisitionList` | [updateRequisitionList](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/update/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §11 |
| `updateRequisitionListItems` | [updateRequisitionListItems](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/mutations/update-items/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §12 |
| `RequisitionListItemInterface` | [RequisitionListItemInterface attributes and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/interfaces/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §13 |
| Item implementations | [RequisitionListItemInterface attributes and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/requisition-list/interfaces/) | [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md) §14 |

### Schema — Customer (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Customer | [Customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/) | [`schema-customer.md`](./schema-customer.md) §1 |
| Customer queries (mục lục) | [Customer queries](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/) | [`schema-customer.md`](./schema-customer.md) §2 |
| `customer` | [customer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer/) | [`schema-customer.md`](./schema-customer.md) §3 |
| `customerCart` | [customerCart](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/cart/) | [`schema-customer.md`](./schema-customer.md) §4 |
| `customerDownloadableProducts` | [customerDownloadableProducts](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/downloadable-products/) | [`schema-customer.md`](./schema-customer.md) §5 |
| `customerOrders` | [customerOrders](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/orders/) | [`schema-customer.md`](./schema-customer.md) §6 |
| `giftCardAccount` | [giftCardAccount](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/giftcard-account/) | [`schema-customer.md`](./schema-customer.md) §7 |
| `isEmailAvailable` | [isEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/is-email-available/) | [`schema-customer.md`](./schema-customer.md) §8 |
| `customerGroup` | [customerGroup](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-group/) | [`schema-customer.md`](./schema-customer.md) §9 |
| `customerSegments` | [customerSegments](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/queries/customer-segments/) | [`schema-customer.md`](./schema-customer.md) §10 |
| Customer mutations (mục lục) | [Customer mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/) | [`schema-customer.md`](./schema-customer.md) §11 |
| `generateCustomerToken` | [generateCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token/) | [`schema-customer.md`](./schema-customer.md) §12 |
| `exchangeOtpForCustomerToken` | [exchangeOtpForCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-otp-customer-token/) | [`schema-customer.md`](./schema-customer.md) §13 |
| `exchangeExternalCustomerToken` | [exchangeExternalCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/exchange-external-customer-token/) | [`schema-customer.md`](./schema-customer.md) §14 |
| `deleteCustomerAddressV2` | [deleteCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address-v2/) | [`schema-customer.md`](./schema-customer.md) §15 |
| `deleteCustomerAddress` | [deleteCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/delete-address/) | [`schema-customer.md`](./schema-customer.md) §16 |
| `createCustomerV2` | [createCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-v2/) | [`schema-customer.md`](./schema-customer.md) §17 |
| `createCustomerAddress` | [createCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create-address/) | [`schema-customer.md`](./schema-customer.md) §18 |
| `createCustomer` | [createCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/create/) | [`schema-customer.md`](./schema-customer.md) §19 |
| `confirmEmail` | [confirmEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/confirm-email/) | [`schema-customer.md`](./schema-customer.md) §20 |
| `changeCustomerPassword` | [changeCustomerPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/change-password/) | [`schema-customer.md`](./schema-customer.md) §21 |
| `assignCompareListToCustomer` | [assignCompareListToCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/assign-compare-list/) | [`schema-customer.md`](./schema-customer.md) §22 |
| `updateCustomerV2` | [updateCustomerV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-v2/) | [`schema-customer.md`](./schema-customer.md) §23 |
| `updateCustomerEmail` | [updateCustomerEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-email/) | [`schema-customer.md`](./schema-customer.md) §24 |
| `updateCustomerAddressV2` | [updateCustomerAddressV2](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address-v2/) | [`schema-customer.md`](./schema-customer.md) §25 |
| `updateCustomerAddress` | [updateCustomerAddress](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update-address/) | [`schema-customer.md`](./schema-customer.md) §26 |
| `updateCustomer` | [updateCustomer](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/update/) | [`schema-customer.md`](./schema-customer.md) §27 |
| `subscribeEmailToNewsletter` | [subscribeEmailToNewsletter](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/subscribe-email-to-newsletter/) | [`schema-customer.md`](./schema-customer.md) §28 |
| `sendEmailToFriend` | [sendEmailToFriend](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/send-email-to-friend/) | [`schema-customer.md`](./schema-customer.md) §29 |
| `revokeCustomerToken` | [revokeCustomerToken](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/revoke-token/) | [`schema-customer.md`](./schema-customer.md) §30 |
| `resetPassword` | [resetPassword](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/reset-password/) | [`schema-customer.md`](./schema-customer.md) §31 |
| `resendConfirmationEmail` | [resendConfirmationEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/resend-confirmation-email/) | [`schema-customer.md`](./schema-customer.md) §32 |
| `requestPasswordResetEmail` | [requestPasswordResetEmail](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/request-password-reset-email/) | [`schema-customer.md`](./schema-customer.md) §33 |
| `generateCustomerTokenAsAdmin` | [generateCustomerTokenAsAdmin](https://developer.adobe.com/commerce/webapi/graphql/schema/customer/mutations/generate-token-as-admin/) | [`schema-customer.md`](./schema-customer.md) §34 |

### Schema — Gift registry (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Gift registry (tổng quan) | [Gift registry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §1 |
| Gift registry queries (mục lục) | [Gift registry queries](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §2 |
| `giftRegistry` | [giftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/gift-registry/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §3 |
| `giftRegistryTypeSearch` | [giftRegistryTypeSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/type-search/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §4 |
| `giftRegistryTypes` | [giftRegistryTypes](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/types/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §5 |
| `giftRegistryIdSearch` | [giftRegistryIdSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/id-search/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §6 |
| `giftRegistryEmailSearch` | [giftRegistryEmailSearch](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/queries/email-search/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §7 |
| Gift registry mutations (mục lục) | [Gift registry mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §8 |
| `updateGiftRegistryRegistrants` | [updateGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-registrants/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §9 |
| `updateGiftRegistryItems` | [updateGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update-items/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §10 |
| `updateGiftRegistry` | [updateGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/update/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §11 |
| `shareGiftRegistry` | [shareGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/share/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §12 |
| `removeGiftRegistryRegistrants` | [removeGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-registrants/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §13 |
| `removeGiftRegistryItems` | [removeGiftRegistryItems](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove-items/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §14 |
| `removeGiftRegistry` | [removeGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/remove/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §15 |
| `moveCartItemsToGiftRegistry` | [moveCartItemsToGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/move-cart-items/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §16 |
| `createGiftRegistry` | [createGiftRegistry](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/create/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §17 |
| `addGiftRegistryRegistrants` | [addGiftRegistryRegistrants](https://developer.adobe.com/commerce/webapi/graphql/schema/gift-registry/mutations/add-registrants/) | [`schema-gift-registry.md`](./schema-gift-registry.md) §18 |

### Schema — Orders (queries + mutations + interfaces)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Orders (tổng quan) | [Orders](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/) | [`schema-orders.md`](./schema-orders.md) §1 |
| Orders queries (mục lục) | [Order queries](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/queries/) | [`schema-orders.md`](./schema-orders.md) §19 |
| `guestOrder` | [guestOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/queries/guest-order/) | [`schema-orders.md`](./schema-orders.md) §20 |
| `guestOrderByToken` | [guestOrderByToken](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/queries/guest-order-by-token/) | [`schema-orders.md`](./schema-orders.md) §21 |
| Orders mutations (mục lục) | [Order mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/) | [`schema-orders.md`](./schema-orders.md) §2 |
| `requestReturn` | [requestReturn](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/request-return/) | [`schema-orders.md`](./schema-orders.md) §3 |
| `requestGuestReturn` | [requestGuestReturn](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/request-guest-return/) | [`schema-orders.md`](./schema-orders.md) §4 |
| `requestGuestOrderCancel` | [requestGuestOrderCancel](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/request-guest-order-cancel/) | [`schema-orders.md`](./schema-orders.md) §5 |
| `reorderItems` | [reorderItems](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/reorder-items/) | [`schema-orders.md`](./schema-orders.md) §6 |
| `removeReturnTracking` | [removeReturnTracking](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/remove-return-tracking/) | [`schema-orders.md`](./schema-orders.md) §7 |
| `confirmReturn` | [confirmReturn](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/confirm-return/) | [`schema-orders.md`](./schema-orders.md) §8 |
| `confirmCancelOrder` | [confirmCancelOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/confirm-cancel-order/) | [`schema-orders.md`](./schema-orders.md) §9 |
| `cancelOrder` | [cancelOrder](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/cancel-order/) | [`schema-orders.md`](./schema-orders.md) §10 |
| `addReturnTracking` | [addReturnTracking](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/add-return-tracking/) | [`schema-orders.md`](./schema-orders.md) §11 |
| `addReturnComment` | [addReturnComment](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/mutations/add-return-comment/) | [`schema-orders.md`](./schema-orders.md) §12 |
| Orders interfaces (mục lục) | [Order interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/interfaces/) | [`schema-orders.md`](./schema-orders.md) §13 |
| `ShipmentItemInterface` | [ShipmentItemInterface](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/interfaces/shipment-item/) | [`schema-orders.md`](./schema-orders.md) §14 |
| `OrderItemInterface` | [OrderItemInterface](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/interfaces/order-item/) | [`schema-orders.md`](./schema-orders.md) §15 |
| `InvoiceItemInterface` | [InvoiceItemInterface](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/interfaces/invoice-item/) | [`schema-orders.md`](./schema-orders.md) §16 |
| `CreditMemoItemInterface` | [CreditMemoItemInterface](https://developer.adobe.com/commerce/webapi/graphql/schema/orders/interfaces/credit-memo-item/) | [`schema-orders.md`](./schema-orders.md) §17 |

### Schema — Products (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Products (tổng quan) | [Products](https://developer.adobe.com/commerce/webapi/graphql/schema/products/) | [`schema-products.md`](./schema-products.md) §1 |
| Product queries (mục lục) | [Product queries](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/) | [`schema-products.md`](./schema-products.md) §2 |
| `products` | [products](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/products/) | [`schema-products.md`](./schema-products.md) §3 |
| `compareList` | [compareList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/compare-list/) | [`schema-products.md`](./schema-products.md) §4 |
| `categoryList` | [categoryList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/category-list/) | [`schema-products.md`](./schema-products.md) §5 |
| `category` | [category](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/category/) | [`schema-products.md`](./schema-products.md) §6 |
| `categories` | [categories](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/categories/) | [`schema-products.md`](./schema-products.md) §7 |
| `route` | [route](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/route/) | [`schema-products.md`](./schema-products.md) §8 |
| `urlResolver` | [urlResolver](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/url-resolver/) | [`schema-products.md`](./schema-products.md) §9 |
| `productReviewRatingsMetadata` | [productReviewRatingsMetadata](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/product-review-ratings-metadata/) | [`schema-products.md`](./schema-products.md) §10 |
| `isSubscribedProductAlertStock` | [isSubscribedProductAlertStock](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/is-subscribed-product-alert-stock/) | [`schema-products.md`](./schema-products.md) §11 |
| `isSubscribedProductAlertPrice` | [isSubscribedProductAlertPrice](https://developer.adobe.com/commerce/webapi/graphql/schema/products/queries/is-subscribed-product-alert-price/) | [`schema-products.md`](./schema-products.md) §12 |

### Schema — Products (mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Product mutations (mục lục) | [Product mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/) | [`schema-products.md`](./schema-products.md) §13 |
| `unsubscribeProductAlertStockAll` | [unsubscribeProductAlertStockAll](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/unsubscribe-product-alert-stock-all/) | [`schema-products.md`](./schema-products.md) §14 |
| `unsubscribeProductAlertStock` | [unsubscribeProductAlertStock](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/unsubscribe-product-alert-stock/) | [`schema-products.md`](./schema-products.md) §15 |
| `unsubscribeProductAlertPriceAll` | [unsubscribeProductAlertPriceAll](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/unsubscribe-product-alert-price-all/) | [`schema-products.md`](./schema-products.md) §16 |
| `unsubscribeProductAlertPrice` | [unsubscribeProductAlertPrice](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/unsubscribe-product-alert-price/) | [`schema-products.md`](./schema-products.md) §17 |
| `subscribeProductAlertStock` | [subscribeProductAlertStock](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/subscribe-product-alert-stock/) | [`schema-products.md`](./schema-products.md) §18 |
| `subscribeProductAlertPrice` | [subscribeProductAlertPrice](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/subscribe-product-alert-price/) | [`schema-products.md`](./schema-products.md) §19 |
| `removeProductsFromCompareList` | [removeProductsFromCompareList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/remove-from-compare-list/) | [`schema-products.md`](./schema-products.md) §20 |
| `deleteCompareList` | [deleteCompareList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/delete-compare-list/) | [`schema-products.md`](./schema-products.md) §21 |
| `createProductReview` | [createProductReview](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/create-review/) | [`schema-products.md`](./schema-products.md) §22 |
| `createCompareList` | [createCompareList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/create-compare-list/) | [`schema-products.md`](./schema-products.md) §23 |
| `addProductsToCompareList` | [addProductsToCompareList](https://developer.adobe.com/commerce/webapi/graphql/schema/products/mutations/add-products-to-compare-list/) | [`schema-products.md`](./schema-products.md) §24 |

### Schema — Store (queries + mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Store (tổng quan) | [Store](https://developer.adobe.com/commerce/webapi/graphql/schema/store/) | [`schema-store.md`](./schema-store.md) §1 |
| Store queries (mục lục) | [Store queries](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/) | [`schema-store.md`](./schema-store.md) §2 |
| `availableStores` | [availableStores](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/available-stores/) | [`schema-store.md`](./schema-store.md) §3 |
| `cmsBlocks` | [cmsBlocks](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/cms-blocks/) | [`schema-store.md`](./schema-store.md) §4 |
| `cmsPage` | [cmsPage](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/cms-page/) | [`schema-store.md`](./schema-store.md) §5 |
| `countries` | [countries](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/countries/) | [`schema-store.md`](./schema-store.md) §6 |
| `country` | [country](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/country/) | [`schema-store.md`](./schema-store.md) §7 |
| `currency` | [currency](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/currency/) | [`schema-store.md`](./schema-store.md) §8 |
| `dynamicBlocks` | [dynamicBlocks](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/dynamic-blocks/) | [`schema-store.md`](./schema-store.md) §9 |
| `recaptchaV3Config` | [recaptchaV3Config](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/recaptcha-v3-config/) | [`schema-store.md`](./schema-store.md) §10 |
| `recaptchaFormConfig` | [recaptchaFormConfig](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/recaptcha-form-config/) | [`schema-store.md`](./schema-store.md) §11 |
| `recaptchaFormConfigs` | [recaptchaFormConfigs](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/recaptcha-form-configs/) | [`schema-store.md`](./schema-store.md) §12 |
| `storeConfig` | [storeConfig](https://developer.adobe.com/commerce/webapi/graphql/schema/store/queries/store-config/) | [`schema-store.md`](./schema-store.md) §13 |
| Store mutations (mục lục) | [Store mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/store/mutations/) | [`schema-store.md`](./schema-store.md) §14 |
| `contactUs` | [contactUs](https://developer.adobe.com/commerce/webapi/graphql/schema/store/mutations/contact-us/) | [`schema-store.md`](./schema-store.md) §15 |

### Schema — Uploads (mutations)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Uploads (tổng quan) | [Upload files to Amazon S3](https://developer.adobe.com/commerce/webapi/graphql/schema/uploads/) | [`schema-uploads.md`](./schema-uploads.md) §1 |
| Upload mutations (mục lục) | [Uploads](https://developer.adobe.com/commerce/webapi/graphql/schema/uploads/) | [`schema-uploads.md`](./schema-uploads.md) §2 |
| `initiateUpload` | [initiateUpload](https://developer.adobe.com/commerce/webapi/graphql/schema/uploads/mutations/initiate-upload/) | [`schema-uploads.md`](./schema-uploads.md) §3 |
| `finishUpload` | [finishUpload](https://developer.adobe.com/commerce/webapi/graphql/schema/uploads/mutations/finish-upload/) | [`schema-uploads.md`](./schema-uploads.md) §4 |

### Schema — Wish list (queries + mutations + interfaces)

| Chủ đề | Adobe (chính thức) | Trong `.spec` |
|--------|-------------------|----------------|
| Wish list (tổng quan) | [Wish list](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/) | [`schema-wishlist.md`](./schema-wishlist.md) §1 |
| Wish list queries (mục lục) | [Wish list queries](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/queries/) | [`schema-wishlist.md`](./schema-wishlist.md) §2 |
| `wishlist` (deprecated) | [wishlist query](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/queries/wishlist/) | [`schema-wishlist.md`](./schema-wishlist.md) §3 |
| Wish list mutations (mục lục) | [Wish list mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/) | [`schema-wishlist.md`](./schema-wishlist.md) §4 |
| `addProductsToWishlist` | [addProductsToWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/add-products/) | [`schema-wishlist.md`](./schema-wishlist.md) §5 |
| `addWishlistItemsToCart` | [addWishlistItemsToCart](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/add-items-to-cart/) | [`schema-wishlist.md`](./schema-wishlist.md) §6 |
| `copyProductsBetweenWishlists` | [copyProductsBetweenWishlists](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/copy-products/) | [`schema-wishlist.md`](./schema-wishlist.md) §7 |
| `clearWishlist` | [clearWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/clear/) | [`schema-wishlist.md`](./schema-wishlist.md) §8 |
| `createWishlist` | [createWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/create/) | [`schema-wishlist.md`](./schema-wishlist.md) §9 |
| `deleteWishlist` | [deleteWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/delete/) | [`schema-wishlist.md`](./schema-wishlist.md) §10 |
| `moveProductsBetweenWishlists` | [moveProductsBetweenWishlists](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/move-products/) | [`schema-wishlist.md`](./schema-wishlist.md) §11 |
| `removeProductsFromWishlist` | [removeProductsFromWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/remove-products/) | [`schema-wishlist.md`](./schema-wishlist.md) §12 |
| `updateProductsInWishlist` | [updateProductsInWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/update-products/) | [`schema-wishlist.md`](./schema-wishlist.md) §13 |
| `updateWishlist` | [updateWishlist](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/mutations/update/) | [`schema-wishlist.md`](./schema-wishlist.md) §14 |
| Wish list interfaces | [Wish list interfaces](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/interfaces/) | [`schema-wishlist.md`](./schema-wishlist.md) §15 |
| `WishlistItemInterface` implementations | [WishlistItemInterface attributes and implementations](https://developer.adobe.com/commerce/webapi/graphql/schema/wishlist/interfaces/wishlist/) | [`schema-wishlist.md`](./schema-wishlist.md) §16 |

---

## Liên kết

- [GraphQL Guide (Adobe)](https://developer.adobe.com/commerce/webapi/graphql/) — cổng tổng
- Schema guide — Cart: [`schema-cart.md`](./schema-cart.md)
- Schema guide — Catalog Service: [`schema-catalog-service.md`](./schema-catalog-service.md)
- Schema guide — Checkout: [`schema-checkout.md`](./schema-checkout.md)
- Schema guide — Core payment methods: [`schema-payment-methods.md`](./schema-payment-methods.md)
- Schema guide — Payment Services extension: [`schema-payment-services-extension.md`](./schema-payment-services-extension.md)
- Schema guide — Company (B2B): [`schema-b2b-company.md`](./schema-b2b-company.md)
- Schema guide — Negotiable quotes (B2B): [`schema-b2b-negotiable-quote.md`](./schema-b2b-negotiable-quote.md)
- Schema guide — Purchase orders (B2B): [`schema-b2b-purchase-order.md`](./schema-b2b-purchase-order.md)
- Schema guide — Purchase order rules (B2B): [`schema-b2b-purchase-order-rule.md`](./schema-b2b-purchase-order-rule.md)
- Schema guide — Requisition lists (B2B): [`schema-b2b-requisition-list.md`](./schema-b2b-requisition-list.md)
- Schema guide — Customer: [`schema-customer.md`](./schema-customer.md)
- Schema guide — Gift registry: [`schema-gift-registry.md`](./schema-gift-registry.md)
- Schema guide — Orders: [`schema-orders.md`](./schema-orders.md)
- Schema guide — Products: [`schema-products.md`](./schema-products.md)
- Schema guide — Store: [`schema-store.md`](./schema-store.md)
- Schema guide — Uploads: [`schema-uploads.md`](./schema-uploads.md)
- Schema guide — Wish list: [`schema-wishlist.md`](./schema-wishlist.md)
- Schema guide — Attributes: [`schema-attributes.md`](./schema-attributes.md)
- Tutorial guide — Checkout: [`schema-tutorial-checkout.md`](./schema-tutorial-checkout.md)
- Release notes (GraphQL): [`release-notes.md`](./release-notes.md)
- Development (tóm tắt Adobe): [`development.md`](./development.md)
- App Server & resolver stateless: [`../graphql-app-server.md`](../graphql-app-server.md)
- REST/SOAP Web API: [`../web-api.md`](../web-api.md)
