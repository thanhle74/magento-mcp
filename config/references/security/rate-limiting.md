# Tham khảo: Rate Limiting & API Security

Nguồn:
- https://developer.adobe.com/commerce/webapi/get-started/rate-limiting (Adobe Commerce 2.4.7+)
- https://developer.adobe.com/commerce/webapi/get-started/api-security/

---

## 0. Tổng quan

Magento cung cấp hai cơ chế bảo vệ API khác nhau:

| Cơ chế | Mục đích | Từ phiên bản |
|---|---|---|
| **Rate Limiting** | Chống carding attack trên payment endpoints | 2.4.7+ |
| **Input Limiting** | Giới hạn kích thước/số lượng input API | 2.4.x |

---

## 1. Rate Limiting (Chống Carding Attack)

### 1.1 Phạm vi áp dụng

Rate limiting chỉ áp dụng cho các endpoint thanh toán:

**REST:**
- `POST /V1/<store_code>/guest-carts/<cart_id>/payment-information`
- `POST /V1/<store_code>/guest-carts/<cart_id>/order`
- `POST /V1/<store_code>/carts/mine/payment-information`
- `POST /V1/<store_code>/carts/mine/order`

**GraphQL:**
- `POST /graphql` (mutation `placeOrder`)

**InstantPurchase module:**
- `magento/module-instant-purchase`

### 1.2 Cấu hình Redis (bắt buộc)

Rate limiting dùng Redis để lưu sliding window log. Phải cấu hình Redis trước:

```bash
bin/magento setup:config:set \
    --backpressure-logger=redis \
    --backpressure-logger-redis-server=127.0.0.1 \
    --backpressure-logger-redis-port=6379 \
    --backpressure-logger-redis-db=3 \
    --backpressure-logger-redis-timeout=2.5 \
    --backpressure-logger-id-prefix=rl_
```

> Dùng DB khác với cache (0), FPC (1), session (2). Khuyến nghị DB 3 cho rate limiting.

Kết quả trong `app/etc/env.php`:

```php
'backpressure' => [
    'logger' => [
        'type' => 'redis',
        'options' => [
            'server' => '127.0.0.1',
            'port' => 6379,
            'db' => '3',
            'timeout' => 2.5,
        ],
        'id-prefix' => 'rl_'
    ]
]
```

### 1.3 Bật và cấu hình Rate Limiting

```bash
# Bật rate limiting
bin/magento config:set sales/backpressure/enabled 1

# Giới hạn guest (theo IP): 50 request/phút
bin/magento config:set sales/backpressure/guest_limit 50

# Giới hạn customer đã đăng nhập: 10 request/phút
bin/magento config:set sales/backpressure/limit 10

# Thời gian window (giây): 60, 3600, hoặc 86400
bin/magento config:set sales/backpressure/period 60

bin/magento cache:clean config
```

Hoặc qua Admin: **Stores > Configuration > Sales > Sales > Rate Limiting**

### 1.4 Kiểm tra cấu hình

```bash
bin/magento config:show | grep backpressure
```

### 1.5 HTTP Response khi bị rate limit

**REST:** HTTP 429 Too Many Requests

```json
{"message": "Too Many Requests", "trace": null}
```

**GraphQL:** HTTP 200 với error trong body

```json
{
    "errors": [{
        "message": "Too Many Requests",
        "extensions": {"category": "graphql-too-many-requests"},
        "path": ["placeOrder"]
    }],
    "data": {"placeOrder": null}
}
```

### 1.6 Lưu ý quan trọng

- Nếu Redis chưa cấu hình nhưng rate limiting đã bật → rate limiting **không áp dụng** và log lỗi vào `var/log/system.log`:
  ```
  Backpressure sliding window not applied. Invalid request logger type:
  ```
- Guest được identify bằng **IP address**; customer đăng nhập bằng **user ID**
- Timeout = `period × 3` (ví dụ: period=60 → timeout=180 giây)

---

## 2. Input Limiting (Giới hạn kích thước input)

### 2.1 Các giới hạn có sẵn

| Giới hạn | Mặc định | Config path |
|---|---|---|
| Array input (sync REST) | 20 items | `webapi/validation/complex_array_limit` |
| Array input (async REST) | 5,000 items | — |
| Max page size | 300 | `webapi/validation/maximum_page_size` |
| Default page size | 20 | `webapi/validation/default_page_size` |

### 2.2 Bật Input Limiting

```bash
# REST
bin/magento config:set webapi/validation/input_limit_enabled 1

# GraphQL
bin/magento config:set graphql/validation/input_limit_enabled 1
```

Hoặc Admin: **Stores > Configuration > Services > Web API Limits / GraphQL Input Limits**

### 2.3 Giới hạn per-endpoint trong `webapi.xml`

```xml
<route url="/V1/some-custom-route" method="POST">
    <service class="Vendor\Module\Api\EntityRepositoryInterface" method="save"/>
    <resources>
        <resource ref="Vendor_Entity::entities" />
    </resources>
    <data input-array-size-limit="5" />
</route>
```

### 2.4 Cấu hình global trong `env.php`

```php
'webapi' => [
    'sync' => [
        'default_input_array_size_limit' => 20,
    ],
    'async' => [
        'default_input_array_size_limit' => 5000,
    ],
]
```

---

## 3. DDoS Protection — Infrastructure Level

Rate limiting của Magento chỉ bảo vệ payment endpoints. Bảo vệ DDoS toàn diện cần ở infrastructure level:

### 3.1 Nginx rate limiting

```nginx
# Trong nginx.conf hoặc site config
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /rest/ {
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;
}

location /graphql {
    limit_req zone=api burst=50 nodelay;
    limit_req_status 429;
}
```

### 3.2 Varnish / CDN

- Dùng Fastly, Cloudflare, hoặc AWS WAF để filter traffic trước khi đến Magento
- Fastly có module riêng cho Magento: `fastly/fastly-magento2` với rate limiting config

### 3.3 Checklist bảo vệ

- [ ] Rate limiting bật cho payment endpoints (Magento built-in)
- [ ] Input limiting bật cho REST/GraphQL
- [ ] Nginx `limit_req` cho `/rest/` và `/graphql`
- [ ] CDN/WAF ở tầng trước (Fastly/Cloudflare)
- [ ] Admin path đổi khỏi `/admin` mặc định
- [ ] IP whitelist cho Admin nếu có thể

---

## 4. Verify steps

```bash
# Kiểm tra rate limiting config
bin/magento config:show | grep backpressure

# Test rate limiting (cần Redis đã cấu hình)
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST <BASE_URL>/rest/V1/guest-carts/<cart_id>/order \
    -H "Content-Type: application/json" \
    -d '{"paymentMethod":{"method":"checkmo"}}'
done
# Sau 10 request sẽ thấy 429

# Kiểm tra log nếu Redis chưa cấu hình
tail -f var/log/system.log | grep backpressure
```

---

## Liên kết

- Redis: xem [../infrastructure/redis.md](../infrastructure/redis.md)
- Security Best Practices: xem [security-best-practices.md](./security-best-practices.md)
- CSP: xem [csp.md](./csp.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
