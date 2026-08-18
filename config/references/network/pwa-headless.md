# Tham khảo: PWA/Headless Commerce

Nguồn:
- https://developer.adobe.com/commerce/pwa-studio/tutorials/setup-storefront/
- https://developer.adobe.com/commerce/webapi/graphql/
- https://fooman.com/blog/magento-2-graphql-getting-off-cors.html
- https://mgt-commerce.com/tutorial/how-to-install-pwa-studio-in-magento-2-4/

---

## 0. Tổng quan

Headless Commerce tách frontend khỏi Magento backend. Frontend (React, Vue, Next.js...) giao tiếp với Magento qua GraphQL API.

**Các approach phổ biến:**

| Approach | Stack | Status |
|---|---|---|
| PWA Studio (Venia) | React + GraphQL | Maintenance mode từ 2024 |
| Vue Storefront | Vue.js + GraphQL | Active |
| Next.js Commerce | Next.js + GraphQL | Active |
| Custom headless | Bất kỳ framework + GraphQL | Active |

> **Lưu ý:** Adobe đã chuyển PWA Studio sang maintenance mode năm 2024. Dự án mới nên cân nhắc Vue Storefront hoặc custom headless thay vì PWA Studio.

---

## 1. GraphQL Coverage cho Headless

Magento GraphQL hỗ trợ đầy đủ các use case storefront:

### Catalog
- `products` — search, filter, sort
- `categories` — navigation tree
- `productDetail` — product page

### Cart & Checkout
- `createEmptyCart` — tạo cart
- `addProductsToCart` — thêm sản phẩm
- `setShippingAddressesOnCart` — địa chỉ giao hàng
- `setPaymentMethodOnCart` — phương thức thanh toán
- `placeOrder` — đặt hàng

### Customer
- `createCustomer` — đăng ký
- `generateCustomerToken` — đăng nhập
- `customer` — thông tin customer
- `customerOrders` — lịch sử đơn hàng

### CMS
- `cmsPage` — CMS page
- `cmsBlocks` — CMS blocks

---

## 2. CORS Configuration

Khi frontend chạy trên domain khác với Magento backend, cần cấu hình CORS.

### Cách 1: Nginx (khuyến nghị)

```nginx
# Trong server block của Magento
location /graphql {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://your-storefront.example.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Store, Currency' always;
    add_header 'Access-Control-Max-Age' 86400 always;

    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://your-storefront.example.com';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Store, Currency';
        add_header 'Content-Length' 0;
        add_header 'Content-Type' 'text/plain';
        return 204;
    }

    # Proxy to PHP-FPM
    fastcgi_pass ...;
}
```

### Cách 2: Plugin trên GraphQL (nếu không control Nginx)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Plugin\GraphQl;

use Magento\Framework\App\FrontControllerInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;

class CorsPlugin
{
    public function afterDispatch(
        FrontControllerInterface $subject,
        ResponseInterface $response,
        RequestInterface $request
    ): ResponseInterface {
        if ($request->getPathInfo() === '/graphql') {
            $response->setHeader('Access-Control-Allow-Origin', 'https://your-storefront.example.com', true);
            $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS', true);
            $response->setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Store, Currency', true);
        }
        return $response;
    }
}
```

### Headers quan trọng cho Magento GraphQL

| Header | Mục đích |
|---|---|
| `Authorization: Bearer <token>` | Customer authentication |
| `Store: <store_code>` | Chọn store view |
| `Currency: USD` | Chọn currency |
| `Content-Type: application/json` | Bắt buộc |

---

## 3. Authentication trong Headless

### Guest (không cần token)

```graphql
mutation {
    createEmptyCart
}
```

### Customer Token

```graphql
mutation {
    generateCustomerToken(email: "user@example.com", password: "password") {
        token
    }
}
```

Dùng token trong header: `Authorization: Bearer <token>`

### Token Expiry

Mặc định customer token không expire. Cấu hình trong Admin:
**Stores > Configuration > Services > OAuth > Access Token Expiration**

---

## 4. Store Switching trong Headless

```graphql
# Header: Store: en_us
{
    storeConfig {
        store_code
        store_name
        base_currency_code
        locale
    }
}
```

---

## 5. Custom GraphQL cho Headless

Khi cần expose data custom qua GraphQL cho headless storefront:

```graphql
# schema.graphqls
type Query {
    vendorCustomData(id: Int!): VendorCustomData @resolver(class: "Vendor\\Module\\Model\\Resolver\\CustomData")
}

type VendorCustomData {
    id: Int
    title: String
    content: String
}
```

Xem chi tiết: [graphql/development.md](./graphql/development.md)

---

## 6. Performance cho Headless

### GraphQL Caching

Magento hỗ trợ Varnish/FPC cho GraphQL queries:

```graphql
# Query có thể cache (không cần auth)
{
    products(search: "shirt") {
        items { name sku price { regularPrice { amount { value } } } }
    }
}
```

Queries với `Authorization` header không được cache.

### Persisted Queries (APQ)

Giảm payload size bằng cách hash query:

```bash
# Client gửi hash thay vì full query
POST /graphql
{"extensions": {"persistedQuery": {"version": 1, "sha256Hash": "abc123..."}}}
```

---

## 7. Lưu ý quan trọng

- **PWA Studio maintenance mode**: Adobe không phát triển tính năng mới từ 2024, chỉ security fixes
- **GraphQL App Server**: Magento 2.4.7+ có stateless GraphQL App Server cho performance tốt hơn — xem [graphql-app-server.md](./graphql-app-server.md)
- **CORS**: Luôn whitelist cụ thể domain, không dùng `*` trên production
- **Rate Limiting**: Áp dụng rate limiting cho `/graphql` endpoint — xem [../security/rate-limiting.md](../security/rate-limiting.md)
- **CSP**: Headless frontend cần cấu hình CSP riêng — xem [../security/csp.md](../security/csp.md)

---

## Liên kết

- GraphQL Development: xem [graphql/development.md](./graphql/development.md)
- GraphQL App Server: xem [graphql-app-server.md](./graphql-app-server.md)
- Rate Limiting: xem [../security/rate-limiting.md](../security/rate-limiting.md)
- CSP: xem [../security/csp.md](../security/csp.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
