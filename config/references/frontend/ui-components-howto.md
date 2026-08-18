# UI Components — How-to & Debug (tóm tắt)

Tài liệu này tóm tắt các bài **how-to** và **debug** chính thức; chi tiết và mã đầy đủ xem từng link Adobe bên dưới.

---

## 1. Thêm thuộc tính Category lên form Admin

Nguồn: [Add a category attribute](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/add-category-attribute)

**Ý tưởng:** Magento 2 không tự hiện EAV category attribute trên form — cần merge `category_form.xml` và khai báo `<field>` trùng **attribute code**.

**Bước tạo attribute:** Dùng `EavSetup::addAttribute` trên entity `Magento\Catalog\Model\Category::ENTITY` (tài liệu Adobe dùng `InstallData`; dự án có thể chuyển sang **Data Patch** thay `InstallData` cho đồng bộ với [declarative schema / patch](../core/data-schema-patch.md) trong constitution).

**Bước hiển thị:** Tạo `view/adminhtml/ui_component/category_form.xml`, thêm `<fieldset>` khớp group (vd. `display_settings`) và `<field name="attribute_code">` với `config`: `dataType`, `formElement`, `label`, `valueMap`/`prefer` (toggle), v.v. — `name` field phải khớp **attribute code**.

**Cơ chế:** XML merge với base `category_form.xml`. `<field>` tham chiếu `formElement` → node tương ứng trong `definition.xml` → file JS (`component` trong defaults) — override qua `config` XML (vd. `prefer: toggle`).

---

## 2. Checkbox hiện/ẩn mật khẩu (storefront / form tùy chỉnh)

Nguồn: [Show/hide password checkbox](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/show-hide-password-checkbox)

**Không** phải Admin UI Component XML — dùng **Knockout `scope`** + khởi tạo `Magento_Ui/js/core/app`.

1. Trong `.phtml`: khối `data-bind="scope: 'showPassword'"` + `<!-- ko template: getTemplate() -->`.
2. Script `text/x-magento-init` khởi tạo component `Magento_Customer/js/show-password`, truyền `passwordSelector` (vd. `#pass`).

Tham số: `component` (RequireJS), `passwordSelector` (selector ô password). File tham chiếu: `Magento_Customer/view/frontend/web/js/show-password.js`.

---

## 3. Khai báo UI Component tùy chỉnh (XML)

Nguồn: [Declare a custom UI component](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/new-component-declaration)

**Phần tử gốc:** `<component>` (thường **không** có con — mặc định `uiElement`) hoặc `<container>` (có con — mặc định `uiCollection`).

**Thuộc tính tùy chọn (cả hai):** `component` (JS), `class` (PHP), `template`, `provider`, `sortOrder`, `displayArea`.

**Thứ tự con bên trong** (nếu có): `<argument>` → `<settings>` → phần tử con (theo doc).

**Form/Listing lớn:** khai báo trong file `ui_component/*.xml`, nhúng qua layout (`uiComponent`).

**Lưu ý:** Doc ghi rõ — **phiên bản hiện tại chưa hỗ trợ secondary components** theo nghĩa trong bài.

---

## 4. Render giá (listing / widget)

Nguồn: [Render prices on the frontend](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/price-rendering)

**Bối cảnh:** Nhiều loại giá (special, tier, grouped, bundle min/max, MSRP) map sang **price types** (final, regular, …) và **adjustments** (tax, FPT, …).

**Listing:** `dataSource` + `columns`; cột giá thường là composite (**price-box**) tạo con động (`renders.prices.children`: special_price, regular_price, …), mỗi mục có `component`, `bodyTmpl`, `productType`, `children` (vd. adjustment tax).

**DataProvider** nên cung cấp `price_info` có giá thô + `formatted` + `adjustments` theo cấu trúc doc.

**JS:** `getPrices`, `initPrices`, `layout(...)`; template Knockout gọi `hasSpecialPrice`, `getPrice`, `getAdjustments`, v.v. Tham chiếu core: Catalog listing/widget (vd. `widget_recently_viewed.xml`).

---

## 5. Mở rộng / cập nhật kiểu link (UrlInput)

Nguồn: [Update the page URL type](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/update-url-type)

**Luồng:** Class PHP implement [`\Magento\Ui\Model\UrlInput\ConfigInterface`](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/update-url-type) — `getConfig()` trả về `label`, `component` (thường extend `ui-select`), `searchUrl`, `validationUrl`, template, placeholder, v.v.

Đăng ký trong `di.xml` trên `Magento\Ui\Model\UrlInput\LinksConfigProvider` → `linksConfiguration` → item name (key loại link) → class.

**JS:** extend `Magento_Ui/js/form/element/ui-select` (vd. validate giá trị ban đầu qua AJAX).

**Backend:** controller **search** (query phân trang, trả `options` + `total`), controller **get selected** (theo id — trả một option hoặc rỗng).

Chi tiết đầy đủ trong doc; xem thêm [UrlInput trong thư viện](./ui-component-library.md) (§24.F).

---

## 6. Debug UI Components

Nguồn: [Debug UI components](https://developer.adobe.com/commerce/frontend-core/ui-components/debug)

**Chrome — Knockoutjs context debugger:** Extension giúp xem tên instance + config UI component khi inspect element (tab Knockout context).

**Console — Knockout thuần:**

```javascript
var ko = require('knockout');
var context = ko.contextFor($0); // $0 = element đang chọn trong DevTools
```

Ví dụ: `ko.contextFor($0).$data` — truy cập view model field (vd. `name` đầy đủ dạng `product_form...`).

**Chrome DevTools:** Sources, breakpoint, conditional breakpoint, execution trace; hoặc từ khóa `debugger` trong JS.

**Bổ sung:** [uiRegistry](https://developer.adobe.com/commerce/frontend-core/ui-components/) trong [ui-components-js-library.md](./ui-components-js-library.md) (`require('uiRegistry')`).

---

## Liên kết nhanh

| Chủ đề | Adobe |
|--------|--------|
| Category attribute + `category_form.xml` | [add-category-attribute](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/add-category-attribute) |
| Show/hide password | [show-hide-password-checkbox](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/show-hide-password-checkbox) |
| Custom component XML | [new-component-declaration](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/new-component-declaration) |
| Price listing / price-box | [price-rendering](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/price-rendering) |
| UrlInput link type | [update-url-type](https://developer.adobe.com/commerce/frontend-core/ui-components/howto/update-url-type) |
| Debug | [debug](https://developer.adobe.com/commerce/frontend-core/ui-components/debug) |

- Kiến trúc tổng quan: [ui-components.md](./ui-components.md)
- Thư viện component: [ui-component-library.md](./ui-component-library.md)
- JavaScript init scripts (`x-magento-init`, `data-mage-init`): [javascript-init-scripts.md](./javascript-init-scripts.md)
- Advanced JS series (KO + mixins + widget override): [advanced-javascript-series.md](./advanced-javascript-series.md)
- UI Components full series (13 bài Alan Storm): [ui-components-series.md](./ui-components-series.md)
- Frontend strategy series (React/PWA/UPWARD/Hyva): [magento-frontend-2020-series.md](./magento-frontend-2020-series.md)
