# Tham khảo: Adobe I/O Events for Commerce

Nguồn:
- https://developer.adobe.com/commerce/extensibility/events/module-development/
- https://developer.adobe.com/commerce/extensibility/events/installation/
- https://developer.adobe.com/commerce/extensibility/events/configure-commerce

---

## 0. Tổng quan

Adobe I/O Events cho phép Commerce emit events đến Adobe App Builder (hoặc bất kỳ webhook consumer nào) theo kiến trúc event-driven. Đây là cơ chế **out-of-process extensibility** — logic xử lý chạy ngoài Commerce, không ảnh hưởng performance của store.

**Khi nào dùng:**
- Sync dữ liệu với hệ thống bên ngoài (ERP, CRM, PIM)
- Trigger workflow khi có sự kiện Commerce (order placed, product saved...)
- Thay thế webhook custom bằng cơ chế chuẩn của Adobe
- Tích hợp với Adobe App Builder

**Yêu cầu:**
- Adobe Commerce (không có trên Magento Open Source)
- Adobe Developer Console account
- Commerce 2.4.4+ (2.4.6+ có sẵn, 2.4.4-2.4.5 cần cài thêm)

---

## 1. Cài đặt

### Commerce 2.4.6+ (tự động có)

```bash
bin/magento module:enable \
    Magento_AdobeCommerceEventsClient \
    Magento_AdobeCommerceEventsGenerator \
    Magento_AdobeIoEventsClient \
    Magento_AdobeCommerceOutOfProcessExtensibility
bin/magento setup:upgrade
```

### Commerce 2.4.4-2.4.5 (cài thêm)

```bash
composer require magento/commerce-eventing=^1.0 --no-update
composer update
bin/magento module:enable Magento_AdobeCommerceEventsClient ...
bin/magento setup:upgrade
```

---

## 2. Cấu hình Adobe Developer Console

1. Tạo project trong [Adobe Developer Console](https://developer.adobe.com/console)
2. Thêm **Adobe I/O Events** service vào project
3. Tạo **Event Provider** cho Commerce instance:
   ```bash
   bin/magento events:create-event-provider \
       --label "My Commerce Store" \
       --description "Events from production store"
   ```
4. Copy **Provider ID** vào Admin: **Stores > Configuration > Adobe Services > Adobe I/O Events > Adobe I/O Event Provider ID**

---

## 3. Đăng ký Events

### Cách 1: `etc/io_events.xml` (cố định, không thể unsubscribe)

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module-commerce-events-client/etc/io_events.xsd">

    <!-- Observer event: product saved -->
    <event name="observer.catalog_product_save_after">
        <fields>
            <field name="entity_id" />
            <field name="sku" />
            <field name="name" />
            <field name="price" />
            <field name="status" />
            <field name="is_new" />
        </fields>
    </event>

    <!-- Plugin event: invoice saved -->
    <event name="plugin.magento.sales.api.invoice_item_repository.save">
        <fields>
            <field name="entity_id" />
            <field name="parent_id" />
            <field name="base_price" />
            <field name="qty" />
        </fields>
    </event>

    <!-- Array field: order với items -->
    <event name="observer.sales_order_invoice_save_after">
        <fields>
            <field name="order_id" />
            <field name="items[].sku" />
            <field name="items[].qty" />
            <field name="grand_total" />
        </fields>
    </event>
</config>
```

### Cách 2: CLI (có thể subscribe/unsubscribe)

```bash
# Subscribe event
bin/magento events:subscribe observer.catalog_product_save_after \
    --fields=entity_id,sku,name,price

# Unsubscribe
bin/magento events:unsubscribe observer.catalog_product_save_after

# List tất cả events đã subscribe
bin/magento events:list
```

### Cách 3: `app/etc/config.php` hoặc `env.php`

```php
'io_events' => [
    'observer.catalog_product_save_after' => [
        'fields' => ['entity_id', 'sku', 'name', 'price'],
        'enabled' => 1
    ],
    'observer.sales_order_place_after' => [
        'fields' => ['entity_id', 'increment_id', 'grand_total', 'status'],
        'enabled' => 1
    ],
]
```

---

## 4. Tìm Events có sẵn

```bash
# List tất cả events của 1 module
bin/magento events:list:all Magento_Catalog

# Xem payload của 1 event
bin/magento events:info observer.catalog_product_save_after
```

Hoặc Admin: **System > Events > Events List**

---

## 5. Naming Convention cho Events

| Prefix | Loại event | Ví dụ |
|---|---|---|
| `observer.` | Observer event | `observer.catalog_product_save_after` |
| `plugin.` | Plugin event | `plugin.magento.sales.api.invoice_item_repository.save` |

**Plugin event format:** `plugin.<vendor>.<module>.<service_path>.<method>`

---

## 6. Generate Plugins sau khi đăng ký

Sau khi thêm events vào `io_events.xml`, phải generate plugins:

```bash
bin/magento events:generate:module
bin/magento setup:upgrade
bin/magento setup:di:compile
```

---

## 7. Payload Structure

Event payload được wrap trong metadata:

```json
{
    "event": {
        "data": {
            "value": {
                "entity_id": "3",
                "sku": "my-product",
                "name": "My Product"
            },
            "_metadata": {
                "commerceEdition": "Adobe Commerce",
                "commerceVersion": "2.4.8",
                "eventsClientVersion": "1.0.1",
                "storeId": "0",
                "websiteId": "1"
            },
            "source": "my-store.example.com"
        }
    }
}
```

---

## 8. Lưu ý quan trọng

- Chỉ truyền **fields cần thiết** — payload có thể rất lớn và chứa dữ liệu nhạy cảm (PCI)
- Dùng `*` để truyền tất cả fields: `<field name="*" />` — **không khuyến nghị** vì lý do bảo mật
- Events từ nhiều module đăng ký cùng event sẽ được **merge** (union of fields)
- Events trong `io_events.xml` **không thể unsubscribe** qua CLI
- Events trong `config.php`/`env.php` có thể disable: `'enabled' => 0`

---

## 9. Verify steps

```bash
# Kiểm tra module đã enable
bin/magento module:status Magento_AdobeCommerceEventsClient

# Kiểm tra events đã đăng ký
bin/magento events:list

# Test emit event thủ công
bin/magento events:emit observer.catalog_product_save_after \
    --fields='{"entity_id":"1","sku":"test"}'

# Kiểm tra log
tail -f var/log/system.log | grep -i "io_event\|adobe_io"
```

---

## Liên kết

- Message Queue: xem [message-queues.md](./message-queues.md)
- Observer/Event: xem [../core/events-observers.md](../core/events-observers.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
