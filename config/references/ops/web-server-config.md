# Tham khảo: Web Server Config (Nginx edge, ModSecurity, PHP-FPM)

> Từ khóa tra cứu: nginx bot filtering, map http_user_agent, is_bot, Storebot, nginx -t reload, ModSecurity SecRequestBodyNoFilesLimit, request body limit 1MB, max_input_vars, upload_max_filesize typo, PHP-FPM worker sizing, OOM killer.

---

## 1. Nginx bot filtering — pattern, vị trí lớp, bảo trì regex

### Pattern cơ bản

`map` bắt buộc nằm ở **http context** (`conf.d/*.conf`), không nằm trong `server`:

```nginx
# /etc/nginx/conf.d/bots.conf
map $http_user_agent $is_bot {
    default                    0;
    ~*Googlebot                1;
    ~*Storebot                 1;   # stem ngắn — Storebot-Google KHÔNG khớp Googlebot
    ~*Amzn                     1;   # Amazon bot family cũng dùng stem
    ~*bot|crawl|spider         1;
}
```

Block trong location cụ thể — trả **JSON 200 siêu nhẹ** thay vì 403 (botindexer/co
tool xếp hạng không tăng error rate, app consumer parse được):

```nginx
location /api/ {
    if ($is_bot) {
        return 200 '{"eligible":false,"status":false,"content":""}';
    }
    ...
}
```

### Bài học vận hành

1. **Regex UA là tài sản cần bảo trì**: `Storebot-Google` **KHÔNG** khớp `Googlebot`
   → Google Storebot lọt 100% trong khi tưởng đã chặn. Dùng **stem ngắn** (`Storebot`,
   `Amzn`) thay vì tên đầy đủ; định kỳ verify UA mới trong access log.
2. **Block phải đặt đúng lớp mà traffic đi qua**: block trên app server không chặn được
   bot cào thẳng domain khác/qua CDN trung gian (CloudFront) — cần WAF/edge rule riêng
   cho từng entry point.
3. `nginx -t` **trước mọi lần** `nginx -s reload` — config lỗi làm reload rơi cả vhost lành.
4. **Verify chuẩn**: từ origin

```bash
curl -I -A "Mozilla/5.0 (...; Storebot-Google/1.0)" \
     -H "Host: <domain>" http://127.0.0.1/<path>
# Content-Length nhỏ (vd 46) = chặn chuẩn; so $bytes_sent trong log (blocked kèm headers)
```

5. **Kiểm tra hostname/server trước khi sửa config** — dễ sửa nhầm server khác trong cụm
   (vd `*-admin` vs `*-prod`); `hostname` trước, `nginx -T | grep` sau.

---

## 2. ModSecurity — request body limit "dối" với editor

`SecRequestBodyNoFilesLimit` (mặc định hay 1MB trong `/etc/httpd/conf.d/mod_security.conf`)
chỉ giới hạn phần body **KHÔNG phải file**:

- HTML/**base64 dán vào editor** (banner, landing) tính là text → đụng trần 1MB → 503.
- Ảnh upload bằng **file input thì KHÔNG** tính vào giới hạn này (trần file riêng
  `SecRequestBodyLimit` ~128MB).

→ Triệu chứng "upload lỗi" mà thực ra chỉ save content lớn chết, upload ảnh luôn OK —
dễ chẩn đoán nhầm. Bằng chứng: log `ModSecurity: Request body no files data length is
larger than the configured limit (1048576)`; save body nhỏ vẫn 302 thành công.

**Fix:** raise có chủ đích cho admin path:

```apache
<LocationMatch "^/<admin_frontname>/">
    SecRequestBodyNoFilesLimit 10485760
</LocationMatch>
```

Kèm vệ sinh PHP config cùng lúc: `max_input_vars = 5000` (đừng 50000 — đã đủ cho admin
form, giá lớn hơn chỉ đốt memory); soát typo `upload_max_filesize = 20MM` → `20M`
(`20MM` parse thành **0**).

---

## 3. Dấu hiệu phân biệt lỗi web server vs Magento

- **503 trả đúng 299 bytes** = error page mặc định Apache/httpd — request chưa từng chạm
  Magento; lỗi nằm ở FPM/mod_security/proxy.
- Lỗi chỉ xuất hiện trong `error_log` (format ngày `[Wed Sep 29 08:19:46]`) trong khi
  `access_log` dùng format `29/Sep/2026` — grep nhầm format cho kết quả "log trống" sai.
- FPM sizing + OOM chain: xem [maintenance-cli.md](./maintenance-cli.md).

---

## Liên kết

- FPM & CLI vận hành: xem [maintenance-cli.md](./maintenance-cli.md)
- Deploy troubleshooting: xem [deploy-troubleshooting.md](./deploy-troubleshooting.md)
- Cloudflare edge cache: xem [../core/debugging-troubleshooting.md](../core/debugging-troubleshooting.md)
