# Tham khảo: Multi-Store & Scope

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/multi-sites/ms-admin

---

## 1. Store Hierarchy

Magento có 4 cấp scope:

```
Global
  └── Website (store_website table)
        └── Store / Store Group (store_group table)
              └── Store View (store table)
```

| Cấp | Table | Class | Mô tả |
|-----|-------|-------|-------|
| `global` | — | — | Toàn hệ thống |
| `website` | `store_website` | `Magento\Store\Model\Website` | Đơn vị cao nhất, có payment/shipping riêng |
| `store` (group) | `store_group` | `Magento\Store\Model\Group` | Có root category riêng |
| `store_view` | `store` | `Magento\Store\Model\Store` | Ngôn ngữ/giao diện cụ thể |

> **Lưu ý:** `\Magento\Store\Model\Store` đại diện cho `store_view`, không phải `store group`.

---

## 2. Config Inheritance

Config kế thừa từ trên xuống. Scope thấp hơn override scope cao hơn:

```
global → website → store_view
```

Ví dụ: `web/secure/base_url` có thể set khác nhau cho từng website.

### Đọc config theo scope

```php
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

// Lấy config theo store_view (phổ biến nhất)
$value = $this->scopeConfig->getValue(
    'vendor_module/general/enabled',
    ScopeInterface::SCOPE_STORE,
    $storeId  // null = current store
);

// Lấy config theo website
$value = $this->scopeConfig->getValue(
    'vendor_module/general/api_key',
    ScopeInterface::SCOPE_WEBSITE,
    $websiteId
);

// Lấy config global
$value = $this->scopeConfig->getValue('vendor_module/general/version');

// Kiểm tra flag (boolean)
$isEnabled = $this->scopeConfig->isSetFlag(
    'vendor_module/general/enabled',
    ScopeInterface::SCOPE_STORE
);
```

---

## 3. StoreManagerInterface

```php
use Magento\Store\Model\StoreManagerInterface;

// Lấy store hiện tại
$store = $this->storeManager->getStore();
$storeId = $store->getId();
$storeCode = $store->getCode();
$websiteId = $store->getWebsiteId();

// Lấy tất cả stores
$stores = $this->storeManager->getStores();

// Lấy tất cả websites
$websites = $this->storeManager->getWebsites();

// Lấy website theo ID
$website = $this->storeManager->getWebsite($websiteId);

// Lấy store theo code
$store = $this->storeManager->getStore('en_us');
```

> **Proxy pattern:** `StoreManagerInterface` nặng — inject qua Proxy trong class khởi tạo sớm:
> ```xml
> <argument name="storeManager" xsi:type="object">Magento\Store\Model\StoreManagerInterface\Proxy</argument>
> ```

---

## 4. Chạy code trong context của store cụ thể

```php
// Emulate store context (dùng trong cron/CLI)
$this->storeManager->setCurrentStore($storeId);

// Hoặc dùng emulation (an toàn hơn — tự restore)
use Magento\Store\Model\App\Emulation;

$this->emulation->startEnvironmentEmulation($storeId, \Magento\Framework\App\Area::AREA_FRONTEND);
try {
    // Code chạy trong context của $storeId
    $translatedText = __('Hello World'); // Dùng ngôn ngữ của store
} finally {
    $this->emulation->stopEnvironmentEmulation();
}
```

---

## 5. Multi-site với Nginx

```nginx
# Nginx config cho multi-site
map $http_host $MAGE_RUN_CODE {
    default '';
    'store1.example.com' 'store1';
    'store2.example.com' 'store2';
}

map $http_host $MAGE_RUN_TYPE {
    default '';
    'store1.example.com' 'website';
    'store2.example.com' 'website';
}
```

Hoặc dùng `MAGE_RUN_TYPE=store` để chạy theo store_view code.

---

## 6. Biến môi trường override config

Format: `CONFIG__<SCOPE>__<PATH>` (dấu `/` thay bằng `__`)

```bash
# Override config cho default scope
CONFIG__DEFAULT__WEB__SECURE__BASE_URL=https://example.com

# Override config cho website scope (website ID = 1)
CONFIG__WEBSITES__1__WEB__SECURE__BASE_URL=https://store1.example.com

# Override config cho store_view scope (store ID = 2)
CONFIG__STORES__2__GENERAL__LOCALE__CODE=vi_VN
```

---

## 7. System.xml — config theo scope

```xml
<!-- etc/adminhtml/system.xml -->
<field id="enabled" type="select" showInDefault="1" showInWebsite="1" showInStore="1">
    <label>Enable</label>
    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
</field>

<!-- Chỉ global -->
<field id="api_version" type="text" showInDefault="1" showInWebsite="0" showInStore="0">
    <label>API Version</label>
</field>
```

| Attribute | Ý nghĩa |
|-----------|---------|
| `showInDefault="1"` | Hiển thị ở scope global |
| `showInWebsite="1"` | Có thể override ở website scope |
| `showInStore="1"` | Có thể override ở store_view scope |

---

## 8. Lưu ý quan trọng

- **KHÔNG hardcode** store ID, website ID — luôn lấy từ `StoreManagerInterface` hoặc config
- Khi viết cron job xử lý multi-store: loop qua tất cả stores và emulate từng store
- `ScopeInterface::SCOPE_STORE` = store_view (không phải store group)
- Config lưu trong `core_config_data` table với `scope`, `scope_id`, `path`, `value`
- `scope_id = 0` = default/global scope

---

## 9. Lấy tất cả store views để xử lý

```php
// Pattern phổ biến trong cron job multi-store
foreach ($this->storeManager->getStores() as $store) {
    if (!$store->isActive()) {
        continue;
    }

    $this->emulation->startEnvironmentEmulation(
        $store->getId(),
        \Magento\Framework\App\Area::AREA_FRONTEND,
        true  // force = true để override current store
    );

    try {
        $this->processForStore($store);
    } finally {
        $this->emulation->stopEnvironmentEmulation();
    }
}
```

---

## Liên kết

- Config Paths: xem [config-paths.md](./config-paths.md)
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Multi-site Management: xem [multi-site-management.md](./multi-site-management.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
