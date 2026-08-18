# Magento 2 UI Components Series (Alan Storm)

Tài liệu này gom 13 bài trong series UI Components để dùng làm:

- learning roadmap cho dev mới
- checklist debug khi custom admin grid/form/checkout
- reference nhanh cho các khái niệm khó: `uiRegistry`, `uiElement`, `defaults/imports/exports`, `dataSource`, template literals, tracking

Nguồn:

- [Magento 2: Introducing UI Components](https://alanastorm.com/magento_2_introducing_ui_components/)
- [Magento 2: Simplest UI Component](https://alanastorm.com/magento_simplest_ui_component/)
- [Magento 2: Simplest UI Knockout Component](https://alanastorm.com/magento_2_simplest_ui_knockout_component/)
- [Magento 2: Simplest XSD Valid UI Component](https://alanastorm.com/magento_2_simplest_xsd_valid_ui_component/)
- [Magento 2: ES6 Template Literals](https://alanastorm.com/magento_2_ec6_template_literals/)
- [Magento 2: uiClass Data Features](https://alanastorm.com/magento_2_uiclass_data_features/)
- [Magento 2: UI Component Data Sources](https://alanastorm.com/magento-2-ui-component-data-sources/)
- [Magento 2: UI Component Retrospective](https://alanastorm.com/magento-2-ui-component-retrospective/)
- [Observables, uiElement Objects, and Variable Tracking](https://alanastorm.com/observables-uielement-objects-and-variable-tracking/)
- [Magento 2: uiElement Features and Checkout Application](https://alanastorm.com/magento-2-uielement-object-features-and-checkout-application/)
- [Magento 2: Remaining uiElement Defaults](https://alanastorm.com/magento-2-remaining-uielement-defaults/)
- [Magento 2: Knockout.js Template Primer](https://alanastorm.com/magento-2-knockout-js-template-primer/)
- [Magento 2 UI Component Code Generation](https://alanastorm.com/magento-2-ui-component-code-generation/)

---

## 1) Lộ trình đọc đề xuất (theo độ khó)

1. Introducing UI Components
2. Simplest UI Component
3. Simplest UI Knockout Component
4. Simplest XSD Valid UI Component
5. ES6 Template Literals
6. uiClass Data Features
7. UI Component Data Sources
8. UI Component Retrospective
9. Observables + uiElement Variable Tracking
10. uiElement Features and Checkout Application
11. Remaining uiElement Defaults
12. Knockout.js Template Primer
13. UI Component Code Generation

Gợi ý thực tế: đọc 1-8 để nắm kiến trúc + luồng dữ liệu, sau đó 9-13 để tối ưu khả năng debug/tùy biến.

---

## 2) Những ý chính cần giữ lại khi làm việc thật

## A. UI Component là hệ thống nhiều lớp

- PHP side: XML DSL (`ui_component/*.xml`) + class component + data provider.
- Render side: `x-magento-init` bơm JSON vào `Magento_Ui/js/core/app`.
- JS side: `layout.js` load RequireJS components, tạo view model và đăng ký vào `uiRegistry`.
- KO side: `scope` binding + template rendering.

Kết luận: khi lỗi UI, thường phải trace xuyên suốt cả 4 lớp trên thay vì chỉ nhìn 1 file XML.

## B. `uiRegistry` là điểm neo debug quan trọng

- Có thể lấy instance component theo tên (vd. listing, data source, child component).
- Giúp xác nhận component có được instantiate không, đang giữ data/config gì.
- Cần nắm naming pattern dạng `namespace.component.child`.

## C. `defaults`, `imports`, `exports`, `tracks` quyết định hành vi runtime

- `defaults`: cấu hình mặc định cho view model constructor.
- `imports`/`exports`: đồng bộ dữ liệu giữa các component qua `uiRegistry`.
- `tracks` + observables: kích hoạt reactivity và callback khi giá trị thay đổi.

## D. `dataSource` không chỉ là data tĩnh

- Là component riêng, có provider, params, update URL.
- Dữ liệu listing/form đi qua `dataSource` rồi được import vào component hiển thị.
- Khi sai dữ liệu, kiểm tra thứ tự: provider PHP -> JSON render -> `uiRegistry` -> import vào template VM.

## E. Magento mở rộng KO/template theo cách riêng

- Có custom tags/attrs và cơ chế template riêng, không giống 100% KO gốc.
- Template literals được Magento mở rộng với cú pháp `${$.prop}`.
- Cần cẩn thận khi copy ví dụ KO thuần từ bên ngoài vào Magento.

---

## 3) Cảnh báo kiến trúc và chiến lược áp dụng

Rút ra từ retrospective + thực tế core:

- Core Magento dùng UI Components mạnh ở admin grid/form; một số frontend flow dùng kiểu "lai" (x-magento-init + jsLayout + block).
- Không nên biến mọi thứ thành UI Component XML nếu use case đơn giản.
- Ưu tiên:
  - Admin CRUD: theo pattern core UI Components.
  - Frontend đơn giản: block/template + JS init gọn.
  - Frontend phức tạp (checkout-like): chỉ dùng khi team đủ khả năng debug `uiRegistry` và KO stack.

---

## 4) Checklist debug nhanh (copy dùng ngay)

- [ ] Component có mặt trong `x-magento-init` chưa?
- [ ] RequireJS module (`component`) load thành công chưa?
- [ ] Component instance đã có trong `uiRegistry` chưa?
- [ ] `defaults/config/imports/exports` sau merge có đúng không?
- [ ] `dataSource` có data `items`/`totalRecords` đúng không?
- [ ] KO scope có trỏ đúng tên component không?
- [ ] Template path có đúng module + area + static content không?
- [ ] Có custom mixin/wrapper nào đang override module gốc không?

---

## 5) Áp dụng cho blueprint/module-skeleton trong `.spec/examples`

Khi tạo module admin grid/form bằng AI:

- Luôn yêu cầu output rõ 4 lớp:
  1) layout + `ui_component` XML
  2) data provider + collection mapping
  3) RequireJS component/template
  4) verify steps trên `uiRegistry`
- Với lỗi không render: yêu cầu AI trả về "trace path" theo chuỗi:
  `layout handle -> ui_component xml -> x-magento-init -> component module -> uiRegistry -> KO template`.

---

## 6) Prompt mẫu cho task UI Component

```text
Dựa trên .spec/config/references/frontend/ui-components-series.md:
- Tạo/điều chỉnh UI Component <listing|form|checkout-block> cho module <Vendor_Module>
- Giữ pattern theo core Magento, tránh hack không ổn định
- Báo cáo theo 4 lớp: XML/PHP -> x-magento-init -> JS component -> Knockout render
- Kèm verify steps: cache clean, static content check, uiRegistry inspect, dataSource inspect
```

---

## Liên kết nội bộ

- [UI Components — How-to & Debug](./ui-components-howto.md)
- [Magento 2 Advanced JavaScript Series](./advanced-javascript-series.md)
- [uiElement Internals series (6 bài)](./uielement-internals-series.md)
- [JavaScript init scripts](./javascript-init-scripts.md)
