# Shipping Carrier Pattern

> Áp dụng khi tạo custom shipping carrier kế thừa `Magento\Shipping\Model\Carrier\AbstractCarrier`.

---

## Constructor (Magento 2.4.8)

`AbstractCarrier` yêu cầu đúng 3 dependency sau — không suy đoán, đối chiếu trực tiếp với core:

```php
public function __construct(
    \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
    \Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory $rateErrorFactory,
    \Psr\Log\LoggerInterface $logger,
    // ... dependency riêng của module
) {
    parent::__construct($scopeConfig, $rateErrorFactory, $logger);
}
```

---

## collectRates

- Trả `false` khi carrier không áp dụng (inactive, không có item hợp lệ, v.v.)
- Chỉ append method khi đủ điều kiện nghiệp vụ
- Nếu method chỉ áp dụng subset sản phẩm: phải có guard rõ ràng, không ảnh hưởng carrier khác
- Không gọi `checkoutSession->getQuote()` bên trong `collectRates()` để tránh vòng lặp recollect quote; ưu tiên dùng dữ liệu từ `RateRequest`

```php
public function collectRates(RateRequest $request): bool|\Magento\Shipping\Model\Rate\Result
{
    if (!$this->getConfigFlag('active')) {
        return false;
    }

    // Guard: kiểm tra điều kiện nghiệp vụ
    $applicableItems = $this->getApplicableItems($request->getAllItems());
    if (empty($applicableItems)) {
        return false;
    }

    $result = $this->rateResultFactory->create();
    $method = $this->rateMethodFactory->create();

    $method->setCarrier($this->_code);
    $method->setCarrierTitle($this->getConfigData('title'));
    $method->setMethod($this->_code);
    $method->setMethodTitle($this->getConfigData('name'));
    $method->setPrice($this->calculatePrice($applicableItems));
    $method->setCost($method->getPrice());

    $result->append($method);
    return $result;
}
```

## RateRequest & RateResult (flow chuẩn)

- `RateRequest` là input chuẩn cho carrier tính phí (`items`, `dest`, `package weight/value/qty`).
- `RateResult` là output chứa danh sách method hợp lệ (`Method`) hoặc lỗi (`Error`).
- Nếu không áp dụng, return `false`; nếu có áp dụng thì return `RateResult`.

Nguồn gốc:
- https://developer.adobe.com/commerce/php/module-reference/module-shipping/
- https://magento.stackexchange.com/questions/340048/how-to-properly-get-current-quote-in-carrier-collect-rates-function

## Free Shipping integration

- Free shipping có thể bật ở Delivery Methods và kết hợp Cart Price Rule.
- Trong custom carrier/table rate, cần xử lý item `free_shipping` để tránh tính phí sai khi rule promotion đang active.
- Logic chuẩn là tách `freeQty`/`freeWeight` và điều chỉnh package trước khi tra bảng phí.

Nguồn gốc:
- https://magefan.com/blog/configure-free-shipping-method-in-magento-2
- https://raw.githubusercontent.com/magento/magento2/2.4-develop/app/code/Magento/OfflineShipping/Model/Carrier/Tablerate.php

## Table Rates essentials

- Bản core dùng `condition_name` với 3 mode:
  - `package_weight` (Weight vs Destination)
  - `package_value_with_discount` (Price vs Destination)
  - `package_qty` (#Items vs Destination)
- Với full-cart free shipping, core vẫn có thể append method giá `0` nếu rate table match.

Nguồn gốc:
- https://raw.githubusercontent.com/magento/magento2/2.4-develop/app/code/Magento/OfflineShipping/Model/Carrier/Tablerate.php

## Anti-pattern và refactor theo constitution

- Một số bài community minh họa plugin lọc shipping trả về sai kiểu hoặc mutate result theo cách dễ gây side-effect.
- Khi viết plugin `afterCollectRates`, luôn trả về đúng kiểu result object; không trả `subject`.
- Không dùng `print_r/var_dump`; log qua `Psr\Log\LoggerInterface`.

Nguồn gốc:
- https://webkul.com/blog/restrict-custom-shipping-methods-magento2/ — đã refactor theo constitution

---

## Config chuẩn (`etc/config.xml`)

```xml
<carriers>
    <{carrier_code}>
        <active>0</active>
        <title>My Carrier</title>
        <name>My Shipping Method</name>
        <sort_order>10</sort_order>
        <sallowspecific>0</sallowspecific>
        <model>{Vendor}\{Module}\Model\Carrier\{ClassName}</model>
    </{carrier_code}>
</carriers>
```

---

## system.xml chuẩn cho carrier

```xml
<section id="carriers">
    <group id="{carrier_code}" translate="label" type="text" sortOrder="0"
           showInDefault="1" showInWebsite="1" showInStore="1">
        <label>My Carrier</label>
        <field id="active" translate="label" type="select" sortOrder="10"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Enabled</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
        </field>
        <field id="title" translate="label" type="text" sortOrder="20"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Title</label>
        </field>
        <field id="name" translate="label" type="text" sortOrder="30"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Method Name</label>
        </field>
        <field id="sallowspecific" translate="label" type="select" sortOrder="50"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Ship to Applicable Countries</label>
            <frontend_class>shipping-applicable-country</frontend_class>
            <source_model>Magento\Shipping\Model\Config\Source\Allspecificcountries</source_model>
        </field>
        <field id="specificcountry" translate="label" type="multiselect" sortOrder="60"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Ship to Specific Countries</label>
            <source_model>Magento\Directory\Model\Config\Source\Country</source_model>
            <can_be_empty>1</can_be_empty>
        </field>
        <field id="showmethod" translate="label" type="select" sortOrder="70"
               showInDefault="1" showInWebsite="1" showInStore="1">
            <label>Show Method if Not Applicable</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
            <frontend_class>shipping-skip-hide</frontend_class>
        </field>
        <field id="specificerrmsg" translate="label" type="textarea" sortOrder="80"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Displayed Error Message</label>
        </field>
        <field id="sort_order" translate="label" type="text" sortOrder="90"
               showInDefault="1" showInWebsite="1" showInStore="1" canRestore="1">
            <label>Sort Order</label>
        </field>
    </group>
</section>
```

## Tracking support (optional)

Override các method sau nếu carrier hỗ trợ tracking:

```php
public function isTrackingAvailable(): bool
{
    return true;
}

public function getTrackingInfo(string $tracking): \Magento\Shipping\Model\Tracking\Result\Status
{
    $status = $this->trackStatusFactory->create();
    $status->setCarrier($this->_code);
    $status->setCarrierTitle($this->getConfigData('title'));
    $status->setTracking($tracking);
    $status->setStatus(__('In Transit'));
    // Gọi API carrier để lấy thông tin thực tế
    return $status;
}
```

## Verify bắt buộc

1. `bin/magento setup:di:compile` — bắt lỗi constructor DI sớm
2. Checkout flow: method hiển thị đúng khi đủ điều kiện
3. Checkout flow: method ẩn khi tắt config hoặc không có item hợp lệ
4. Place order: `sales_order.shipping_method` lưu đúng `{carrier_code}_{method_code}`

---

## Liên kết

- Blueprint đầy đủ: xem [examples/integration/custom-shipping-carrier-blueprint.md](../../../examples/integration/custom-shipping-carrier-blueprint.md)
- Patterns index: [../../magento-patterns.md](../../magento-patterns.md)
- Config paths: [../ops/config-paths.md](../ops/config-paths.md)
