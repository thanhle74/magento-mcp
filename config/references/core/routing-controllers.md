# Tham khảo: Routing & Controllers

Nguồn: https://developer.adobe.com/commerce/php/development/components/routing

---

## 1. Cấu trúc URL trong Magento

URL chuẩn của Magento có dạng: `<Base-URL>/<FrontName>/<ControllerName>/<ActionName>`
- `FrontName`: Định nghĩa trong `routes.xml`.
- `ControllerName`: Tên thư mục con trong folder `Controller/`.
- `ActionName`: Tên class xử lý request.

---

## 2. Khai báo Route (`routes.xml`)

Nằm trong `etc/frontend/` hoặc `etc/adminhtml/`.

```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="standard"> <!-- Hoặc id="admin" nếu trong adminhtml -->
        <route id="my_feature" frontName="blog">
            <module name="<Vendor>_<Module>" />
        </route>
    </router>
</config>
```

---

## 3. Action Class (Controller)

Nằm trong folder `Controller/<ControllerName>/<ActionName>.php`.
Sử dụng các Action Interface để khai báo HTTP Method (GET, POST, PUT, DELETE).

### Ví dụ: Controller trả về JSON (Thường dùng cho API/Ajax)

```php
namespace <Vendor>\<Module>\Controller\Index;

use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\Controller\Result\JsonFactory;

class View implements HttpGetActionInterface
{
    public function __construct(
        private readonly JsonFactory $resultJsonFactory
    ) {}

    public function execute()
    {
        $result = $this->resultJsonFactory->create();
        return $result->setData(['status' => 'ok', 'message' => 'Hello Magento']);
    }
}
```

---

## 4. Các loại Result thường dùng

| Loại | Class Factory | Mục đích |
|------|---------------|----------|
| **Page** | `PageFactory` | Trả về một trang HTML đầy đủ kèm Layout. |
| **JSON** | `JsonFactory` | Trả về dữ liệu JSON (cho Ajax/API). |
| **Redirect** | `RedirectFactory` | Chuyển hướng người dùng sang URL khác. |
| **Forward** | `ForwardFactory` | Chuyển request sang một Controller khác nội bộ. |
| **Raw** | `RawFactory` | Trả về nội dung thô (e.g. nội dung file, text plain). |

---

## 5. Lưu ý cho Admin Controller

- Phải nằm trong `etc/adminhtml/routes.xml`.
- Class Controller nên kế thừa `Magento\Backend\App\Action`.
- Phải định nghĩa hằng số `ADMIN_RESOURCE` để kiểm tra quyền truy cập (ACL).

---

## Liên kết

- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Service Contracts: xem [service-contracts.md](./service-contracts.md)
- Series nền tảng PHP MVC Developers: xem [php-mvc-developer-series.md](./php-mvc-developer-series.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
