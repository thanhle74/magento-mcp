# Tham khảo: Quote Totals (Phí & Giảm giá tùy chỉnh)

Nguồn: https://developer.adobe.com/commerce/php/development/components/price-adjustments

---

## 1. Khai báo Collector trong etc/sales.xml

Đây là bước đăng ký để Magento biết có một khoản tiền cần tính toán thêm.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Sales:etc/sales.xsd">
    <section name="quote">
        <group name="totals">
            <item name="custom_surcharge" instance="Vendor\Module\Model\Quote\Address\Total\Surcharge" sort_order="450"/>
        </group>
    </section>
</config>
```

---

## 2. Logic tính toán (PHP Collector)

Class phải extend `Magento\Quote\Model\Quote\Address\Total\AbstractTotal`.

```php
namespace Vendor\Module\Model\Quote\Address\Total;

class Surcharge extends \Magento\Quote\Model\Quote\Address\Total\AbstractTotal
{
    public function collect(
        \Magento\Quote\Model\Quote $quote,
        \Magento\Quote\Api\Data\ShippingAssignmentInterface $shippingAssignment,
        \Magento\Quote\Model\Quote\Address\Total $total
    ) {
        parent::collect($quote, $shippingAssignment, $total);

        $surcharge = 10.00; // Giả sử phí cố định 10$

        $total->setTotalAmount('custom_surcharge', $surcharge);
        $total->setBaseTotalAmount('custom_surcharge', $surcharge);
        
        $total->setGrandTotal($total->getGrandTotal() + $surcharge);
        $total->setBaseGrandTotal($total->getBaseGrandTotal() + $surcharge);

        return $this;
    }

    public function fetch(\Magento\Quote\Model\Quote $quote, \Magento\Quote\Model\Quote\Address\Total $total)
    {
        return [
            'code' => 'custom_surcharge',
            'title' => __('Phí dịch vụ tùy chỉnh'),
            'value' => 10.00
        ];
    }
}
```

---

## 3. Hiển thị trên Frontend (Cart/Checkout)

Vì trang Checkout dùng KnockoutJS, bạn phải khai báo thành phần JS trong Layout XML (`checkout_cart_index.xml` hoặc `checkout_index_index.xml`).

```xml
<item name="custom_surcharge" xsi:type="array">
    <item name="component" xsi:type="string">Vendor_Module/js/view/checkout/summary/surcharge</item>
    <item name="sortOrder" xsi:type="string">20</item>
    <item name="config" xsi:type="array">
        <item name="title" xsi:type="string" translate="true">Phí dịch vụ</item>
    </item>
</item>
```

Và file JS tương ứng sẽ lấy giá trị từ đối tượng `totals.segments`.

---

## 4. Lưu ý quan trọng

1. **Thứ tự (Sort Order):** Rất quan trọng. Phí của bạn nên được tính **sau** Subtotal và **trước** Grand Total.
2. **Base vs Currency:** Luôn set cả `TotalAmount` (theo tiền tệ hiện tại) và `BaseTotalAmount` (theo tiền tệ gốc của website).
3. **Database:** Để phí này lưu được vào Order thực tế, bạn cần thêm cột vào bảng `sales_order` và `sales_quote_address` thông qua `db_schema.xml`.

---

## Liên kết

- Declarative Schema: xem [declarative-schema.md](./declarative-schema.md)
- Routing & Controllers: xem [routing-controllers.md](./routing-controllers.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
