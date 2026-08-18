# Spec - jasonle-order-attribute

## Tuân thủ chuẩn chung (bắt buộc)

- `config/constitution.md`
- `config/checklist.md` (gồm docblock, PHPCS, review gate §12)

---

## Input
- Feature: `JasonLe Order Attribute`
- Vấn đề: Cần thêm custom field trên Sales Order do admin tự định nghĩa (tạo/sửa/xóa), hiển thị trên order và order list, expose qua API — không muốn sửa schema `sales_order` động hoặc file core.
- Mục tiêu: Hai module — `JasonLe_OrderAttribute` (core: DB, admin, REST, service) + `JasonLe_OrderAttributeGraphQl` (GraphQL only); tách biệt core, dễ mở rộng.
- Module/scope biết chắc: `app/code/JasonLe/OrderAttribute/`, `app/code/JasonLe/OrderAttributeGraphQl/`
- Project: *(core reusable — không có `Project:` trong prompt)*

## Đã kiểm tra code hiện tại
- `app/code/JasonLe/` — **chưa tồn tại** (greenfield).
- Không có module/order-attribute tương tự trong repo Magento `src`.
- Magento core: order attribute chuẩn qua `SalesSetup` / cột `sales_order` — **không** có Admin “Order Attribute Manager”; không đáp ứng CRUD runtime từ admin → **gap** cần module custom.

## Business + scope

### In-scope (v1)

**Module `JasonLe_OrderAttribute` (core)**
- Bảng định nghĩa + bảng giá trị (không add/drop cột `sales_order` theo từng attribute).
- Admin: Grid + Form CRUD **định nghĩa** attribute (`attribute_code`, label, `input_type`, flags…).
- Admin order view/edit: hiển thị + lưu giá trị attribute **active** trên đơn (create order admin + edit order nếu Magento cho phép sửa field tùy config).
- Sales order grid: cột cho attribute có `show_in_grid = 1` (đọc từ bảng value — có thể giới hạn số cột nếu performance).
- Plugin `OrderRepository` (một integration point): load/save values; extension attribute trên `OrderInterface` cho API nội bộ.
- REST (`etc/webapi.xml` trong module core): CRUD definition (admin ACL); đọc/ghi values theo order (ACL tách).
- Soft delete definition mặc định (`is_active = 0`); hard delete + cascade values (có confirm, transaction).
- Events: `jasonle_order_attribute_definition_save_before/after`, `delete_before`, `values_save_after`.
- `InputTypeProviderInterface` + đăng ký qua `di.xml` (text, textarea, boolean, select tối thiểu v1).
- ACL, menu admin riêng module `JasonLe_OrderAttribute`.
- `declare(strict_types=1)`, Repository pattern, `Serializer\Json` cho `options_json`.

**Module `JasonLe_OrderAttributeGraphQl` (GraphQL adapter)**
- Phụ thuộc: `JasonLe_OrderAttribute`, `Magento_GraphQl` (`etc/module.xml` sequence).
- Chỉ chứa: `etc/schema.graphqls`, `Model/Resolver/*` — **không** DB, admin, plugin order.
- Resolver gọi `OrderAttributeManagementInterface` / repositories từ module core (không duplicate SQL).
- Có thể `module:disable JasonLe_OrderAttributeGraphQl` mà core + REST vẫn chạy.

### Out-of-scope (v1)
- Module riêng `JasonLe_OrderAttributeWebapi` — REST giữ trong module core (tách sau nếu API phình to).
- Order item level attribute (để v2, cùng pattern bảng riêng).
- Admin tự `SalesSetup::addAttribute` / DROP COLUMN runtime.
- Adobe Commerce Data Connection / Experience Platform export.
- Indexer riêng, import/export CSV definition.
- Store-view scoped definition (v1: global definition; `store_id` có thể v2).
- Hyvä/PWA UI ngoài REST/GraphQL contract.

## Acceptance criteria

**AC-01 — Database**
- `jasonle_order_attribute`: PK `entity_id`, `attribute_code` UNIQUE, metadata + `is_active`, `is_system`, timestamps.
- `jasonle_order_attribute_value`: PK `value_id`, UNIQUE (`order_id`, `attribute_code`), `value` text nullable.
- `etc/db_schema.xml` + `etc/db_schema_whitelist.json` (generate whitelist theo constitution).
- Không thêm cột động trên `sales_order` / `quote` khi admin tạo attribute.

**AC-02 — Admin CRUD definition**
- Menu + ACL `JasonLe_OrderAttribute::attribute_definition`.
- Grid: list definitions; filter `is_active`; actions Edit, Delete.
- Form create: `attribute_code` (validate `^[a-z][a-z0-9_]{2,63}$`, unique, không trùng reserved/core column names), `frontend_label`, `input_type`, `is_required`, `show_in_grid`, `show_in_order_view`, `sort_order`, `default_value`, `options` (khi select).
- Form edit: **không đổi** `attribute_code`.
- `is_system = 1` → không Delete từ UI.
- Soft delete: set `is_active = 0`, ẩn khỏi form order mới; values cũ vẫn trong DB.
- Hard delete: confirm message; transaction xóa definition + all values với `attribute_code` đó.

**AC-03 — Order values (admin)**
- Khi mở order (view/edit): render fields cho mọi definition `is_active = 1` và `show_in_order_view = 1`, sort `sort_order`.
- Save order (admin): persist vào `jasonle_order_attribute_value`; validate required + `InputTypeProvider`.
- Copy quote → order: values trên quote **không** bắt buộc v1 (out-of-scope copy quote nếu chưa có cột quote — chỉ persist khi save order entity_id đã có).

