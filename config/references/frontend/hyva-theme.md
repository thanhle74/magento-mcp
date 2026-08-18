# Tham khảo: Hyvä Theme

Nguồn: https://docs.hyva.io / https://github.com/hyva-themes/magento2-default-theme

---

## Tổng quan

Hyvä là frontend theme cho Magento 2 thay thế Luma. Thay vì RequireJS + KnockoutJS, Hyvä dùng **Tailwind CSS** + **Alpine.js** — nhẹ hơn, nhanh hơn đáng kể.

**Từ tháng 11/2025:** Core theme (`hyva-themes/magento2-default-theme`) là **open source miễn phí**. Hyvä UI library (pre-built components) vẫn là commercial.

---

## Stack kỹ thuật

| Thành phần | Luma | Hyvä |
|-----------|------|------|
| CSS | LESS + Bootstrap | Tailwind CSS |
| JS reactivity | KnockoutJS | Alpine.js v3 |
| JS module loader | RequireJS | Native ES modules |
| Server-side reactivity | — | Magewire (Livewire port) |
| Bundle size | ~500KB JS | ~30KB JS |

---

## Alpine.js trong Hyvä

Alpine.js v3 là framework JS nhẹ, reactive, không cần build step.

### Cú pháp cơ bản

```html
<!-- x-data: khởi tạo component state -->
<div x-data="{ open: false, count: 0 }">
    <!-- x-show: hiển thị/ẩn -->
    <div x-show="open">Nội dung ẩn/hiện</div>

    <!-- x-on hoặc @: event listener -->
    <button @click="open = !open">Toggle</button>

    <!-- x-text: bind text content -->
    <span x-text="count"></span>

    <!-- x-bind hoặc :: bind attribute -->
    <input :class="{ 'active': open }" />

    <!-- x-model: two-way binding -->
    <input x-model="count" type="number" />
</div>
```

### Component tách biệt (khuyến nghị)

```html
<!-- Khai báo component trong script tag -->
<script>
function myComponent() {
    return {
        count: 0,
        increment() {
            this.count++;
        }
    }
}
</script>

<div x-data="myComponent()">
    <button @click="increment()">+</button>
    <span x-text="count"></span>
</div>
```

### Dispatch event giữa components

```html
<!-- Component A: dispatch -->
<div x-data>
    <button @click="$dispatch('cart-updated', { qty: 3 })">Update</button>
</div>

<!-- Component B: listen -->
<div x-data="{ qty: 0 }" @cart-updated.window="qty = $event.detail.qty">
    Qty: <span x-text="qty"></span>
</div>
```

---

## Magewire

Magewire là port của Laravel Livewire cho Magento — cho phép viết reactive UI bằng PHP thuần, không cần JS.

### Cách hoạt động

1. PHP Component class xử lý state và actions
2. Khi user tương tác, Magewire gửi AJAX request lên server
3. Server re-render component và trả về HTML diff
4. Alpine.js apply diff vào DOM

### Ví dụ Magewire Component

```php
<?php
// app/code/Vendor/Module/Magewire/Counter.php
namespace Vendor\Module\Magewire;

use Magewirephp\Magewire\Component;

class Counter extends Component
{
    public int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }

    public function decrement(): void
    {
        $this->count--;
    }
}
```

```html
<!-- Template: Vendor_Module::magewire/counter.phtml -->
<div>
    <button wire:click="decrement">-</button>
    <span><?= $magewire->count ?></span>
    <button wire:click="increment">+</button>
</div>
```

```xml
<!-- Layout XML -->
<block name="vendor.counter"
       template="Vendor_Module::magewire/counter.phtml">
    <arguments>
        <argument name="magewire" xsi:type="object">Vendor\Module\Magewire\Counter</argument>
    </arguments>
</block>
```

---

## Tailwind CSS

Hyvä dùng Tailwind CSS utility-first. Không viết CSS custom — dùng class trực tiếp trong HTML.

```html
<!-- Ví dụ button -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Thêm vào giỏ
</button>
```

### Purge/JIT

Tailwind chỉ include CSS của các class thực sự dùng. Cần cấu hình `content` paths trong `tailwind.config.js` để scan đúng file.

---

## Compatibility với Magento modules

Hyvä **không tương thích** với các module dùng KnockoutJS/RequireJS/LESS. Cần **compatibility module** riêng.

### Kiểm tra compatibility

- [hyva-themes/magento2-compat-module-fallback](https://github.com/hyva-themes/magento2-compat-module-fallback) — fallback về Luma cho module chưa tương thích
- [hyva.io/compatibility](https://hyva.io/hyva-themes-magento-2-theme-compatibility.html) — danh sách module đã có compat

### Tạo compatibility module

```
Vendor/ModuleHyva/
├── registration.php
├── etc/
│   └── module.xml
└── view/
    └── frontend/
        ├── layout/
        │   └── <handle>.xml    # Override layout của module gốc
        └── templates/
            └── *.phtml         # Template dùng Alpine.js thay KO
```

---

## Hyvä vs Luma — khi nào dùng

| Tình huống | Khuyến nghị |
|-----------|-------------|
| Project mới, không có module legacy | Hyvä |
| Project có nhiều module third-party chưa có compat | Luma hoặc Hyvä + fallback |
| Cần B2B features đầy đủ | Kiểm tra compat trước |
| Performance là ưu tiên hàng đầu | Hyvä |
| Team quen KnockoutJS | Luma (hoặc training) |

---

## Lưu ý quan trọng

- Hyvä **không dùng** `requirejs-config.js` — JS khai báo trực tiếp trong template hoặc `<script>` tag
- Hyvä **không dùng** `_module.less` — CSS qua Tailwind classes
- `bin/magento setup:static-content:deploy` vẫn cần chạy
- Tailwind build cần Node.js — thêm vào CI/CD pipeline
- Alpine.js v2 và v3 **không thể dùng cùng nhau** trong 1 theme

---

## Liên kết

- Layout XML: xem [layout-xml.md](./layout-xml.md)
- ViewModel: xem [frontend-view-models.md](./frontend-view-models.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
