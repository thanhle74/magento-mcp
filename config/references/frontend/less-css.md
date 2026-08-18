# LESS/CSS trong Magento 2

Nguồn:
- [CSS Overview](https://developer.adobe.com/commerce/frontend-core/guide/css/) — developer.adobe.com
- [Magento StackExchange: _module.less vs _extend.less](https://magento.stackexchange.com/questions/116248/difference-between-module-less-and-extend-less) — stackexchange.com
- [How to Use LESS in Magento 2](https://www.cloudways.com/blog/use-less-in-magento-2/) — cloudways.com

---

## 1. Tổng quan LESS trong Magento

Magento 2 dùng **LESS** (CSS preprocessor) với các tính năng:
- Variables (`@variable-name`)
- Mixins (`.mixin()`)
- Nested rules
- Operations và functions

Khi deploy, Magento compile LESS → CSS tự động. Trong developer mode, compile on-the-fly.

---

## 2. Cấu trúc file LESS trong theme

```
app/design/frontend/<Vendor>/<Theme>/
├── web/
│   └── css/
│       └── source/
│           ├── _theme.less          ← Override biến theme toàn cục
│           ├── _extend.less         ← Thêm style mới (không override)
│           └── _variables.less      ← Biến custom của theme
└── <Module_Name>/
    └── web/
        └── css/
            └── source/
                ├── _module.less     ← Override style của module cụ thể
                └── _extend.less     ← Thêm style cho module cụ thể
```

---

## 3. Phân biệt `_module.less` vs `_extend.less`

| File | Mục đích | Khi nào dùng |
|------|----------|--------------|
| `_module.less` | Override/replace toàn bộ style của module | Muốn thay thế hoàn toàn style gốc |
| `_extend.less` | Thêm style mới lên trên style gốc | Muốn giữ style gốc + thêm custom |
| `_theme.less` | Override biến LESS toàn cục của theme | Đổi màu, font, spacing toàn site |

**Rule thực chiến:**
- Ưu tiên `_extend.less` — ít rủi ro hơn, không mất style gốc khi upgrade
- Dùng `_module.less` khi cần override hoàn toàn style của 1 module
- Dùng `_theme.less` để override biến (variables) — cách hiệu quả nhất

---

## 4. Override biến theme (cách tốt nhất)

Magento Blank/Luma có hàng trăm biến LESS. Override biến thay vì override CSS trực tiếp:

```less
// app/design/frontend/Vendor/Theme/web/css/source/_theme.less

// Override màu primary button
@button-primary__color: #ffffff;
@button-primary__background: #e44c2c;
@button-primary__hover__background: #c0392b;
@button-primary__border: 1px solid #e44c2c;

// Override font
@font-family__base: 'Roboto', sans-serif;
@font-size__base: 16px;

// Override màu link
@link__color: #e44c2c;
@link__hover__color: #c0392b;
```

Tìm biến có sẵn trong:
- `vendor/magento/theme-frontend-blank/web/css/source/_variables.less`
- `vendor/magento/theme-frontend-blank/web/css/source/lib/_variables.less`

---

## 5. Thêm style cho module trong theme

```less
// app/design/frontend/Vendor/Theme/Magento_Catalog/web/css/source/_extend.less

// Thêm style cho product listing
.product-item {
    &-name {
        font-weight: 700;
        font-size: 1.4rem;
    }

    &-price {
        color: @color-red10;
    }
}
```

---

## 6. LESS trong custom module

Khai báo LESS file trong module layout:

```xml
<!-- view/frontend/layout/default.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <head>
        <!-- Magento tự tìm .less nếu không có .css -->
        <css src="Vendor_Module::css/custom.css"/>
    </head>
</page>
```

Tạo file LESS:

```less
// view/frontend/web/css/source/custom.less
// Hoặc: view/frontend/web/css/custom.less

@custom-color: #e44c2c;

.vendor-module-widget {
    background-color: @custom-color;
    padding: 1rem;

    &__title {
        font-size: 1.6rem;
        color: darken(@custom-color, 10%);
    }
}
```

**Lưu ý:** Magento ưu tiên `.css` trước, nếu không có thì tìm `.less` và compile.

---

## 7. Mixins trong LESS

```less
// Định nghĩa mixin
.lib-vendor-prefix-display(@value: flex) {
    display: ~"-webkit-@{value}";
    display: ~"-ms-@{value}box";
    display: @value;
}

// Sử dụng mixin
.my-flex-container {
    .lib-vendor-prefix-display(flex);
    flex-wrap: wrap;
}
```

Magento UI Library có sẵn nhiều mixins trong `vendor/magento/magento2-base/lib/web/css/source/lib/`.

---

## 8. Critical CSS

Magento hỗ trợ Critical CSS để tối ưu render-blocking:

```
Admin > Stores > Configuration > Advanced > Developer > CSS Settings
- Use CSS critical path: Yes
```

Khi bật, Magento inline CSS critical path vào `<head>` và load CSS còn lại async.

**Lưu ý:** Critical CSS được generate từ LESS sources. Nếu dùng module `dnafactory/magento2-module-critical`, có thể prevent generation trong production mode.

---

## 9. Deploy và cache

```bash
# Xóa static files và recompile
rm -rf pub/static/frontend/
bin/magento setup:static-content:deploy -f

# Trong developer mode (compile on-the-fly)
bin/magento cache:clean full_page block_html
```

**Developer mode:** LESS compile tự động khi request, không cần deploy.
**Production mode:** Phải chạy `setup:static-content:deploy` sau mỗi thay đổi LESS.

---

## 10. CSS Merge và Minification

```
Admin > Stores > Configuration > Advanced > Developer > CSS Settings
- Merge CSS Files: Yes (giảm HTTP requests)
- Minify CSS Files: Yes (giảm file size)
- Use CSS critical path: Yes (tối ưu render)
```

**Lưu ý:** Tắt merge/minify trong development để debug dễ hơn.

---

## Liên kết

- Layout XML: xem [layout-xml.md](./layout-xml.md)
- RequireJS/KnockoutJS: xem [requirejs-knockoutjs.md](./requirejs-knockoutjs.md)
- Hyva Theme: xem [hyva-theme.md](./hyva-theme.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
