# Tham khảo: HTTP Client (Gọi API bên ngoài)

Nguồn: https://developer.adobe.com/commerce/php/development/components/web-api/curl

---

## 1. Tại sao dùng Wrapper thay vì PHP cURL thuần?

- Tránh việc bị các công cụ kiểm tra code (Static Analysis) báo lỗi bảo mật.
- Tương thích tốt với các cấu hình Proxy của Server.
- Cú pháp hướng đối tượng, dễ đọc hơn.

---

## 2. Cách sử dụng cơ bản

Inject `Magento\Framework\HTTP\Client\Curl` vào constructor.

```php
namespace <Vendor>\<Module>\Model;

use Magento\Framework\HTTP\Client\Curl;

class ExternalApi
{
    public function __construct(
        private readonly Curl $curl
    ) {}

    public function fetchData()
    {
        $url = "https://api.external-service.com/v1/data";
        
        // 1. Set cấu hình (nếu cần)
        $this->curl->setTimeout(30);
        $this->curl->addHeader("Content-Type", "application/json");
        $this->curl->setCredentials("user", "pass"); // Basic Auth
        
        // 2. Thực hiện request
        $this->curl->get($url);
        
        // 3. Lấy kết quả
        $status = $this->curl->getStatus();
        $response = $this->curl->getBody();
        
        return json_decode($response, true);
    }
}
```

---

## 3. Các method quan trọng

- `get($url)`: Gửi GET request.
- `post($url, $params)`: Gửi POST request (tham số là mảng).
- `addHeader($name, $value)`: Thêm 1 Header.
- `setHeaders($array)`: Thêm nhiều Header cùng lúc.
- `setOption($curlOption, $value)`: Set các tùy chọn cURL chuẩn (ví dụ `CURLOPT_RETURNTRANSFER`).
- `setCookies($array)`: Gửi kèm Cookie.
- `getBody()`: Lấy nội dung trả về.
- `getStatus()`: Lấy mã lỗi HTTP (200, 404, 500...).

---

## 4. Lưu ý khi làm việc với JSON

Nếu API bên thứ ba yêu cầu gửi body là một JSON string (thay vì form-data mảng), bạn nên dùng `post()` với chuỗi JSON đã mã hóa:

```php
$params = json_encode(['sku' => '123', 'qty' => 1]);
$this->curl->post($url, $params);
```

---

## Liên kết

- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Web API: xem [web-api.md](./web-api.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
