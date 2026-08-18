# Tham khảo: DI & Code Generation (Factories, Proxies)

Nguồn: https://developer.adobe.com/commerce/php/development/components/code-generation

---

## 1. Phân vùng cấu hình (DI Areas)

Luôn đặt `di.xml` vào đúng thư mục để tối ưu hiệu suất và tránh xung đột logic.

- **`etc/di.xml`**: Cấu hình chung cho mọi khu vực (Global).
- **`etc/frontend/di.xml`**: Ưu tiên các xử lý cho khách hàng (Storefront).
- **`etc/adminhtml/di.xml`**: Ưu tiên logic xử lý cho Admin.
- **`etc/webapi_rest/di.xml`**: Dùng cho REST API (vd: thay đổi logic Auth).
- **`etc/graphql/di.xml`**: Dùng cho GraphQL.

---

## 2. Virtual Types & Constructor Injection

Dùng `virtualType` để tạo ra các "biến thể" của một class gốc mà không cần tạo file PHP mới.

```xml
<!-- Tạo một logger riêng cho module -->
<virtualType name="MyModuleLogger" type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">my_module_log</argument>
    </arguments>
</virtualType>

<!-- Inject Logger ảo này vào class thật -->
<type name="Vendor\Module\Model\Processor">
    <arguments>
        <argument name="logger" xsi:type="object">MyModuleLogger</argument>
    </arguments>
</type>
```

---

## 3. Nguyên lý Dependency Injection (DI)

Magento sử dụng DI để giảm sự phụ thuộc giữa các class (loose coupling). Bạn khai báo Interface trong constructor, và Magento sẽ "bơm" (inject) implementation thực tế vào thông qua cấu hình trong `di.xml`.

### Phân loại Object (Rất quan trọng):

| Loại | Đặc điểm | Cách dùng |
|------|-----------|-----------|
| **Injectable** (Service) | Class thực hiện hành động, logic chuyên biệt. Thường là **Singleton**. | **Inject trực tiếp** vào constructor. |
| **Newable** (Data/Transient) | Class chứa dữ liệu (Model), cần thông tin người dùng/DB để khởi tạo. | **KHÔNG inject trực tiếp**. Bắt buộc dùng **Factory**. |

---

## 2. Các kiểu Injection

### Constructor Injection (Thường dùng nhất)
Khai báo phụ thuộc ngay trong hàm tạo. Magento khuyến khích dùng kiểu này cho mọi phụ thuộc.

### Method Injection
Truyền phụ thuộc vào như một tham số của method. Dùng khi phụ thuộc đó chỉ cần thiết cho một hành động cụ thể và có thể thay đổi tùy ngữ cảnh.

```php
public function processCommand(AbstractCommand $command) { ... }
```

---

## 3. Factories (Mẫu thiết kế Nhà máy)

Dùng Factory để khởi tạo (instantiate) một object mới. 

### Tại sao dùng Factory?
- Theo quy chuẩn DI, bạn không được dùng `new $object()` trực tiếp.
- Factory giúp tạo object thông qua ObjectManager mà vẫn đảm bảo tính Type-safe.

### Quy tắc:
- Tên Factory = `TênClass + Factory` hoặc `TênInterface + Factory`.
- **Interface Factory:** Nếu bạn dùng `InterfaceFactory`, Magento sẽ tự tra cứu `di.xml` (preference) để tạo ra instance của class thực thi tương ứng.
- Bạn chỉ cần inject nó vào constructor.

### Cách truyền tham số vào `create()`:
Hàm `create()` tự động chấp nhận một mảng tham số. Tên key trong mảng phải trùng với tên biến trong constructor của class mục tiêu.

```php
// Ví dụ Product model có tham số $data trong constructor
$product = $this->productFactory->create([
    'data' => ['sku' => 'test-sku', 'name' => 'Test Product']
]);
```

### Ví dụ:

```php
public function __construct(
    private readonly \<Vendor>\<Module>\Model\EmployeeFactory $employeeFactory
) {}

public function createNewEmployee(array $data)
{
    // Tạo object mới
    $employee = $this->employeeFactory->create();
    $employee->setData($data);
    $employee->save();
    return $employee;
}
```

---

## 4. Proxies (Mẫu thiết kế Ủy quyền)

Proxy dùng để trì hoãn việc khởi tạo (lazy loading) một class cho đến khi một method của nó thực sự được gọi.

