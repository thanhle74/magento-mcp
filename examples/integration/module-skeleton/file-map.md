# File Map: Admin Grid CRUD Module Skeleton

Tạo các file sau trong `app/code/<Vendor>/<Module>`:

## 1) Bootstrap

- `registration.php`
- `etc/module.xml`
- `composer.json` (optional)

## 2) DB + Model

- `etc/db_schema.xml`
- `Model/<Entity>.php`
- `Model/ResourceModel/<Entity>.php`
- `Model/ResourceModel/<Entity>/Collection.php`

## 3) Service Contract

- `Api/Data/<Entity>Interface.php`
- `Api/<Entity>RepositoryInterface.php`
- `Model/<Entity>Repository.php`
- `etc/di.xml`
- `etc/webapi.xml` (nếu cần REST)

## 4) Admin config

- `etc/adminhtml/routes.xml`
- `etc/adminhtml/menu.xml`
- `etc/acl.xml`

## 5) Controllers

- `Controller/Adminhtml/<Entity>/Index.php`
- `Controller/Adminhtml/<Entity>/NewAction.php`
- `Controller/Adminhtml/<Entity>/Edit.php`
- `Controller/Adminhtml/<Entity>/Save.php`
- `Controller/Adminhtml/<Entity>/Delete.php`

## 6) Layout + UI components

- `view/adminhtml/layout/<route>_<controller>_index.xml`
- `view/adminhtml/layout/<route>_<controller>_edit.xml`
- `view/adminhtml/layout/<route>_<controller>_new.xml`
- `view/adminhtml/ui_component/<entity>_listing.xml`
- `view/adminhtml/ui_component/<entity>_form.xml`
- `Ui/DataProvider/<Entity>DataProvider.php`
- `Ui/Component/Listing/Column/<Entity>Actions.php`

## 7) Optional

- `Block/Form/<Entity>/Back.php`
- `Block/Form/<Entity>/Save.php`
- `Block/Form/<Entity>/Delete.php`
- `Block/Form/<Entity>/SaveAndContinueButton.php`

---

## Build order

1. Bootstrap module
2. Schema + model layer
3. Repository contracts
4. ACL + routes + menu
5. Controllers
6. UI components
7. Verify compile/runtime
