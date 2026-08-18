# Tham khảo: Two-Factor Authentication (2FA)

Nguồn:
- https://developer.adobe.com/commerce/testing/functional-testing-framework/two-factor-authentication
- https://www.rakeshjesadiya.com/magento-use-2fa-provider-specific-endpoints-to-obtain-a-token-error-rest-api-on-admin-rest-api/
- https://magento.stackexchange.com/questions/369334/magento-please-use-the-2fa-provider-specific-endpoints-to-obtain-a-token-error-r

---

## 0. Tổng quan

Từ Magento 2.4+, module `Magento_TwoFactorAuth` được bật mặc định cho Admin. Khi 2FA bật, mọi request lấy admin token qua REST API đều bị chặn nếu không đi qua endpoint 2FA của provider tương ứng.

**Providers được hỗ trợ sẵn:**

| Provider | Code | Endpoint |
|---|---|---|
| Google Authenticator | `google` | `POST /V1/tfa/provider/google/authenticate` |
| Duo Security | `duo_security` | `POST /V1/tfa/provider/duo-security/authenticate` |
| Authy | `authy` | `POST /V1/tfa/provider/authy/authenticate` |
| U2F (YubiKey) | `u2fkey` | `POST /V1/tfa/provider/u2fkey/...` |

---

## 1. Lấy Admin Token khi 2FA bật

### Lỗi thường gặp khi dùng `/V1/integration/admin/token`

```json
{
    "message": "Please use the 2fa provider-specific endpoints to obtain a token.",
    "parameters": {
        "active_providers": ["google"]
    }
}
```

### Cách đúng — dùng endpoint của provider

```bash
# Google Authenticator
POST <BASE_URL>/rest/V1/tfa/provider/google/authenticate
Content-Type: application/json

{
    "username": "admin",
    "password": "AdminPassword123",
    "otp": "123456"
}
```

Response trả về token JWT dùng như Bearer token cho các API call tiếp theo.

---

## 2. Bypass 2FA cho môi trường development/testing

### Cách 1: Disable module (chỉ dùng local/dev)

```bash
bin/magento module:disable Magento_TwoFactorAuth
bin/magento cache:flush
```

> **CẢNH BÁO:** Không bao giờ disable 2FA trên production.

### Cách 2: Dùng config (Magento 2.4.6+)

```bash
bin/magento config:set twofactorauth/general/force_providers ""
```

### Cách 3: Dùng environment variable (CI/CD)

Trong `app/etc/env.php`:

```php
'MFTF_UTILS' => 1,
```

Hoặc set qua CLI cho MFTF testing:

```bash
bin/magento config:set twofactorauth/general/force_providers google
```

Sau đó dùng OTP secret trong test config.

### Cách 4: Dùng module `markshust/magento2-module-disabletwofactorauth`

```bash
composer require markshust/magento2-module-disabletwofactorauth --dev
bin/magento module:enable MarkShust_DisableTwoFactorAuth
bin/magento setup:upgrade
```

> Chỉ dùng trong `require-dev`, không deploy lên production.

---

## 3. Tích hợp 2FA với MFTF (Functional Testing)

Khi chạy MFTF với 2FA bật, cần cấu hình OTP secret trong `.env`:

```dotenv
MAGENTO_ADMIN_2FA_SECRET=<base32-encoded-secret>
```

Và trong `phpunit.xml` hoặc `codeception.yml`:

```xml
<env name="MAGENTO_ADMIN_2FA_SECRET" value="JBSWY3DPEHPK3PXP"/>
```

---

## 4. Tạo Custom 2FA Provider

Nếu cần tích hợp provider 2FA riêng (ví dụ: SMS OTP nội bộ):

### 4.1 Implement `ProviderInterface`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Provider;

use Magento\TwoFactorAuth\Api\ProviderInterface;
use Magento\User\Api\Data\UserInterface;

class SmsProvider implements ProviderInterface
{
    public const CODE = 'vendor_sms';

    public function getCode(): string
    {
        return self::CODE;
    }

    public function getName(): string
    {
        return 'SMS OTP';
    }

    public function getIcon(): string
    {
        return ''; // URL icon hoặc để trống
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function isTrustedDevicesAllowed(): bool
    {
        return false;
    }

    public function isActive(UserInterface $user): bool
    {
        // Kiểm tra user đã cấu hình SMS chưa
        return (bool) $user->getData('vendor_sms_phone');
    }

    public function activate(UserInterface $user): void
    {
        // Logic kích hoạt provider cho user
    }

    public function resetConfiguration(UserInterface $user): void
    {
        // Reset cấu hình provider cho user
        $user->setData('vendor_sms_phone', null);
    }
}
```

### 4.2 Khai báo trong `etc/di.xml`

```xml
<type name="Magento\TwoFactorAuth\Model\ProviderPool">
    <arguments>
        <argument name="providers" xsi:type="array">
            <item name="vendor_sms" xsi:type="object">Vendor\Module\Model\Provider\SmsProvider</item>
        </argument>
    </arguments>
</type>
```

### 4.3 Tạo Authenticator (xử lý verify OTP)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Provider;

use Magento\TwoFactorAuth\Api\AuthenticatorInterface;
use Magento\User\Api\Data\UserInterface;

class SmsAuthenticator implements AuthenticatorInterface
{
    public function __construct(
        private readonly SmsOtpService $smsOtpService
    ) {}

    public function verify(UserInterface $user, array $request): bool
    {
        $otp = $request['otp'] ?? '';
        return $this->smsOtpService->verify((int) $user->getId(), $otp);
    }
}
```

---

## 5. Lưu ý quan trọng

- 2FA chỉ áp dụng cho **Admin users**, không áp dụng cho customer token
- Module `Magento_TwoFactorAuth` và các provider trong tài liệu này gắn với **Admin Panel** (`Magento\User` …) — **không** có luồng 2FA built-in cho **customer đăng nhập storefront (FE)**; 2FA cho khách trên website cần **module tùy chỉnh hoặc extension** (Adobe Commerce / Enterprise cũng không thay đổi điểm này cho FE customer)
- Token từ 2FA endpoint có TTL giống admin token thông thường (mặc định 4 giờ)
- Với integration/API automation: dùng **Integration Token** (OAuth) thay vì admin token để tránh vấn đề 2FA
- Integration Token không bị ảnh hưởng bởi 2FA

### Dùng Integration Token thay Admin Token (khuyến nghị cho automation)

```bash
# Tạo Integration trong Admin > System > Integrations
# Sau đó dùng OAuth token thay vì admin token
Authorization: Bearer <integration-access-token>
```

---

## 6. Verify steps

```bash
# Kiểm tra 2FA đang bật
bin/magento module:status Magento_TwoFactorAuth

# Kiểm tra providers đang active
bin/magento config:show twofactorauth/general/force_providers

# Test endpoint
curl -X POST <BASE_URL>/rest/V1/tfa/provider/google/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass","otp":"123456"}'
```

---

## Liên kết

- ACL: xem [acl.md](./acl.md)
- REST API: xem [../network/rest/overview.md](../network/rest/overview.md)
- Security Best Practices: xem [security-best-practices.md](./security-best-practices.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
