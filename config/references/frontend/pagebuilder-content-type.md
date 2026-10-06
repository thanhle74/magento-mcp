# Page Builder Content Type Reference (Admin-side)

Source: https://developer.adobe.com/commerce/frontend-core/page-builder/content-types/create/

> ⚠️ **Warning — HTML Code content type & nội dung landing tự viết:**
>
> - Khi nhúng trang custom qua **HTML Code content type**, scope toàn bộ CSS trong **1 root class duy nhất** (vd `.slaunchpad-luxury-home`) — mọi selector phải nằm dưới root này để không rách style Admin PageBuilder và các block khác.
> - Media path phải **store-relative** (`/media/...`), **KHÔNG hardcode `http://localhost/...`** — nếu không page copy 1-block sang môi trường khác sẽ ảnh gãy.
> - **Validation gate trước khi gọi done:** (1) mở editor PageBuilder không broken serialization (content load nguyên vẹn, không lỗi KO), (2) FE trả HTTP 200, (3) check cả desktop + mobile viewport, (4) 0 console error, (5) **scroll đầy đủ trang** — ảnh lazy-load chỉ load khi vào viewport nên scroll nông gây false positive "broken".


## Structure

Vendor/Module/
- view/adminhtml/pagebuilder/content_type/my_type.xml
- view/adminhtml/ui_component/pagebuilder_my_type_form.xml
- view/adminhtml/web/js/content-type/my_type/preview.js
- view/adminhtml/web/js/content-type/my_type/master.js
- view/adminhtml/web/template/content-type/my_type/default/preview.html
- view/adminhtml/web/template/content-type/my_type/default/master.html
- view/frontend/web/templates/content-type/my_type/default/master.phtml

## content_type.xml

component=Magento_PageBuilder/js/content-type
preview_component=Vendor_Module/js/content-type/my_type/preview
master_component=Magento_PageBuilder/js/content-type/master
reader=Magento_PageBuilder/js/master-format/read/configurable

## preview.js (Prototypal inheritance NOT .extend)

define([Magento_PageBuilder/js/content-type/preview], function(PreviewBase) {
    var dollar_super;
    function Preview(contentType, config, observableUpdater) {
        PreviewBase.call(this, contentType, config, observableUpdater);
    }
    Preview.prototype = Object.create(PreviewBase.prototype);
    Preview.prototype.constructor = Preview;
    dollar_super = PreviewBase.prototype;
    Preview.prototype.getOptionValue = function(fieldName) {
        return this.contentType.dataStore.get(fieldName) || "";
    };
    return Preview;
});

## master.js

define([Magento_PageBuilder/js/content-type/master], function(Master) {
    return Master;
});

## preview.html bindings

attr=data.main.attributes ko-style=data.main.style css=data.main.css
event={mouseover:onMouseOver,mouseout:onMouseOut}
render args=getOptions().template

## master.html

div attr=data.main.attributes ko-style=data.main.style css=data.main.css

## Form extends pagebuilder_base_form

Schema: ui_configuration.xsd
Each field: argument config source=page + dataScope

## Troubleshooting

extend not function -> use Object.create prototypal
master.html 404 -> create KO template file
form loading -> check extends + source=page
XSD errors -> translate=label, no group attr, master_template not template
stage trắng trong admin (CSS custom) -> xem §Gotchas thực chiến dưới

## Gotchas thực chiến

### CSS `<style>` tag làm sập stage admin

Inject `<style>` vào preview để render live CSS: khi CSS chưa parse xong,
truy cập `styleSheet.cssRules` / `querySelector` trên nó trả **null** → exception trong
preview.js → **stage trắng** toàn bộ editor PageBuilder (không chỉ content type mình).
Fix: inject CSS dạng **JS string** (tạo text node / `style.sheet` thủ công) thay vì
phụ thuộc parse `<style>` tag — kiểm soát được thời điểm CSS sẵn sàng.

### `data-background-images` — escape trong DB dối khi debug

- DB lưu giá trị với **single backslash** (`{"background-image":"url(...)"}` JSON string
  trong attribute) — đọc bằng `mysql -N` (batch mode) thì output nhìn như
  **double-escape**: đó là lie của hiển thị terminal/log, không phải nội dung thật.
  So sánh chuỗi bằng app code hoặc `SELECT ... INTO` file, đừng so với output
  `mysql -N` dán tay.
- Media path trong attribute có **hash directory pattern** (`/media/ab/cd/<file>` từ
  hash tên file) — khi so sánh/ghi đè path, hash phải tính lại từ tên file, không copy
  path của record khác.
