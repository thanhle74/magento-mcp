# Tham khảo: Thư viện JavaScript UI Components

Nguồn: [uiClass](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/class), [uiElement](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/element), [uiCollection](https://developer.adobe.com/commerce/frontend-core/ui-components/concepts/collection)

---

## 1. Hệ thống phân cấp Class

Tất cả các UI Components trong Magento đều kế thừa từ một cấu trúc class phân tầng:

| Class | Vai trò | Tệp nguồn |
|-------|---------|----------|
| **uiClass** | Lớp cơ sở trừu tượng, xử lý kế thừa và khởi tạo cấu hình. | `lib/core/class.js` |
| **uiElement** | Kế thừa `uiClass`. Thêm khả năng quan sát (observables), liên kết (links) và template. | `lib/core/element/element.js` |
| **uiCollection** | Kế thừa `uiElement`. Chuyên dùng cho các component có chứa các component con. | `lib/core/collection.js` |

---

## 2. uiClass: Nền tảng kế thừa

### Các hàm quan trọng:
- `extend(object)`: Tạo class con mới. `this._super()` dùng để gọi hàm cha.
- `initialize()`: Hàm khởi tạo, gọi một lần duy nhất khi instance được tạo.
- `initConfig(config)`: Trộn cấu hình mặc định (`defaults`) với cấu hình từ server (JSON).

```javascript
define(['uiClass'], function (Class) {
    return Class.extend({
        defaults: {
            message: 'Hello'
        },
        initialize: function () {
            this._super(); // Bắt buộc
            console.log(this.message);
            return this;
        }
    });
});
```

---

## 3. uiElement: Trái tim của UI Component

`uiElement` là class cha phổ biến nhất cho các component đơn lẻ.

### Xử lý Observable (Dữ liệu phản hồi)
- `initObservable()`: Nơi khai báo các biến quan sát.
- `observe(properties)`: Chuyển property thành hàm (getter/setter). Lưu ý: Truy cập qua `this.prop()`.
- `track(properties)`: Sử dụng ES5 accessors. Truy cập trực tiếp qua `this.prop`.

### Liên kết linh hoạt (Links & Communication)
Được cấu hình trong thuộc tính `defaults` và xử lý bởi `initLinks()`:

| Thuộc tính | Vai trò | Cú pháp mẫu |
|------------|---------|-------------|
| **imports**| Theo dõi và lấy dữ liệu từ bên ngoài. | `'localProp': '${ $.provider }:remoteProp'` |
| **exports**| Đẩy dữ liệu nội bộ ra bên ngoài. | `'localProp': '${ $.provider }:remoteProp'` |
| **links**  | Kết nối hai chiều (Sync). | `'localProp': '${ $.provider }:remoteProp'` |
| **listens**| Chạy callback khi property bên ngoài thay đổi. | `'${ $.provider }:remoteProp': 'callbackFunc'` |

**Lưu ý về Template Strings (`${ }`):**
- `$.name`: Tên của chính component hiện tại.
- `$.provider`: Tên của data source được gán cho component.
- Cú pháp `${ $.provider }:data.total` hỗ trợ truy cập sâu vào object.

---

## 4. uiCollection: Quản lý Component con

Sử dụng khi component đóng vai trò là "container" (ví dụ: Form, Toolbar, Grid).

### Đặc điểm:
- **elems**: Một `observableArray` chứa danh sách các instance của component con.
- **childDefaults**: Cấu hình mặc định sẽ được áp dụng cho tất cả component con.
- **initElement(child)**: Hook chạy khi một component con được khởi tạo.

---

## 5. uiLayout: Dịch vụ khởi tạo động

`uiLayout` (từ `Magento_Ui/js/core/renderer/layout`) là engine đứng sau việc đọc JSON cấu hình và tạo ra các JS objects.

- Thường được dùng để thêm các hàng (Rows) hoặc phần tử động vào runtime.
- **run(nodes, parent)**: Hàm chính để bắt đầu render một cây component mới.

```javascript
layout([{
    name: 'dynamic_component',
    parent: '${ $.name }',
    component: 'Magento_Ui/js/form/element/abstract',
    template: 'ui/form/field'
}]);
```

---

## 6. uiRegistry: Kho quản lý Instance

Tất cả các UI Component sau khi khởi tạo đều được đăng ký vào `uiRegistry`. Đây là công cụ quan trọng để debug và tương tác giữa các component xa nhau.

### Thao tác phổ biến:
- `get(name)`: Lấy instance theo tên đầy đủ (ví dụ: `product_form.product_form.details`).
- `get('index = name')`: Tìm component có thuộc tính `index` là `name`.
- `async(name)(callback)`: Chờ cho đến khi component xuất hiện rồi mới chạy callback.

### Debug qua Browser Console:
```javascript
// Bước 1: Lấy Registry
var reg = require('uiRegistry');

// Bước 2: Tìm component (ví dụ: field tên 'price')
var price = reg.get('index = price');

// Bước 3: Tương tác
price.value(); // Lấy giá trị hiện tại
price.visible(false); // Ẩn field
price.validate(); // Chạy validation
```

---

## Bẫy runtime & checklist debug (uiClass/uiElement)

`uiClass`/`uiElement` không phải class ES chuẩn — là object system Magento dựng trên RequireJS + underscore + `mageUtils`. Tránh giả định OOP truyền thống.

**Bẫy lớn — object trong `defaults` bị share reference:** đặt object/observable trực tiếp trong `defaults` → nhiều instance dùng chung reference. Dấu hiệu: thay đổi component A làm component B đổi theo. Nguồn bug khó thấy trong checkout/listing nhiều component cùng kiểu.

**Mapping bug → nguyên nhân:**

| Triệu chứng | Kiểm tra |
|---|---|
| 2 UI instance ảnh hưởng lẫn nhau | Object reference trong `defaults` |
| Component tạo được nhưng thiếu config | `initialize`/`initConfig` và `_super` |
| Override method không như kỳ vọng | `wrapper.wrapSuper` + inheritance chain thực tế |
| Khó trace method/data nguồn gốc | Prototype chain + module alias thật |

**Checklist:**

- [ ] Instance có share object reference từ `defaults` không?
- [ ] `this` trong callback có bị bind sai context không?
- [ ] Method đến từ object hiện tại hay parent prototype?
- [ ] Override có gọi `_super` đúng không?
- [ ] `initialize`/`initConfig` custom có bỏ `_super` không?
- [ ] Dùng `_.extend` (shallow) hay `utils.extend` (deep) đúng ý chưa?

## Liên kết
- [Kiến trúc UI Components](./ui-components.md)
- [Cú pháp Template & Bindings](./ui-components-templates.md)
