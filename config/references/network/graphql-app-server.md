# Tham khảo: GraphQL & Application Server

Nguồn: https://developer.adobe.com/commerce/php/development/components/app-server

**Web API GraphQL** (reference, usage, token, cache, response HTTP): xem thư mục [`graphql/`](./graphql/README.md).  
**Nhánh Development trên Adobe** (schema `schema.graphqls`, resolver, Identity, urlResolver, debug, exception, test): xem [`graphql/development.md`](./graphql/development.md).

---

## 1. GraphQL trong Magento (Tổng quan)

Để xây dựng API GraphQL, bạn cần định nghĩa schema (`.graphqls`) và các class **Resolver** để xử lý dữ liệu.

### Cấu trúc folder đề xuất (theo ý của bạn):
```
app/code/<Vendor>/<Module>/
├── etc/
│   └── schema.graphqls          # Định nghĩa kiểu dữ liệu, query, mutation
├── Model/
│   └── Resolver/                # Chứa các class Resolver xử lý logic lấy dữ liệu
│       └── <Entity>Resolver.php
```

---

## 2. Thử thách với Application Server (App Server)

App Server là một process chạy liên tục trong bộ nhớ. Nó xử lý nhiều request GraphQL mà không khởi động lại PHP. Do đó, code của bạn phải tuyệt đối **Stateless (Không lưu trạng thái dư thừa)**.

### Quy tắc "Vàng" để tương thích App Server:

1. **KHÔNG dùng biến nội bộ (`private`, `protected`) để cache dữ liệu** trong class (vì giá trị đó sẽ bị kẹt lại cho request sau).
2. **KHÔNG dùng biến siêu toàn cục** (`$_SESSION`, `$_COOKIE`, `$_GET`...). Hãy dùng các class abstraction của Magento.
3. **Cẩn thận với Static Variables:** Tuyệt đối không dùng `static` để lưu dữ liệu của request.
4. **Logic Reset State:** Nếu bắt buộc phải cache dữ liệu trong class để dùng lại trong cùng 1 request, bạn phải implement cơ chế reset.

---

## 3. Cách viết Resolver "App Server Ready"

### Ví dụ Resolver ĐÚNG (Stateless):

```php
<?php

declare(strict_types=1);

namespace <Vendor>\<Module>\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class <Entity>Resolver implements ResolverInterface
{
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        // LUÔN lấy dữ liệu tươi từ Repository hoặc Service dựa trên $args hoặc $context
        $entityId = $args['id'] ?? null;
        
        // Không lưu kết quả vào biến $this->lastResult;
        return $this->entityRepository->getById($entityId);
    }
}
```

---

## 4. Cách Reset State (Nếu cần cache trong 1 request)

Nếu bạn có một class Service nặng và muốn cache kết quả để dùng nhiều lần **trong cùng 1 request**, bạn phải sử dụng `di.xml` để đăng ký reset.

1. **Class Service:**
```php
class HeavyService {
    private $cache = [];

    public function getData($id) {
        if (!isset($this->cache[$id])) {
            $this->cache[$id] = $this->loadData($id);
        }
        return $this->cache[$id];
    }

    public function reset(): void {
        $this->cache = []; // Phải có hàm này để xoá cache sau mỗi request
    }
}
```

2. **Khai báo trong `etc/di.xml`:**
```xml
<type name="Magento\Framework\ObjectManager\Config\Reader\Dom">
    <arguments>
        <argument name="resetAfterRequest" xsi:type="array">
            <item name="vendor_module_heavy_service" xsi:type="string"><Vendor>\<Module>\Model\HeavyService</item>
        </argument>
    </arguments>
</type>
```

---

## 5. Lưu ý cho GraphQL Folder riêng

- Khi bạn tách logic ra một folder riêng (ví dụ `NullTraceX_GraphQl`), hãy đảm bảo module này phụ thuộc (`<sequence>`) vào module chứa Data Model gốc.
- Resolver chỉ nên đóng vai trò "đọc tham số tham số GraphQL" và gọi đến **Service Contract (Repository/Service)**. Không viết logic nghiệp vụ phức tạp ngay trong Resolver.

---

## Liên kết

- DI & Proxy: xem [di-codegen.md](./di-codegen.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Các pattern: xem [../magento-patterns.md](../magento-patterns.md)
