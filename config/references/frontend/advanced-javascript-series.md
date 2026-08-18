# Magento 2 Advanced JavaScript Series (Alan Storm)

Tài liệu này gom tắt 5 bài nâng cao để dùng như checklist khi debug/custimize frontend Magento 2.

Nguồn:

- [KnockoutJS Primer for Magento Developers](https://alanastorm.com/knockoutjs_primer_for_magento_developers/)
- [Magento 2: KnockoutJS Integration](https://alanastorm.com/magento_2_knockoutjs_integration/)
- [The Curious Case of Magento 2 Mixins](https://alanastorm.com/the-curious-case-of-magento-2-mixins/)
- [Knockout Observables for Javascript Programmers](https://alanastorm.com/knockout-observables-for-javascript-programmers/)
- [Modifying a jQuery Widget in Magento 2](https://alanastorm.com/modifying-a-jquery-widget-in-magento-2/)

---

## 1) KnockoutJS Primer (nền tảng)

Key points:

- Hiểu `view` vs `viewModel`, `ko.applyBindings(viewModel)`.
- Các binding cơ bản: `text`, `value`, `click`, `template`, `component`.
- `ko.observable()` là trọng tâm để update UI reactive.
- Custom binding qua `ko.bindingHandlers.<name>`.

Dùng khi:

- Team còn mơ hồ về KO syntax hoặc chưa quen đọc `data-bind`.
- Cần onboard nhanh dev PHP sang frontend Magento.

---

## 2) Magento-Knockout Integration (khung Magento)

Key points:

- Magento bootstrap KO qua module khởi tạo (`Magento_Ui/js/lib/ko/initialize` ở bản cũ; kiến trúc có thay đổi theo version).
- Magento dùng custom template engine để load template từ static asset path module (`view/*/web/template/*.html`).
- `scope` binding + `Magento_Ui/js/core/app` + `uiRegistry` là xương sống để attach view model theo component name.
- Nhiều binding/extender của Magento được add vào runtime trước khi `applyBindings`.

Dùng khi:

- Debug vì sao KO component không render theo mong đợi.
- Trace luồng `x-magento-init` -> `Magento_Ui/js/core/app` -> registry -> scope.

---

## 3) RequireJS “Mixins” của Magento (thực chất là module hook)

Key points:

- Trong `requirejs-config.js`, `config.mixins` cho phép chèn hook sau khi module target load.
- Mixin module nhận `targetModule`, có thể mutate hoặc return module mới.
- Không phải “mixin” theo nghĩa OOP truyền thống; đúng hơn là listener/hook module loader.
- Có thể dùng `mage/utils/wrapper` để wrap function theo kiểu before/after (giảm kiểu rewrite winner-take-all).

Pattern chuẩn:

1. Khai báo `mixins` theo **real module name** (không dùng alias).
2. Trong hook, thay đổi tối thiểu rồi return module.
3. Ưu tiên wrap thay vì overwrite thẳng khi có khả năng xung đột.

---

## 4) Observables cho dev Magento

Key points:

- Observable là getter/setter callable object: `obs()` để get, `obs(newValue)` để set.
- `subscribe` chỉ trigger khi giá trị thật sự thay đổi.
- Magento UI components dùng observables rất nhiều, và có thể có nhiều subscriber từ template/core code.
- Debug nâng cao có thể inspect `_subscriptions` (chỉ phục vụ debug, không nên dựa vào nội bộ này trong code production).

Dùng khi:

- Gặp bug “đổi value nhưng UI không update”.
- Cần tìm side effects khi một observable thay đổi.

---

## 5) Modifying jQuery Widgets trong Magento 2

Key points:

- Nhiều UI core của Magento dựa trên jQuery widget (`$.widget(...)`) trong module RequireJS.
- `data-mage-init` / `x-magento-init` thường vừa load module vừa instantiate widget.
- Cách an toàn để đổi behavior widget core: dùng RequireJS mixin hook, redefine widget method với `$.widget(...)`, gọi `this._super()` để giữ behavior gốc.
- Cần return lại widget đã redefine để luồng init của Magento tiếp tục hoạt động.

Checklist khi sửa widget:

- Xác định đúng module thật (vd `mage/dropdown`) và alias nếu có.
- Verify widget method override có gọi `_super()` đúng chỗ.
- Test trên các page cùng dùng widget (tránh fix một chỗ hỏng chỗ khác).

---

## 6) Gợi ý áp dụng vào `.spec`

- Với task frontend phức tạp, đọc theo thứ tự:
  1. `javascript-init-scripts.md`
  2. file này (`advanced-javascript-series.md`)
  3. `ui-components-howto.md`
- Khi cần override JS behavior core:
  - ưu tiên mixin hook + wrapper,
  - hạn chế copy/replace nguyên file core hoặc theme fallback brute-force.

---

## Liên kết nội bộ

- [JavaScript init scripts](./javascript-init-scripts.md)
- [UI Components — How-to & Debug](./ui-components-howto.md)
- [UI Components full series (13 bài)](./ui-components-series.md)
- [uiElement Internals series (6 bài)](./uielement-internals-series.md)
- [Thư viện JavaScript UI Components](./ui-components-js-library.md)
- [Magento Front End 2020 series (React/PWA/UPWARD/Hyva)](./magento-frontend-2020-series.md)
