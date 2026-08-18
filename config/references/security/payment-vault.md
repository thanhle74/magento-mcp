# Tham khảo: Payment Vault (Lưu thẻ & Tokenization)

Nguồn: https://developer.adobe.com/commerce/php/development/payments-integrations/vault/

---

## 1. Cấu trúc Vault Facade (di.xml)

Vault được coi là một "phương thức thanh toán con" đi kèm với phương thức chính.

```xml
<virtualType name="MyPaymentVaultFacade" type="Magento\Vault\Model\Method\Vault">
    <arguments>
        <argument name="config" xsi:type="object">MyPaymentVaultConfig</argument>
        <argument name="valueHandlerPool" xsi:type="object">MyPaymentVaultValueHandlerPool</argument>
        <argument name="vaultProvider" xsi:type="object">MyPaymentFacade</argument> <!-- Trỏ tới phương thức chính -->
        <argument name="code" xsi:type="string">my_payment_vault</argument>
    </arguments>
</virtualType>
```

---

## 2. Vault Enabler (Lưu Token)

Để kích hoạt tính năng lưu thẻ, bạn cần sử dụng class `VaultEnabler` trong `Request Builder` của phương thức chính.

### Request Builder (Thêm cờ lưu thẻ):
```php
if ($buildSubject['paymentAction'] === 'authorize' && $this->vaultEnabler->isVaultEnabled()) {
    $result['SAVE_FOR_LATER'] = true;
}
```

### Response Handler (Lưu Token nhận được):
Sau khi API ngân hàng trả về token, bạn dùng `VaultEnabler` để lưu vào database.

```php
$token = $this->paymentTokenFactory->create(PaymentTokenInterface::TOKEN_TYPE_CREDIT_CARD);
$token->setGatewayToken($response['TOKEN']);
$token->setPublicHash($this->generateHash($response['TOKEN']));
// ... set thêm info hiển thị (4 số cuối, loại thẻ)
$payment->setExtensionAttributes(
    $payment->getExtensionAttributes()->setVaultPaymentToken($token)
);
```

---

## 3. Cấu hình Flags (config.xml)

```xml
<default>
    <payment>
        <my_payment_vault>
            <active>1</active>
            <model>MyPaymentVaultFacade</model>
            <title>Thẻ đã lưu</title>
            <instant_purchase>1</instant_purchase>
        </my_payment_vault>
    </payment>
</default>
```

---

## 4. Hiển thị ở Checkout (UI Provider)

Bạn cần khai báo `vault-method.js` để hiển thị danh sách thẻ.

```xml
<type name="Magento\Vault\Model\Ui\TokenUiComponentProviderPool">
    <arguments>
        <argument name="componentProviders" xsi:type="array">
            <item name="my_payment_code" xsi:type="string">Vendor\Module\Model\Ui\TokenUiComponentProvider</item>
        </argument>
    </arguments>
</type>
```

---

## 5. Lưu ý về PCI Compliance

- **Tuyệt đối không lưu số thẻ thật.** 
- Vault của Magento chỉ lưu Token và các Metadata (4 số cuối, ngày hết hạn) để phục vụ việc hiển thị.
- Mọi logic thanh toán bằng Token vẫn phải đi qua hệ thống `CommandPool` của Gateway chính.

---

## Liên kết

- Payment Gateway: xem [payment-gateway.md](./payment-gateway.md)
- Architectural Patterns: xem [architectural-patterns.md](./architectural-patterns.md)
