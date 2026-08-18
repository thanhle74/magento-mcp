# Magento 2 for PHP MVC Developers (Alan Storm)

Tài liệu này tóm tắt nhanh bộ 13 bài nền tảng Magento 2 theo hướng PHP/MVC để dùng làm roadmap học + tra cứu khi build module.

Nguồn chính:

- [Introduction to Magento 2 — No More MVC](https://alanastorm.com/magento_2_mvvm_mvc/)
- [Magento 2: Serving Frontend Files](https://alanastorm.com/magento-2-frontend-files-serving/)
- [Magento 2: Adding Frontend Files to your Module](https://alanastorm.com/magento_2_adding_frontend_files_to_your_module/)
- [Magento 2: Code Generation with Pestle](https://alanastorm.com/magento2_pestle_code_generation/)
- [Magento 2: Adding Frontend Assets via Layout XML / Layout woes](https://alanastorm.com/magento_2_javascript_css_layout_woes/)
- [Magento 2 and RequireJS](https://alanastorm.com/magento_2_and_requirejs/)
- [Magento 2 and the Less CSS Preprocessor](https://alanastorm.com/magento_2_less_css/)
- [Magento 2: CRUD Models for Database Access](https://alanastorm.com/magento_2_crud_models_for_database_access/)
- [Magento 2: Understanding Object Repositories](https://alanastorm.com/magento_2_understanding_object_repositories/)
- [Magento 2: Understanding Access Control List Rules](https://alanastorm.com/magento_2_understanding_access_control_list_rules/)
- [Magento 2: Admin Menu Items](https://alanastorm.com/magento_2_admin_menu_items/)
- [Magento 2: Advanced Routing](https://alanastorm.com/magento_2_advanced_routing/)
- [Magento 2: Admin MVC/MVVM Endpoints](https://alanastorm.com/magento_2_admin_mvcmvvm_endpoints/)

---

## 1) Lộ trình đọc đề xuất (theo thứ tự triển khai module)

1. Kiến trúc tổng quan + cách Magento map MVC/MVVM.
2. Frontend files serving + thêm file vào module.
3. Layout XML + RequireJS + LESS.
4. Data layer: CRUD model -> repository/service contracts.
5. Security & admin IA: ACL -> menu -> routing.
6. Admin endpoints (MVC/MVVM trong backend area).

---

## 2) Mapping sang tài liệu `.spec` hiện có

| Chủ đề series | Ưu tiên đọc trong `.spec` |
|---|---|
| MVC/MVVM foundation | `core/architectural-patterns.md`, `core/routing-controllers.md` |
| Frontend file serving + add frontend files | `frontend/ui-components-howto.md`, `frontend/javascript-init-scripts.md` |
| Layout/JS/CSS/RequireJS/LESS | `frontend/advanced-javascript-series.md`, `frontend/ui-components-js-library.md` |
| CRUD model + repositories | `core/service-contracts.md`, `core/declarative-schema.md`, `core/data-schema-patch.md` |
| ACL + admin menu | `core/routing-controllers.md` + pattern trong `examples/integration/*blueprint*.md` |
| Advanced routing + admin endpoints | `core/routing-controllers.md` + các module blueprint trong `.spec/examples/integration/` |

---

## 3) Practical notes cho project này

- Khi generate module mới, có thể dùng Pestle để tạo boilerplate nhanh, rồi chuẩn hóa lại theo conventions trong `.spec`.
- Xem thêm bộ tài liệu Pestle chi tiết: [pestle-series.md](./pestle-series.md).
- Không lệ thuộc hoàn toàn vào generator output; luôn verify:
  - namespace/path consistency,
  - ACL-resource mapping,
  - route/frontName/controller mapping,
  - `di.xml` preference và service contract typing.
- Với frontend, ưu tiên hiểu RequireJS map/alias và init flow trước khi custom theme hoặc override core JS.

---

## 4) Prompt mẫu để dùng cùng series này

```text
Đọc `.spec/config/references/core/php-mvc-developer-series.md`
và các file được mapping trong bảng.
Sau đó implement task theo module `<Vendor_Module>`.
Chỉ sửa trong scope đã chỉ định và nêu rõ verify steps.
```
