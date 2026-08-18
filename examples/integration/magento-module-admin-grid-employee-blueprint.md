# Magento Module Blueprint: `NullTraceX_Employee` (Admin Grid + Form + Repository)

Mục tiêu: lưu một reference "golden path" từ module thật để AI bám đúng cấu trúc khi bạn yêu cầu build module mới.

Nguồn chuẩn: `app/code/NullTraceX/Employee`

---

## 1) Bộ file cốt lõi cần có

### 1.1 Module bootstrap

- `registration.php`
- `etc/module.xml`
- `composer.json` (optional nhưng nên có)

### 1.2 DB + Model layer

- `etc/db_schema.xml`
- `Model/Employee.php`
- `Model/ResourceModel/Employee.php`
- `Model/ResourceModel/Employee/Collection.php`

### 1.3 Service contract (API nội bộ + webapi)

- `Api/Data/EmployeeInterface.php`
- `Api/EmployeeRepositoryInterface.php`
- `Model/EmployeeRepository.php`
- `etc/di.xml`
- `etc/webapi.xml`

### 1.4 Admin routing + ACL + menu

- `etc/adminhtml/routes.xml`
- `etc/adminhtml/menu.xml`
- `etc/acl.xml`

### 1.5 Admin controllers (CRUD)

- `Controller/Adminhtml/Employee/Index.php`
- `Controller/Adminhtml/Employee/NewAction.php`
- `Controller/Adminhtml/Employee/Edit.php`
- `Controller/Adminhtml/Employee/Save.php`
- `Controller/Adminhtml/Employee/Delete.php`

### 1.6 Admin UI component (grid + form)

- `view/adminhtml/layout/employee_employee_index.xml`
- `view/adminhtml/layout/employee_employee_edit.xml`
- `view/adminhtml/layout/employee_employee_new.xml`
- `view/adminhtml/ui_component/employee_listing.xml`
- `view/adminhtml/ui_component/employee_form.xml`
- `Ui/DataProvider/EmployeeDataProvider.php`
- `Ui/Component/Listing/Column/EmployeeBlockActions.php`
- `Ui/Component/Listing/Column/Status.php`

### 1.7 Optional UI customizations

- `Block/Form/Employee/Back.php`
- `Block/Form/Employee/Save.php`
- `Block/Form/Employee/Delete.php`
- `Block/Form/Employee/SaveAndContinueButton.php`
- `view/adminhtml/web/js/format-price.js`
- `view/adminhtml/web/template/grid/cells/response-request.html`

---

## 2) Build order khuyến nghị (để ít lỗi nhất)

1. Tạo bootstrap module (`registration.php`, `module.xml`).
2. Tạo `db_schema.xml` và chạy upgrade.
3. Tạo Model + ResourceModel + Collection.
4. Tạo Service Contract (`Api/*`, repository, `di.xml`).
5. Tạo admin route/menu/acl.
6. Tạo controllers CRUD admin.
7. Tạo layout handles + UI components grid/form.
8. Tạo DataProvider + custom listing columns/actions.
9. Tạo block buttons/custom JS templates nếu cần.
10. Verify với cache clean, compile, và truy cập admin grid.

---

## 3) Prompt mẫu để tái sử dụng blueprint này

```text
Dùng module blueprint tại `.spec/examples/integration/magento-module-admin-grid-employee-blueprint.md`.
Tạo module mới `<Vendor_Module>` theo cùng kiến trúc như `NullTraceX_Employee`.
Chỉ sửa trong phạm vi: `app/code/<Vendor>/<Module>`.
Yêu cầu output:
1) Danh sách file sẽ tạo theo từng phase,
2) Code cho từng file,
3) Các lệnh verify sau khi tạo xong.
```

---

## 4) Verify checklist nhanh

- `bin/magento setup:upgrade`
- `bin/magento setup:di:compile`
- `bin/magento cache:flush`
- Grid load được ở admin menu.
- Create/Edit/Delete hoạt động.
- ACL chặn đúng quyền.
- Web API route chạy đúng với token phù hợp.

---

## 5) Notes khi clone sang module khác

- Đổi toàn bộ namespace/path/resource key theo module mới.
- Đồng bộ tên `frontName`, route controller, và layout handles.
- Đồng bộ `primary key` trong:
  - db schema
  - model/resource model
  - ui listing data source (`indexField`, `primaryFieldName`, `requestFieldName`)
- Giữ naming nhất quán để giảm lỗi mapping ở UI component.

---

## 6) Gotchas thường gặp (đúc kết từ thực tế)

### 6.1 `<buttons>` trong listing UI component — KHÔNG dùng comment rỗng

**Lỗi:** `TypeError: addButtons(): Argument #1 ($buttons) must be of type array, string given`

**Nguyên nhân:** Viết `<buttons><!-- comment --></buttons>` khiến Magento parse thành string thay vì array.

**Fix:** Nếu grid read-only không cần button, **xóa hẳn** thẻ `<buttons>` khỏi `<settings>`, đừng để trống hay comment bên trong.

```xml
<!-- SAI -->
<settings>
    <buttons>
        <!-- read-only: no Add button -->
    </buttons>
</settings>

<!-- ĐÚNG — xóa hẳn thẻ buttons -->
<settings>
    <spinner>my_listing_columns</spinner>
</settings>
```

---

### 6.2 `DataProvider::getData()` — KHÔNG dùng `toArray()`

**Lỗi:** `Uncaught TypeError: Cannot create property '_rowIndex' on number '0'` (JS, provider.js)

**Nguyên nhân:** `$collection->toArray()` trả về array với numeric keys và flat values — Magento UI grid cần mỗi item là associative array (object).

**Fix:** Dùng `$item->getData()` trong vòng lặp:

```php
// SAI
'items' => array_values($this->getCollection()->toArray()),

// ĐÚNG
$items = [];
foreach ($this->getCollection() as $item) {
    $items[] = $item->getData();
}
return [
    'totalRecords' => $this->getCollection()->getSize(),
    'items'        => $items,
];
```

---

### 6.3 `acl.xml` — KHÔNG nest theo menu hierarchy

**Lỗi:** "Sorry, you need permissions to view this content" dù đã grant role.

**Nguyên nhân:** Nest ACL resource theo menu tree (`Magento_Backend::admin > Laybyland_Base::menu > ...`) không cần thiết và có thể gây conflict với ACL tree của module khác.

**Fix:** Đặt resource trực tiếp dưới `Magento_Backend::admin`, không cần mirror menu:

```xml
<!-- SAI — nest quá sâu theo menu -->
<resource id="Magento_Backend::admin">
    <resource id="Laybyland_Base::menu">
        <resource id="Laybyland_PaySquad::menu" title="PaySquad">
            <resource id="Laybyland_PaySquad::webhook_log" title="Webhook Logs"/>
        </resource>
    </resource>
</resource>

<!-- ĐÚNG — flat dưới admin -->
<resource id="Magento_Backend::admin">
    <resource id="Laybyland_PaySquad::menu" title="PaySquad" sortOrder="60">
        <resource id="Laybyland_PaySquad::webhook_log" title="Webhook Logs" sortOrder="10"/>
    </resource>
</resource>
```

Sau khi sửa `acl.xml`: vào **System > Permissions > User Roles** → grant resource cho role → Save.
