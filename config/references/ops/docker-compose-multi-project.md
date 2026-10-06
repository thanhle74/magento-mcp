# Docker Compose — Chạy nhiều Magento stack trên 1 host

> Từ khóa tra cứu: docker compose multi project, container_name conflict, port conflict, ports reset, cloudflare tunnel token, TUNNEL_TOKEN, throwaway container, phpunit container, www uid 1000, MySQL server has gone away, setup:di:compile không cần DB, alpine rm mount

---

## 1. Coexistence nhiều stack trên 1 host

Chạy 2+ Magento stack (mỗi stack 1 compose project) trên cùng 1 host là Pattern chuẩn khi làm nhiều dự án song song. Các xung đột đã gặp lặp lại >= 4 lần:

| Xung đột | Nguyên nhân | Hậu quả |
|----------|-------------|---------|
| Tunnel name conflict | 2 service đặt cùng `container_name` (vd `local-tunnel`) | Project sau fail `up` với "Conflict. The container name is already in use" |
| Port 9200 | 2 OpenSearch/Elasticsearch bind cùng host port | Container sau khởi động chết |
| Host ports 80/3306/6379 | Mỗi stack đều bind web/DB/Redis ra host | Port đã allocated |

**Quy tắc bất di bất dịch: `container_name` phải unique toàn cục trên host** — Docker không scope `container_name` theo compose project. Đặt tên có tiền tố project: `<project>-web`, `<project>-db`, `<project>-phpfpm-1`.

### Cách đúng khi dự án khác chiếm port: KHÔNG bind host port

Giao tiếp container-to-container qua network nội bộ của compose project (service name = DNS). Host port chỉ cần cho những thứ bạn truy cập trực tiếp từ máy (web). Nếu service nào bị dự án khác chiếm port và bạn vẫn để `ports` trong base file, override trong file dev riêng bằng `!reset` (compose v2.24+):

```yaml
# compose.dev-linux.yaml — gỡ toàn bộ host ports của service (giữ network nội bộ)
services:
  elasticsearch:
    ports: !reset []
```

> Gotcha: `!reset []` là tính năng compose v2.24+. Trên bản cũ hơn, tag này bị hiểu là YAML tag lạ và fail parse — kiểm tra `docker compose version` trước khi dùng.

### Chạy stack phụ không cần tunnel: `--scale tunnel=0`

Stack phụ thường chỉ cần test nội bộ — đừng start tunnel của nó (né cả conflict
`container_name` lẫn rủi ro dính token chung):

```bash
docker compose -f compose.yaml -f /tmp/override-no-host-ports.yaml up -d app db opensearch
# hoặc: docker compose ... up -d --scale tunnel=0
```

Override file để **ngoài repo** (vd `/tmp/`) khi nó chỉ phục vụ test tạm thời — tránh lan
vào compose chuẩn.

### Verify stack nội bộ bằng curl TỪ TRONG container

Kết quả từ trong network nội bộ là hợp lệ **cả khi public tunnel đang trỏ về project
khác** — không cần đụng DNS/tunnel để chứng minh stack sống:

```bash
docker exec <project>-app-1 curl -s -o /dev/null -w '%{http_code}' \
  -H 'Host: <base_url-hostname-trong-DB>' https://127.0.0.1:8443/
```

`Host:` header phải khớp hostname trong `core_config_data` (`web/unsecure/base_url`) —
khớp sai thì Magento vẫn 302 về base_url cũ dù HTTPS handshake ổn.

---

## 2. Chuỗi lệnh chạy chuẩn (nhiều file `-f`)

Stack Magento tách config theo lớp, chạy bằng cách ghép nhiều file — thứ tự `-f` quyết định độ ưu tiên (file sau đè file trước):

```bash
docker compose \
  -f compose.yaml \
  -f compose.healthcheck.yaml \
  -f compose.dev.yaml \
  -f compose.dev-linux.yaml \
  [-f compose.local-tunnel.yaml] \
  up -d
```

