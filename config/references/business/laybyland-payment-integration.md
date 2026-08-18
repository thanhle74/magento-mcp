# Tham khảo: Tích hợp Payment Method mới vào Laybyland

Tài liệu này ghi lại các pattern và gotchas đặc thù của codebase Laybyland khi thêm một payment method mới (không phải layby). Rút ra từ quá trình tích hợp PaySquad.

---

## 1. Đặt tên method code

**Không đặt method code bắt đầu bằng `layby`.**

Toàn bộ hệ thống Layby dùng `strpos($code, 'layby')` để nhận diện layby methods. Nếu method code chứa `layby` (kể cả `laybyland_`), nó sẽ bị filter sai ở nhiều chỗ.

```
✅ paysquad
✅ afterpay_new
❌ laybyland_paysquad   ← chứa 'layby' → bị nhận nhầm
❌ layby_external       ← chứa 'layby' → bị nhận nhầm
```

---

## 2. Các observer/class cần whitelist khi thêm payment method mới

Khi thêm payment method không phải layby, cần kiểm tra và whitelist ở các chỗ sau:

### 2a. `PaymentMethodAvailable` observer
**File:** `app/code/Laybyland/Layby/Observer/PaymentCombine/PaymentMethodAvailable.php`

Khi `useLaybyProcess = true`, observer này block tất cả method không có prefix `layby`. Method mới cần được thêm vào `ALWAYS_AVAILABLE_METHODS`:

```php
private const ALWAYS_AVAILABLE_METHODS = [
    'paysquad',
    // thêm method mới ở đây
];

public function execute(Observer $observer)
{
    $code = $observer->getEvent()->getMethodInstance()->getCode();
    if (in_array($code, self::ALWAYS_AVAILABLE_METHODS, true)) {
        return;
    }
    // ... filter logic
}
```

### 2b. `QuoteSubmitSuccessObserver`
**File:** `app/code/Laybyland/Layby/Observer/QuoteSubmitSuccessObserver.php`

Observer này cancel order nếu payment method là layby nhưng không có `layby_order` trong registry. Nếu method code chứa `layby`, nó sẽ bị cancel.

Với method code không chứa `layby` (ví dụ `paysquad`), observer này không ảnh hưởng — `isLaybyMethod()` trả về `false`.

### 2c. `BnplExclusion\Observer\PlaceOrder`
**File:** `app/code/Laybyland/BnplExclusion/Observer/PlaceOrder.php`

Block non-layby methods khi cart có BNPL-excluded items. Method mới cần được whitelist:

```php
$currentPayment = $this->checkoutSession->getQuote()->getPayment()->getMethod();
if (strpos($currentPayment, \Laybyland\Layby\Helper\Data::LAYBY_PREFIX) !== false
    || $currentPayment === 'paysquad'  // ← thêm dòng này
) {
    return;
}
```

### 2d. `LaybyCheckoutConfigProvider`
**File:** `app/code/Laybyland/Checkout/Model/LaybyCheckoutConfigProvider.php`

Phân loại methods vào `layby` hoặc `buyNow` group dựa trên `strpos($code, 'layby')`. Method mới không có prefix `layby` sẽ tự động vào `buyNow` — không cần sửa.

---

## 3. Checkout JS — `Laybyland_Checkout` override payment list

`app/code/Laybyland/Checkout/view/frontend/requirejs-config.js` override:
```js
"Magento_Checkout/js/view/payment/list": "Laybyland_Checkout/js/view/payment/list"
```

Custom list chia methods thành 2 groups hiển thị riêng biệt:
- `layby-payment-methods` — methods có prefix `layby`
- `buynow-payment-methods` — tất cả còn lại

Method mới (không có prefix `layby`) sẽ tự động hiển thị trong `buyNow` group. Không cần sửa gì thêm.

---

## 4. Đăng ký JS renderer đúng cách

Codebase Laybyland dùng Mageplaza OSC. Cần tạo **cả 2** layout files:

```
view/frontend/layout/checkout_index_index.xml        ← standard checkout
view/frontend/layout/onestepcheckout_index_index.xml ← Mageplaza OSC
```

