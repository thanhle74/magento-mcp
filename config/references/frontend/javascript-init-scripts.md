# Magento 2 JavaScript Init Scripts (`x-magento-init` và `data-mage-init`)

Nguồn chính:

- [Magento 2: Javascript Init Scripts (Alan Storm)](https://alanastorm.com/magento_2_javascript_init_scripts/)

---

## 1. Mục tiêu của cơ chế init scripts

Magento 2 cung cấp cơ chế chuẩn để khởi tạo JavaScript mà không cần nhúng inline script logic trực tiếp trong HTML.

Các mục tiêu chính:

- Tránh hard-code JavaScript rải rác trong template.
- Chạy RequireJS module như một "entry point".
- Truyền config JSON do server render (từ `.phtml`).
- Gắn logic vào đúng DOM node qua selector.

---

## 2. `x-magento-init`: khởi tạo từ script JSON

`<script type="text/x-magento-init">` chứa một object JSON.

### Cú pháp cơ bản

```html
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/example": {}
    }
}
</script>
```

Ý nghĩa:

- Key `"Vendor_Module/js/example"`: tên RequireJS module cần load.
- Value `{}`: config object truyền vào module/component.
- Key `"*"`: chạy global, không bind vào node cụ thể.

---

## 3. Module thường vs Magento JS component

### 3.1 Module thường (program-style)

Module chỉ cần load để thực thi side effects.

### 3.2 Magento JS component

Module trả về một function:

```javascript
define([], function () {
    return function (config, node) {
        console.log(config);
        console.log(node);
    };
});
```

Magento sẽ gọi function này và truyền:

- `config`: object từ JSON init
- `node`: DOM element được match selector (hoặc `false` nếu dùng `"*"`)

---

## 4. Gắn vào DOM cụ thể bằng selector

Ví dụ bind vào ID:

```html
<script type="text/x-magento-init">
{
    "#one": {
        "Vendor_Module/js/example": {"config":"value"}
    }
}
</script>
```

Ví dụ bind vào class:

```html
<script type="text/x-magento-init">
{
    ".foo": {
        "Vendor_Module/js/example": {"config":"value"}
    }
}
</script>
```

Nếu selector match nhiều node, component sẽ chạy cho từng node.

---

## 5. `data-mage-init`: init ngay trên phần tử

Khi chỉ muốn init cho một node cụ thể, dùng attribute:

```html
<div data-mage-init='{"Vendor_Module/js/example":{"another":"example"}}'>
    A single div
</div>
```

Lưu ý quan trọng:

- JSON trong `data-mage-init` dùng quote kép (`"`), nên attribute ngoài thường dùng quote đơn (`'`).
- Đây là JSON strict parser, sai quote dễ fail silent hoặc parse error.

---

## 6. Khi nào dùng cái nào?

- Dùng `x-magento-init` khi:
  - cần map module với selector linh hoạt;
  - cần init nhiều node hoặc init global từ một block JSON.
- Dùng `data-mage-init` khi:
  - init đơn lẻ, co-located ngay tại node HTML;
  - muốn đọc template nhanh mà không tách script block riêng.

---

## 7. Best practices cho project

- Ưu tiên module trả về function (`config, node`) để tái sử dụng.
- Giữ config dưới dạng JSON server-side; tránh build JS string động trong PHP.
- Không hard-code selector trong module nếu có thể truyền từ init config.
- Với logic lớn, tách service/helper module thay vì nhồi hết vào init component.

---

## 8. Liên kết liên quan trong `.spec`

- [UI Components — How-to & Debug](./ui-components-howto.md)
- [Thư viện JavaScript UI Components](./ui-components-js-library.md)
- [Kiến trúc UI Components](./ui-components.md)