Tắt tunnel mà không sửa file — scale service về 0:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --scale tunnel=0
```

> Gotcha: phải lặp lại **đầy đủ** chuỗi `-f` cho mọi thao tác sau đó (`down`, `logs`, `exec`). Chạy `docker compose down` không có đủ `-f` là compose đọc base file riêng lẻ và có thể recreate container sai config.

---

## 3. Cloudflare Tunnel multi-project — bẫy token chung

**2 compose project dùng chung 1 `TUNNEL_TOKEN` = 1 tunnel duy nhất với 2 replica.** Cloudflare load-balance ngẫu nhiên giữa 2 replica: một nửa request vào đúng app, một nửa rơi sang app của dự án kia. Triệu chứng: truy cập domain A thì ~50% lần ra domain B — bẫy ngầm, khó đoán vì mỗi lần refresh kết quả khác nhau.

Quy tắc:

- **Mỗi project 1 token riêng** (tạo tunnel riêng trên Cloudflare dashboard).
- Dùng dashboard-managed ingress (remote-managed tunnel, chỉ cần `TUNNEL_TOKEN`), không cần file config.yml bên container:

```yaml
services:
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: <project>-tunnel
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
```

- Ingress trên dashboard trỏ Service `http://app:80` — tên service `app` phải resolve được trong **network của project đó** (tunnel join cùng network).
- **Path phải để RỖNG** — để `/` trong dashboard có thể match chặt hơn bạn tưởng (một số config Path `/` không match request root theo cách bạn mong); bỏ trống để catch-all toàn bộ hostname.
- **Ingress Service phải khớp port nginx thật sự listen**: nginx trong container Magento thường chỉ listen **8000/8443**, không phải 80 — Service `http://app:80` → 502 connection refused. Đổi thành `http://app:8000` (hoặc 8443 với TLS nội bộ).
- **Đổi hostname tunnel thì đổi `base_url` trong DB rồi `cache:flush`** — Magento cũ luôn 302 về hostname trong `web/unsecure/base_url` dù tunnel/ingress đã đúng.
- File env chứa `TUNNEL_TOKEN` **phải untracked** (`.gitignore`) — token là credential điều khiển routing toàn zone; phát hiện 2 project trùng token bằng `md5sum` 2 file env giống hệt nhau.

---

## 4. Container runner khi host không có PHP

Host chỉ có Docker, không có PHP/Composer — chạy tool CLI (phpunit, phpcs, composer) qua **throwaway container** mount worktree:

```bash
docker run --rm -it \
  -v "$PWD":/workdir -w /workdir \
  -v "/path/to/main-checkout/vendor":/workdir/vendor:ro \
  --network <project>_magento \
  php:8.3-cli vendor/bin/phpunit -c dev/tests/unit/phpunit.xml \
    app/code/Vendor/Module/Test/Unit
```

Các điểm chết người nếu bỏ qua:

- **Bind-mount `vendor/` của main checkout READ-ONLY (`:ro`)**: worktree mới không có `vendor/`; mount kiểu này để dùng lại vendor đã install mà không cho runner ghi đè. Bắt buộc `:ro` vì đường dẫn vendor chứa symlink (vd `magento/module-*/` trỏ về magento-base); nếu cho ghi, symlink sẽ resolve `__DIR__` **sai tree** — class loader nạp code từ tree khác, test pass/fail sai nguồn.
- **`composer.lock` phải identical** giữa worktree và main checkout (đạt được khi worktree được tạo từ cùng commit). Lock lệch → autoloader classmap trỏ vào class không tồn tại trong tree → lỗi "class not found" trong khi file hiển nhiên có.
- `--network <project>_magento`: connect vào network của stack để test chạm được DB/Redis/Elasticsearch qua service name.
- Extension `sodium` thường thiếu trên image `php:*-cli` thuần — các path mã hóa/giải mã env sẽ chết; cài qua `docker-php-ext-install sodium` trong Dockerfile runner hoặc dùng image Magento chính thức.
- Request đi qua proxy/tunnel cần header `X-Forwarded-Proto: https` mới sinh URL đúng scheme — khi test controller trong container nhớ set header này, nếu không Magento redirect 307 về `http://`.

---

## 5. Chạy CLI đúng user trong container

Chạy phpunit / bin/magento **bên trong phpfpm đang chạy** (không phải container mới):

