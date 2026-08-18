# Admin Security trong Magento 2

Nguồn:
- [Admin Security Configuration](https://magefan.com/blog/magento-admin-security) — magefan.com
- [Restrict Admin Panel Access](https://mgt-commerce.com/tutorial/restrict-magento-admin-panel-access/) — mgt-commerce.com
- [API Token Authentication](https://developer.adobe.com/commerce/webapi/get-started/authentication/gs-authentication-oauth/) — developer.adobe.com
- [GraphQL Authorization Tokens](https://developer.adobe.com/commerce/webapi/graphql/usage/authorization-tokens) — developer.adobe.com

---

## 1. Admin Security Configuration

Đường dẫn: `Stores > Configuration > Advanced > Admin > Admin Security`

| Setting | Mô tả | Khuyến nghị |
|---------|-------|-------------|
| Admin Account Sharing | Cho phép nhiều session cùng lúc | Disable |
| Add Secret Key to URLs | Thêm secret key vào admin URL | Enable |
| Login is Case Sensitive | Phân biệt hoa/thường khi login | Enable |
| Admin Session Lifetime (seconds) | Thời gian session timeout | 3600 (1 giờ) |
| Maximum Login Failures to Lockout | Số lần fail trước khi lock | 5-6 |
| Lockout Time (minutes) | Thời gian lock sau khi fail | 30 |
| Password Lifetime (days) | Thời hạn password | 90 |
| Password Reset Protection Type | Cách reset password | By IP and Email |
| Max Number of Password Reset Requests | Số request reset/giờ | 5 |

---

## 2. Đổi Admin URL

Đổi URL admin để tránh brute force:

```php
// app/etc/env.php
return [
    'backend' => [
        'frontName' => 'your_custom_admin_path'
    ],
    // ...
];
```

Hoặc qua CLI:
```bash
bin/magento setup:config:set --backend-frontname="your_custom_path"
```

---

## 3. IP Whitelist (Server Level)

**Nginx:**
```nginx
location /admin {
    allow 192.168.1.0/24;
    allow 10.0.0.1;
    deny all;
}
```

**Apache (.htaccess):**
```apache
<Files "index.php">
    Order Deny,Allow
    Deny from all
    Allow from 192.168.1.0/24
    Allow from 10.0.0.1
</Files>
```

**Cloudflare WAF:** Tạo rule chặn tất cả trừ IP whitelist cho path `/admin*`.

---

## 4. API Token Lifecycle

### Customer Token
- **Endpoint:** `POST /V1/integration/customer/token`
- **Lifetime mặc định:** 1 giờ
- **Config:** `Stores > Configuration > Services > OAuth > Access Token Expiration > Customer Token Lifetime`

```bash
# Lấy customer token
curl -X POST https://store.com/rest/V1/integration/customer/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer@email.com", "password": "password123"}'
```

### Admin Token
- **Endpoint:** `POST /V1/integration/admin/token`
- **Lifetime mặc định:** 4 giờ
- **Config:** `Stores > Configuration > Services > OAuth > Access Token Expiration > Admin Token Lifetime`

```bash
# Lấy admin token
curl -X POST https://store.com/rest/V1/integration/admin/token \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin_password"}'
```

### Integration Token (OAuth 1.0a)
- **Lifetime:** Không hết hạn (cho đến khi revoke thủ công)
- **Flow:** Consumer Key/Secret → Request Token → Access Token
- **Dùng cho:** Third-party integrations, ERP, PIM

---

## 5. OAuth 1.0a Integration Flow

```
1. Tạo Integration trong Admin (System > Extensions > Integrations)
2. Magento generate Consumer Key + Consumer Secret
3. Activate → Magento POST credentials đến Callback URL
4. App dùng Consumer Key để lấy Request Token
   POST /oauth/token/request
5. App exchange Request Token → Access Token
   POST /oauth/token/access
6. Dùng Access Token cho API calls với HMAC-SHA256 signature
```

**Sử dụng Access Token:**
```bash
curl -X GET https://store.com/rest/V1/products/1234 \
  -H "Authorization: OAuth oauth_consumer_key=..., oauth_token=..., oauth_signature=..."
```

---

## 6. Revoke Token

```php
use Magento\Integration\Api\IntegrationServiceInterface;
use Magento\Integration\Api\OauthServiceInterface;

// Revoke integration token
$this->oauthService->deleteIntegrationToken($integrationId);

// Revoke customer token
use Magento\Integration\Api\CustomerTokenServiceInterface;
$this->customerTokenService->revokeCustomerAccessToken($customerId);

// Revoke admin token
use Magento\Integration\Api\AdminTokenServiceInterface;
$this->adminTokenService->revokeAdminAccessToken($adminId);
```

---

## 7. Two-Factor Authentication (2FA)

Xem chi tiết: [two-factor-auth.md](./two-factor-auth.md)

Tóm tắt:
- Bật 2FA cho admin: `Stores > Configuration > Security > 2FA`
- Bypass 2FA cho API testing: `bin/magento security:tfa:google:set-secret admin <secret>`
- Bypass trong integration test: `bin/magento security:tfa:reset admin`

---

## 8. Brute Force Protection (Programmatic)

Magento có built-in lockout sau N lần fail. Để custom:

```php
// Observer trên event admin_user_authenticate_after
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\User\Model\User;

class TrackFailedLogin implements ObserverInterface
{
    public function execute(Observer $observer): void
    {
        /** @var User $user */
        $user = $observer->getEvent()->getUser();
        $exception = $observer->getEvent()->getException();

        if ($exception !== null) {
            // Log failed attempt
            $this->logger->warning('Failed admin login for: ' . $user->getUserName());
        }
    }
}
```

---

## 9. File Permissions (Production)

```bash
# Thư mục cần restrict
find var/ -type d -exec chmod 750 {} \;
find pub/ -type d -exec chmod 750 {} \;
find generated/ -type d -exec chmod 750 {} \;

# File env.php - chỉ owner đọc được
chmod 640 app/etc/env.php

# Không cho phép execute trong pub/media
# Nginx config:
location ~* ^/pub/media/.*\.(php|phtml|pl|py|jsp|asp|sh|cgi)$ {
    deny all;
}
```

---

## 10. Checklist Admin Security

- [ ] Đổi admin URL khỏi `/admin`
- [ ] Bật 2FA cho tất cả admin users
- [ ] Cấu hình session lifetime hợp lý (≤ 3600s)
- [ ] Bật account lockout (5-6 lần fail)
- [ ] Disable admin account sharing
- [ ] IP whitelist ở server level (nếu có IP cố định)
- [ ] Bật secret key trong admin URLs
- [ ] Cấu hình password expiry (90 ngày)
- [ ] Phân quyền user roles theo principle of least privilege
- [ ] Monitor admin activity log

---

## Liên kết

- Two-Factor Auth: xem [two-factor-auth.md](./two-factor-auth.md)
- Rate Limiting: xem [rate-limiting.md](./rate-limiting.md)
- Security Best Practices: xem [security-best-practices.md](./security-best-practices.md)
- ACL: xem [acl.md](./acl.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
