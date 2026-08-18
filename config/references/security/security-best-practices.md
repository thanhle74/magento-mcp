# Tham khảo: Nguyên tắc bảo mật (Security Best Practices)

Nguồn: https://developer.adobe.com/commerce/php/development/security/

---

## 1. XSS Prevention (Chống chèn mã độc)

**QUY TẮC:** Mọi dữ liệu hiển thị ra Template (.phtml) ĐỀU PHẢI được xử lý qua Escaper.

```php
// Đúng:
<div class="name"><?= $escaper->escapeHtml($user->getName()) ?></div>
<a href="<?= $escaper->escapeUrl($link) ?>">Link</a>
<input value="<?= $escaper->escapeHtmlAttr($val) ?>" />

// Sai:
<div><?= $user->getName() ?></div>
```

---

## 2. Content Security Policy (CSP)

Dùng để cho phép các script/style từ bên thứ ba (CDN, Google, Facebook).

**`etc/csp_whitelist.xml`:**
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Csp:etc/csp_whitelist.xsd">
    <policy id="script-src">
        <values>
            <value id="google-analytics" type="host">*.google-analytics.com</value>
        </values>
    </policy>
</config>
```

---

## 3. Form Keys (Chống CSRF)

Mọi form thực hiện hành động (POST) trong Magento đều phải có Form Key.

```html
<form action="..." method="post">
    <?= $block->getBlockHtml('formkey') ?>
    <input type="text" name="name" />
    <button type="submit">Gửi</button>
</form>
```

---

## 4. Bảo mật Admin (ACL)

Mọi menu và controller trong Admin đều phải được gán tài nguyên và kiểm tra quyền.

**`etc/acl.xml`:**
```xml
<resource id="Vendor_Module::manage" title="Quản lý Module MyModule" sortOrder="10" />
```

**Controller:**
```php
protected function _isAllowed() {
    return $this->_authorization->isAllowed('Vendor_Module::manage');
}
```

---

## 5. Mã hóa dữ liệu (Encryption)

Dùng `EncryptorInterface` để mã hóa dữ liệu nhạy cảm trước khi lưu vào Database.

```php
// Mã hóa:
$encrypted = $this->encryptor->encrypt($password);

// Giải mã:
$decrypted = $this->encryptor->decrypt($encrypted);
```

---

## 6. Mass Assignment (Gán dữ liệu hàng loạt)

**CẢNH BÁO:** Tuyệt đối không dùng `$model->setData($request->getParams())`.
Hãy chỉ gán những trường được phép (Whitelist) hoặc dùng Service Contracts (Data Interface).

---

## 6. Mã hóa mật khẩu (Argon2ID)

Magento 2.4.4+ sử dụng Argon2ID (chuẩn hiện đại nhất) để băm mật khẩu. 
- Không bao giờ lưu mật khẩu dưới dạng plain text hoặc các hàm băm yếu (md5, sha1).

---

## 7. Chống Clickjacking & Cache Poisoning

### X-Frame-Options
Ngăn chặn việc nhúng website vào iframe trên trang web khác.
- Cấu hình trong `app/etc/env.php`: `'x-frame-options' => 'SAMEORIGIN'`.

### Cache Poisoning
Ngăn chặn thao túng bộ nhớ đệm qua Header giả mạo.
- Loại bỏ các Header nhạy cảm (`X-Rewrite-Url`, `X-Original-Url`) tại tầng Web Server (Nginx/Apache) trước khi gửi tới Varnish.

---

## 8. Bảo mật thực thi (Cron & CLI)

- **Cron Security:** Chặn truy cập công khai vào các file cron qua HTTP. Chỉ cho phép chạy qua Linux Crontab (CLI).
- **Security.txt:** Triển khai file `.well-known/security.txt` để công bố chính sách báo lỗi bảo mật của dự án.

---

## 9. SQL Injection Prevention

Luôn dùng parameterized queries, không nối chuỗi SQL trực tiếp.

```php
// ✅ Đúng — dùng bind param
$connection = $this->resourceConnection->getConnection();
$select = $connection->select()
    ->from('catalog_product_entity')
    ->where('sku = ?', $sku);  // ? được escape tự động

// ✅ Đúng — dùng quoteInto
$where = $connection->quoteInto('entity_id = ?', $entityId);

// ❌ Sai — nối chuỗi trực tiếp
$select = "SELECT * FROM catalog_product_entity WHERE sku = '$sku'";
```

---

## 10. Input Validation

```php
// Validate trong Service/Repository
if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    throw new \Magento\Framework\Exception\InputException(__('Invalid email address.'));
}

// Validate trong Controller
$name = $this->getRequest()->getParam('name');
if (!preg_match('/^[a-zA-Z0-9\s]+$/', $name)) {
    throw new \Magento\Framework\Exception\InputException(__('Invalid name format.'));
}
```

---

## Liên kết

- ACL: xem [acl.md](./acl.md)
- Configuration Management: xem [configuration-management.md](./configuration-management.md)
- Web API Auth: xem [web-api.md](./web-api.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