```bash
docker exec <project>-phpfpm-1 sh -c 'cd /var/www/html && vendor/bin/phpunit -c dev/tests/unit/phpunit.xml app/code/<Vendor>/<Module>/Test/Unit'
```

User chạy lệnh:

- User owner file Magento trong container là **`www` (uid 1000)** — được map để trùng uid host user — **KHÔNG phải `www-data`**.
- `docker exec` mặc định vào **root**. Chạy phpunit/magento bằng root → file sinh ra trong `generated/`, `var/cache` owned bởi root → request web tiếp theo chạy bằng `www` → **Permission denied** và ghi log chết container.
- Nếu bắt buộc exec bằng user khác: `docker exec -u www <project>-phpfpm-1 sh -c '...'`.

> Dev mode không cần `setup:di:compile` trước khi chạy unit test — autoloader + generated code đã có sẵn trong mount. Chỉ compile khi thêm class mới mà interceptor chưa sinh.

---

## 6. MySQL container cold-start — "MySQL server has gone away" giả

Ngay sau `up -d`, MySQL container báo healthy theo healthcheck riêng nhưng lần kết nối đầu từ Magento vẫn chết với `SQLSTATE[HY000] [2006] MySQL server has gone away` — đây là **giả lỗi**: innodb buffer pool đang warm-up, first connection trong window khởi động bị drop.

Chuẩn hóa: **wait-ready loop** trước khi chạy bất kỳ lệnh Magento nào sau `up`:

```bash
until docker exec <project>-mysql-1 mysqladmin ping -hlocalhost -uroot -p"${DB_PASS}" --silent; do
  echo "Waiting for MySQL..."; sleep 2
done
```

Không wrap lệnh migrate/import trong script nào bỏ qua bước này.

---

## 7. Compile khi không resolve được DB

`setup:di:compile` đọc `env.php` và chết ngay bước đầu nếu hostname DB không resolve (vd compile ở môi trường không có DB, hoặc compile khi stack chưa `up`):

```
Could not validate ... Connection refused / Host not found
```

Trick an toàn, có chủ đích:

```bash
mv app/etc/env.php app/etc/env.php.bak
bin/magento setup:di:compile   # chạy ở trạng thái chưa-cài-đặt — không chạm DB
mv app/etc/env.php.bak app/etc/env.php
```

Nhớ trả lại `env.php` ngay trong cùng 1 script — quên bước này là lần `bin/magento` sau báo "Magento is not installed".

---

## 8. Cảnh báo xóa file trong container (alpine `rm` + bind mount)

Container shell (alpine) chạy `rm -rf` trên **bind mount** sẽ xóa cả file bên ngoài host — và vì tiến trình chạy bằng root trong container, file xóa mất owner/user của host, không vào thùng rác. Đặc biệt nguy hiểm khi "dọn" `generated/`, `var/` từ container trỏ nhầm path. Quy tắc:

- Luôn `cd` + xác nhận `$PWD` trước khi `rm -rf` trong container.
- Dọn generated/cache chỉ cần `bin/magento cache:clean` / `rm` bên trong đúng `/var/www/html`, không `rm` theo path tuyệt đoán từ root `/`.
- Muốn xóa file của user trên host: chạy ở host, không chạy qua container.

---

## Verify bắt buộc

1. `docker compose -f ... config` — in ra config đã merge, kiểm tra `!reset` có hiệu lực và không còn host port đụng chéo.
2. `docker ps` — không container nào của 2 project cùng tên/cùng port.
3. curl domain A x10 — 10/10 response đúng app A (chứng minh tunnel token không chung).
4. `docker exec -u www ... vendor/bin/phpunit` pass, sau đó kiểm tra `ls -la generated/` vẫn owner `www`.

---

## Liên kết

- Troubleshooting sau deploy: xem [deploy-troubleshooting.md](deploy-troubleshooting.md)
- DDEV tương đương: xem [docker-ddev.md](docker-ddev.md)
- Redis backend & cache key: xem [../infrastructure/redis.md](../infrastructure/redis.md)
- Deploy pipeline: xem [deployment-pipeline.md](deployment-pipeline.md)
