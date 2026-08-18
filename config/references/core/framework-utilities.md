# Tham khảo: Tiện ích hệ thống (Framework Utilities)

Nguồn: https://developer.adobe.com/commerce/php/development/framework/

---

## 1. ArrayManager (Quản lý mảng lồng nhau)

Dùng để thao tác với các mảng cấu hình (như UI Components) một cách an toàn, tránh lỗi "Undefined index".

```php
// Thay vì: if (isset($data['tiers'][0]['price'])) ...
// Hãy dùng:
$price = $this->arrayManager->get('tiers/0/price', $data);
$data = $this->arrayManager->set('tiers/0/price', 100, $data);
$data = $this->arrayManager->remove('tiers/0', $data);
```

---

## 2. FloatComparator (So sánh số thực)

**QUY TẮC:** Tuyệt đối không dùng `==`, `>`, `<` trực tiếp với tiền tệ (Float).

```php
// Sai: if ($price1 == $price2)
// Đúng:
if ($this->floatComparator->equal($price1, $price2)) {
    // Hai số bằng nhau (với sai số epsilon 0.00001)
}
```

---

## 3. DateTime Library

Sử dụng `Magento\Framework\Stdlib\DateTime` để đảm bảo định dạng và múi giờ thống nhất.

- `formatDate($date)`: Chuyển về định dạng chuẩn DB (`Y-m-d`).
- `isEmptyDate($date)`: Kiểm tra ngày trống an toàn.

---

## 4. Random (Dữ liệu ngẫu nhiên)

Sử dụng `Magento\Framework\Math\Random` để tạo chuỗi bảo mật.

```php
$couponCode = $this->mathRandom->getRandomString(8); // Mã ngẫu nhiên 8 ký tự
$iv = $this->mathRandom->getRandomString(16); // Tạo IV cho mã hóa
```

---

## 5. Serializer (JSON / chuỗi hóa)

**Quy tắc:** Trong code module (Model/Service/Plugin/Observer/Controller/…), **không** dùng `json_encode` / `json_decode` hoặc `serialize()` / `unserialize()` PHP trực tiếp cho dữ liệu JSON hoặc payload nghiệp vụ — không đồng bộ với chuẩn Magento, khó debug, dễ lệch format / rủi ro bảo mật.

**Chuẩn:** inject `Magento\Framework\Serialize\Serializer\Json` qua constructor (DI), gọi `serialize()` / `unserialize()` trên instance đó. Khi cần abstraction (test double / nhiều backend), có thể type-hint `Magento\Framework\Serialize\SerializerInterface` nếu module đã bind đúng implementation trong `di.xml`.

```php
// Constructor: Serializer\Json $jsonSerializer
$json = $this->jsonSerializer->serialize($data);
$array = $this->jsonSerializer->unserialize($json);
```

**Lợi ích:** đồng bộ với core Magento, exception rõ ràng khi lỗi, xử lý thống nhất.

---

## 6. URL Library

Sử dụng `Magento\Framework\UrlInterface` để tạo link chuẩn (bao gồm cả Secret Key trong Admin).

```php
$url = $this->urlBuilder->getUrl('sales/order/view', ['order_id' => 1]);
```

---

## Liên kết

- MSI & Kho hàng: xem [inventory-msi.md](./inventory-msi.md)
- Architectural Patterns: xem [architectural-patterns.md](./architectural-patterns.md)
