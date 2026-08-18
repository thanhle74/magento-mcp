# Tham khảo: Cú pháp Template & Binding (UI Components)

Nguồn: [Binding Syntax](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/binding-syntax), [Knockout Bindings](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/knockout-bindings), [Template Literals](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/literals)

---

## 1. Cú pháp Binding ứng dụng (Application Syntax)

Magento sử dụng một cú pháp rút gọn giúp template HTML dễ đọc hơn so với cú pháp KnockoutJS gốc:

| Cú pháp Knockout gốc | Cú pháp Magento (Khuyên dùng) |
|----------------------|------------------------------|
| `<!-- ko if: isVisible -->` | `<if args="isVisible">` hoặc `if="isVisible"` |
| `<!-- ko i18n: 'Sign In' -->` | `<translate args="'Sign In'"/>` hoặc `translate="'Sign In'"` |
| `<!-- ko foreach: elements -->` | `<each args="elements">` hoặc `each="elements"` |
| `<!-- ko template: name -->` | `<render args="name"/>` hoặc `render="name"` |

### Ví dụ kết hợp:
```html
<div class="summary" if="isVisible">
    <translate args="'Total: '"/>
    <span text="totalRecords"/>
    <each args="getRegion('actions')">
        <render/>
    </each>
</div>
```

---

## 2. Các Binding tủy chỉnh (Custom KO Bindings)

Ngoài các binding tiêu chuẩn của Knockout, Magento bổ sung các bộ xử lý mạnh mẽ:

| Binding | Vai trò |
|---------|---------|
| **scope** | Thay đổi phạm vi (context) của các node con sang một component khác trong Registry. |
| **mageInit** | Khởi tạo các jQuery widget truyền thống từ bên trong KO template. |
| **afterRender** | Chạy callback JS sau khi element được chèn vào DOM. |
| **outerClick** | Gắn sự kiện khi click ra ngoài vùng element (hữu ích cho dropdown/modal). |
| **keyboard** | Lắng nghe sự kiện phím cụ thể (ví dụ: gán phím Enter: `{ 13: callback }`). |
| **collapsible** | Tự động hóa logic đóng/mở panel. |

---

## 3. Template Literals (`${ }`)

Magento hỗ trợ các chuỗi biểu thức linh hoạt được xử lý bởi `links.js`.

### Vai trò:
- Kết nối động giữa các component mà không cần biết chính xác tên instance.
- Truy vấn dữ liệu theo cấu trúc phân cấp.

### Ví dụ thực tế:
```xml
<!-- Trong XML config -->
<item name="provider" xsi:type="string">${ $.name }_data_source</item>
<item name="total" xsi:type="string">${ $.provider }:data.totalRecords</item>
```

- `${ $.name }`: Tham chiếu đến tên của chính component hiện tại.
- `${ $.provider }`: Giải quyết tên của data provider rồi truy cập vào mảng `data`.

---

## 4. Bindings (Phần Frontend) - Bảng tra cứu tóm tắt

- **i18n / translate**: Dịch chuỗi ngôn ngữ.
- **text / html**: Hiển thị nội dung văn bản hoặc mã HTML.
- **attr / css / style**: Điều khiển thuộc tính, lớp CSS và kiểu trình bày.
- **click / event / submit**: Xử lý tương tác người dùng.
- **checked / value / options**: Liên kết dữ liệu cho các thẻ form (Input, Select, Checkbox).

---

## Liên kết
- [Kiến trúc UI Components](./ui-components.md)
- [Thư viện JavaScript](./ui-components-js-library.md)