**AC-04 — Order grid**
- Cột động cho `show_in_grid = 1` hiển thị value (truncate nếu dài).
- Attribute soft-deleted hoặc hard-deleted → không hiển thị cột / value trên grid mới.

**AC-05 — Integration (tách core)**
- Một `OrderRepositoryPlugin` delegate `OrderAttributeManagementInterface` — không logic nặng trong plugin.
- Disable module → order core hoạt động bình thường (không fatal); không sửa file `vendor/magento/*`.

**AC-06 — REST API**
- `GET/POST/PUT/DELETE` definitions (admin integration token / ACL).
- `GET` values by `orderId`; `PUT` bulk values cho order (admin).
- Guest/customer REST cho values — **out v1** trừ khi bổ sung AC sau.

**AC-07 — GraphQL (`JasonLe_OrderAttributeGraphQl`)**
- Module enable: `JasonLe_OrderAttribute` **bắt buộc** enabled trước; GraphQL module optional.
- `etc/module.xml` sequence: `JasonLe_OrderAttribute`, `Magento_GraphQl`.
- Query `jasonleOrderAttributeDefinitions` (filter active) — resolver inject service core.
- Order type mở rộng field `jasonleCustomAttributes` trả list `{ code, label, value }` theo order.
- Mutation save values trên order — admin-only v1.
- Disable `JasonLe_OrderAttributeGraphQl` → GraphQL schema/field biến mất; admin + REST core không bị ảnh hưởng.
- Không file GraphQL trong `JasonLe_OrderAttribute` (tránh phụ thuộc `Magento_GraphQl` ở module core).

**AC-08 — Extension & safety**
- `attribute_code` immutable sau create.
- Hard delete chỉ role có quyền `JasonLe_OrderAttribute::attribute_definition_delete` (hoặc tương đương).
- Không `ObjectManager`, không `preference` override core; JSON qua `Serializer\Json`.

## Decision

- **Requirement understanding:**
  - “Order attribute” = custom field trên **Sales Order**, admin CRUD **định nghĩa**, không phải sắp xếp thứ tự product attribute.
  - An toàn production: không schema động trên `sales_order`; meta + value tables.
  - Xóa sạch = hard delete definition + cascade values; mặc định UI soft delete.

- **Risks/assumptions:**
  - Order grid nhiều cột động → có thể giới hạn max columns hoặc chỉ `show_in_grid` cho ≤ N attribute (chốt trong plan nếu cần).
  - GraphQL/REST schema naming cần tránh conflict module khác.
  - Admin create order flow có thể khác edit — test cả hai.

- **Approach đã chốt:**
  - **Data (chốt):** `jasonle_order_attribute` + `jasonle_order_attribute_value` + `OrderAttributeManagement` service + single repository plugin — chỉ trong `JasonLe_OrderAttribute`.
  - **GraphQL (chốt):** module riêng `JasonLe_OrderAttributeGraphQl` (pattern `Catalog` / `CatalogGraphQl`) — adapter mỏng, logic nằm core.
  - *Loại:* GraphQL trong cùng module core — không chọn (ép phụ thuộc `Magento_GraphQl` khi shop không dùng GraphQL).
  - *Loại:* `SalesSetup::addAttribute` mỗi lần admin tạo — không chọn (không an toàn, cần upgrade/drop column).

- **Business rules chính:**
  - Một order, một value per `attribute_code` (UNIQUE constraint).
  - Chỉ definition `is_active = 1` mới hiện form/API.
  - `is_system` attributes không xóa được.

- **Scope được phép sửa:**
  - `app/code/JasonLe/OrderAttribute/**`
  - `app/code/JasonLe/OrderAttributeGraphQl/**`
  - `spec/features/jasonle-order-attribute/**`

- **References (đọc khi plan/implement):**
  - `spec/examples/integration/magento-module-admin-grid-employee-blueprint.md`
  - `spec/config/references/core/attributes.md` (extension attributes)
  - `spec/examples/integration/extension-attributes-join-blueprint.md`
  - `spec/config/references/core/declarative-schema.md`
  - `spec/templates/task-contract-crud-module.md`

## Testcase

- **Happy**
  - TC-01: Admin tạo definition `delivery_note` (text) → xuất hiện grid definition.
  - TC-02: Mở order #1, nhập `delivery_note`, save → row trong `jasonle_order_attribute_value`.
  - TC-03: REST `GET` order kèm custom attributes trả đúng value.
  - TC-04: GraphQL query order + `jasonleCustomAttributes` trả đúng (`JasonLe_OrderAttributeGraphQl` enabled).
  - TC-04b: `module:disable JasonLe_OrderAttributeGraphQl` → GraphQL field không còn; REST/admin core vẫn OK.

- **Edge**
  - TC-05: Soft delete definition → form order không còn field; value cũ vẫn DB; API không trả attribute inactive.
  - TC-06: Hard delete + cascade → không còn rows value với `attribute_code` đó.
  - TC-07: Edit definition đổi label/sort — `attribute_code` không đổi.

- **Negative**
  - TC-08: Trùng `attribute_code` → validation error.
  - TC-09: `attribute_code` trùng tên cột reserved → reject.
  - TC-10: User không ACL → 403 admin + REST.
  - TC-11: Xóa `is_system = 1` → bị chặn.

---

**Trạng thái:** Đã implement. Verify: `setup:upgrade`, `di:compile`, admin + REST + GraphQL.