### Khi nào dùng Proxy?
1. **Hiệu suất:** Class gốc quá nặng, tốn nhiều tài nguyên khi khởi tạo nhưng không phải lúc nào cũng được dùng đến.
2. **Circular Dependency:** Class A phụ thuộc B, B lại phụ thuộc A. Dùng Proxy cho một trong hai bên sẽ phá vỡ vòng lặp này.

### Cách khai báo:
Proxy được khai báo trong `etc/di.xml`. Bạn không cần tự viết file PHP Proxy.

```xml
<type name="<Vendor>\<Module>\Model\MyHeavyClass">
    <arguments>
        <argument name="expensiveService" xsi:type="object">
            <Vendor>\<OtherModule>\Service\ExpensiveService\Proxy
        </argument>
    </arguments>
</type>
```
*Lưu ý: Thêm `\Proxy` vào cuối namespace của class cần làm chậm.*

### Ví dụ thực tế:
Hầu hết các class trong Magento đều dùng `StoreManagerInterface\Proxy` vì class StoreManager rất nặng.

```xml
<type name="Magento\Store\Model\Resolver\Store">
    <arguments>
        <argument name="storeManager" xsi:type="object">Magento\Store\Model\StoreManagerInterface\Proxy</argument>
    </arguments>
</type>
```

---

## 4. Interceptors (Dùng cho Plugin)

Khi bạn khai báo một Plugin cho một class, Magento sinh ra một class `Interceptor` kế thừa class đó. Class này sẽ điều phối việc chạy các method `before`, `after`, và `around`.

*Xem chi tiết tại: [plugins.md](./plugins.md)*

---

## 5. Lưu ý về việc Generate lại code

Nếu bạn:
- Thêm method mới vào một class đã có Proxy/Factory.
- Thay đổi chữ ký (signature) của constructor.
- Thay đổi cấu trúc Plugin.

**Thì phải xoá code cũ để Magento sinh lại:**
```bash
# Xoá code đã sinh
rm -rf generated/code/<Vendor>/<Module>

# Hoặc compile lại toàn bộ (Dùng trong Production/Staging)
bin/magento setup:di:compile
```

---

## 6. Asynchronous & Deferred Operations (Xử lý bất đồng bộ)

Dùng `DeferredInterface` để xử lý các tác vụ nặng mà không làm nghẽn luồng xử lý chính của PHP.

### Hai kiểu xử lý chính:
1. **Asynchronous (Bất đồng bộ):** Chạy tác vụ ở background (ví dụ gửi HTTP request) và lấy kết quả sau.
2. **Deferred (Trì hoãn):** Chỉ thực hiện tác vụ khi kết quả thực sự được yêu cầu (Lazy loading nâng cao).

### Ví dụ: Tối ưu Load dữ liệu (Deferred)
Gom nhiều request load lẻ tẻ thành 1 lần load duy nhất để tăng tốc độ.

```php
public function find(string $id): Entity
{
    // Lưu ID lại để load sau
    $this->requestedEntityIds[] = $id;

    // Trả về một "lời hứa" (Promise) thông qua ProxyDeferredFactory
    return $this->proxyDeferredFactory->createFor(
        Entity::class,
        new CallbackDeferred(function () use ($id) {
            // Khi code thực sự gọi method của Entity, hàm này mới chạy
            if (empty($this->identityMap[$id])) {
                $this->loadMultiple($this->requestedEntityIds);
            }
            return $this->identityMap[$id];
        })
    );
}
```

### Khi nào nên dùng:
- Khi cần gọi API bên ngoài (dùng `AsyncClientInterface`).
- Khi xây dựng Repository phức tạp cần tối ưu hiệu suất truy vấn.

---

## 7. Object Manager (Sử dụng đúng cách)

`ObjectManager` là service thực hiện việc khởi tạo object. Theo quy tắc chung, bạn **KHÔNG ĐƯỢC** gọi trực tiếp class này trong code nghiệp vụ.

### Các ngoại lệ được phép dùng trực tiếp:
1. **Magic Methods:** `__wakeup()`, `__sleep()` (nơi DI không hoạt động).
2. **Factories & Proxies:** Các class có nhiệm vụ duy nhất là tạo ra class khác.
3. **Integration Tests:** Dùng để lấy các instance cần thiết cho môi trường test.
4. **Tương thích ngược:** Khi cần thêm phụ thuộc mới vào constructor mà không muốn làm break code của các module con đang kế thừa.

---

## Liên kết

- Plugin: xem [plugins.md](./plugins.md)
- Object Manager series map: xem [object-manager-series.md](./object-manager-series.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
- Các pattern: xem [../magento-patterns.md](../magento-patterns.md)