Nội dung giống nhau. Mageplaza OSC dùng `<update handle="checkout_index_index"/>` nên cả 2 đều được load, nhưng cần file riêng để đảm bảo.

File JS phải có 2 tầng:
```
view/frontend/web/js/view/payment/
├── method-renderer.js          ← renderer list (gọi rendererList.push)
└── method-renderer/
    └── {method_code}.js        ← actual renderer (extend default)
```

**Không dùng `requirejs-config.js` alias** để map `method-renderer` → actual renderer.

---

## 5. Async payment — `payment_action` và Invoice flow

Với payment method async (redirect sang external, nhận webhook):

```xml
<!-- etc/config.xml -->
<payment_action>authorize</payment_action>  <!-- KHÔNG phải authorize_capture -->
<order_status>pending_payment</order_status>
```

`authorize_capture` → Magento tự tạo Invoice ngay → webhook đến thấy đã có Invoice → skip → contributions không được lưu.

Flow đúng:
1. Place order → `authorize` command → order `pending_payment`, không có Invoice
2. Redirect customer đến external payment page
3. Webhook `succeeded` → lưu contributions → tạo Invoice → order `processing`

---

## 6. `AsyncOrder` module và after-plugin

`Magento\AsyncOrder` wrap `PaymentInformationManagementInterface`. After-plugin trên interface này **không được gọi** trong async flow.

Nếu cần set session data sau khi place order (ví dụ: redirect URL), set trực tiếp trong `ResponseHandler` thay vì dùng after-plugin:

```php
// Gateway/Response/CreateHandler.php
$this->checkoutSession->setData('my_redirect_url', $redirectUrl);
```

---

## 7. Encrypted config — không dùng `config:set` CLI

`php bin/magento config:set` lưu plain text dù field có `backend_model="Magento\Config\Model\Config\Backend\Encrypted"`.

**Luôn set encrypted fields qua Admin UI** hoặc dùng script PHP với `EncryptorInterface::encrypt()`.

Trong `Config.php`, handle cả 2 trường hợp (plain text từ CLI và encrypted từ Admin):

```php
public function getApiSecretKey(): string
{
    $value = $this->scopeConfig->getValue(self::XML_PATH_API_SECRET_KEY, ...);
    if ($value === '') return '';
    if (!preg_match('/^\d+:\d+:/', $value)) {
        return $value; // plain text — đã được set qua CLI
    }
    return $this->encryptor->decrypt($value);
}
```

---

## 8. Static content deploy sau khi sửa JS

Sau khi sửa JS file, phải xóa static files và redeploy để tránh SRI hash mismatch:

```bash
rm -rf pub/static/frontend pub/static/_cache
php bin/magento setup:static-content:deploy -f en_AU en_US -a frontend
php bin/magento cache:flush
```

Chỉ flush cache mà không xóa static files → browser block JS vì hash cũ không khớp nội dung mới.

---

## 9. Webhook URL với subdirectory

Site Laybyland AU chạy tại `/au/` subdirectory. Webhook URL phải include subdirectory:

```
✅ https://webhook.thanhaloha.io.vn/au/paysquad/webhook/receive
❌ https://webhook.thanhaloha.io.vn/paysquad/webhook/receive
```

Dùng `$this->urlBuilder->getUrl('paysquad/webhook/receive')` để tự động build đúng URL theo store config.

---

## 10. DB table naming — giữ tên cũ khi rename method code

Nếu đổi method code sau khi deploy (ví dụ `laybyland_paysquad` → `paysquad`):
- Đổi tên trong PHP/XML/JS: `sed -i 's/laybyland_paysquad/paysquad/g'`
- Đổi config paths trong DB: `UPDATE core_config_data SET path = REPLACE(path, 'payment/laybyland_paysquad/', 'payment/paysquad/')`
- **Giữ nguyên tên table trong DB** và ResourceModel `_init()` — không rename table đã tồn tại

```php
// ✅ ĐÚNG: giữ tên table gốc
$this->_init('laybyland_paysquad_webhook_log', 'log_id');

// ❌ SAI: đổi tên table → table not found
$this->_init('paysquad_webhook_log', 'log_id');
```
