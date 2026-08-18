# Tham khảo: Hệ thống Ghi nhật ký (Logging)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/logs/custom-logging

---

## 1. Nguyên tắc Logging

- **PSR-3:** Magento tuân thủ chuẩn PSR-3. Luôn inject `Psr\Log\LoggerInterface`.
- **Tách biệt log:** KHÔNG ghi đè vào `system.log`. Mỗi module nên có kênh log riêng.
- **Context:** Luôn truyền thêm mảng dữ liệu ngữ cảnh để dễ dàng debug.

---

## 2. Tạo Logger tùy biến (di.xml)

Sử dụng Virtual Types để tạo kênh log riêng mà không cần viết thêm class PHP.

**`etc/di.xml`**:
```xml
<!-- 1. Tạo Handler xác định file log -->
<virtualType name="MyModuleLogHandler" type="Magento\Framework\Logger\Handler\Base">
    <arguments>
        <argument name="fileName" xsi:type="string">/var/log/my_module.log</argument>
    </arguments>
</virtualType>

<!-- 2. Tạo Logger và gắn Handler vào -->
<virtualType name="MyModuleLogger" type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">MyModuleChannel</argument>
        <argument name="handlers" xsi:type="array">
            <item name="system" xsi:type="object">MyModuleLogHandler</item>
        </argument>
    </arguments>
</virtualType>

<!-- 3. Inject Logger ảo vào class cụ thể -->
<type name="Vendor\Module\Model\Processor">
    <arguments>
        <argument name="logger" xsi:type="object">MyModuleLogger</argument>
    </arguments>
</type>
```

---

## 3. Cách sử dụng trong code

```php
namespace Vendor\Module\Model;

use Psr\Log\LoggerInterface;

class Processor {
    private $logger;

    public function __construct(LoggerInterface $logger) {
        $this->logger = $logger;
    }

    public function process($data) {
        try {
            // Logic...
            $this->logger->info('Xử lý dữ liệu thành công', ['data' => $data]);
        } catch (\Exception $e) {
            $this->logger->critical('Lỗi nghiêm trọng khi xử lý', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
```

---

## 4. Các mức độ Log (Log Levels)
- `emergency`: Hệ thống không còn sử dụng được.
- `alert`: Cần can thiệp ngay lập tức.
- `critical`: Lỗi nghiêm trọng (vd: lỗi thanh toán).
- `error`: Lỗi vận hành nhưng hệ thống vẫn chạy.
- `warning`: Cảnh báo các bất thường.
- `notice`: Sự kiện bình thường nhưng đáng chú ý.
- `info`: Thông tin vận hành.
- `debug`: Chỉ dùng cho developer khi phát triển.

---

## Liên kết
- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
