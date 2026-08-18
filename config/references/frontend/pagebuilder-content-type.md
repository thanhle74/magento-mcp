# Page Builder Content Type Reference (Admin-side)

Source: https://developer.adobe.com/commerce/frontend-core/page-builder/content-types/create/

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
