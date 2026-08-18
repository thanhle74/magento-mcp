# Tham khảo: Các mẫu thiết kế kiến trúc (Architectural Patterns)

Nguồn: https://developer.adobe.com/commerce/php/development/components/adapters

---

## 1. Adapter Pattern (Đóng gói thư viện ngoài)

Đây là quy tắc bắt buộc khi tích hợp SDK hoặc thư viện PHP từ bên thứ ba.

### Cấu trúc thư mục đề xuất:
- `Model/Adapter/AdapterInterface.php`: Định nghĩa các hàm bạn cần.
- `Model/Adapter/<LibraryName>/<Implementation>.php`: Thực thi gọi thư viện ngoài.

### Ví dụ: Tích hợp thư viện Markdown
```php
// 1. Interface của chúng ta
interface MarkdownAdapterInterface {
    public function convertToHtml(string $text): string;
}

// 2. Adapter thực thi (Dùng thư viện Michelf/Markdown)
class PhpMarkdownAdapter implements MarkdownAdapterInterface {
    public function convertToHtml(string $text): string {
        return \Michelf\Markdown::defaultTransform($text);
    }
}
```

### Ưu điểm:
- **Lập trình hướng giao diện (Loose Coupling):** Code của bạn không phụ thuộc vào thư viện ngoài.
- **Dễ dàng thay thế:** Chỉ cần sửa `di.xml` để đổi sang thư viện khác (ví dụ: Ciconia) mà không làm hỏng code cũ.

---

## 2. Proxy & Lazy Loading

Dùng để giải quyết lỗi **Circular Dependency** (A gọi B, B gọi A) hoặc để tăng tốc độ load trang khi một Class có quá nhiều dependency nặng trong constructor.

- **Cách dùng:** Thêm hậu tố `\Proxy` vào tên class trong `di.xml`.
- **Nguyên lý:** Magento sẽ sinh ra một class giả lập (Proxy). Nó chỉ khởi tạo class thật khi bạn thực sự gọi đến một hàm của nó.

---

## 3. Factory Pattern

Dùng để khởi tạo các đối tượng **Newable** (đối tượng có trạng thái dữ liệu, không phải singleton).

- **Cách dùng:** Inject `NameFactory` vào constructor. Magento tự sinh ra code Factory này.
- **Tránh:** Dùng `new ClassName()` trực tiếp.

---

## 4. Pool Pattern (Vạn vật quy nhất)

Dùng để thu thập nhiều thực thể (Objects) từ các module khác nhau vào một class quản lý duy nhất.

- **Cách dùng:** Định nghĩa một mảng `processors`, `variables`, hoặc `pool` trong `di.xml` cho một class.
- **Ví dụ (CMS Variables):** Bạn có thể đóng góp biến của mình vào danh sách biến hệ thống bằng cách thêm item vào argument `configPaths` của class `Magento\Variable\Model\Config\Structure\AvailableVariables`.

---

## Liên kết

- DI & Codegen: xem [di-codegen.md](./di-codegen.md)
- Service Contracts: xem [service-contracts.md](./service-contracts.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
