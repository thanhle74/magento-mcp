# Tham khảo: Redis — Session & Cache Backend

Nguồn:
- https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cache/redis/redis-session
- https://experienceleague.adobe.com/docs/commerce-operations/implementation-playbook/best-practices/planning/redis-service-configuration.html

---

## 0. Tổng quan

Magento hỗ trợ Redis cho 3 mục đích:
1. **Default cache** (object cache, config cache...)
2. **Full Page Cache (FPC)**
3. **Session storage**

**Quy tắc bắt buộc:** Nếu dùng Redis cho nhiều mục đích, phải dùng **database number khác nhau**:

| Mục đích | DB number khuyến nghị |
|---|---|
| Default cache | `0` |
| Full Page Cache | `1` |
| Session storage | `2` |

---

## 1. Cấu hình Session Storage

### Qua CLI (khuyến nghị)

```bash
bin/magento setup:config:set \
  --session-save=redis \
  --session-save-redis-host=127.0.0.1 \
  --session-save-redis-port=6379 \
  --session-save-redis-db=2 \
  --session-save-redis-password='' \
  --session-save-redis-timeout=2.5 \
  --session-save-redis-compression-lib=gzip \
  --session-save-redis-max-concurrency=6 \
  --session-save-redis-break-after-frontend=5 \
  --session-save-redis-break-after-adminhtml=30 \
  --session-save-redis-first-lifetime=600 \
  --session-save-redis-bot-first-lifetime=60 \
  --session-save-redis-bot-lifetime=7200 \
  --session-save-redis-min-lifetime=60 \
  --session-save-redis-max-lifetime=2592000
```

### Kết quả trong `app/etc/env.php`

```php
'session' => [
    'save' => 'redis',
    'redis' => [
        'host' => '127.0.0.1',
        'port' => '6379',
        'password' => '',
        'timeout' => '2.5',
        'persistent_identifier' => '',
        'database' => '2',
        'compression_threshold' => '2048',
        'compression_library' => 'gzip',
        'log_level' => '1',
        'max_concurrency' => '6',
        'break_after_frontend' => '5',
        'break_after_adminhtml' => '30',
        'first_lifetime' => '600',
        'bot_first_lifetime' => '60',
        'bot_lifetime' => '7200',
        'disable_locking' => '0',
        'min_lifetime' => '60',
        'max_lifetime' => '2592000',
    ],
],
```

---

## 2. Cấu hình Default Cache Backend

```php
// app/etc/env.php
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server' => '127.0.0.1',
                'database' => '0',
                'port' => '6379',
                'password' => '',
                'compress_data' => '1',
                'compression_lib' => 'gzip',
            ],
        ],
        'page_cache' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server' => '127.0.0.1',
                'database' => '1',
                'port' => '6379',
                'password' => '',
                'compress_data' => '0',
            ],
        ],
    ],
],
```

---

## 3. Redis Sentinel (High Availability)

Sentinel cung cấp HA cho Redis — tự động failover khi master down.

### Session với Sentinel

```bash
bin/magento setup:config:set \
  --session-save=redis \
  --session-save-redis-sentinel-master=mymaster \
  --session-save-redis-sentinel-servers=sentinel1:26379,sentinel2:26379,sentinel3:26379 \
  --session-save-redis-sentinel-verify-master=1 \
  --session-save-redis-sentinel-connect-retries=5 \
  --session-save-redis-db=2
```

### Cache với Sentinel (env.php)

```php
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'sentinel_master' => 'mymaster',
                'sentinel_servers' => 'sentinel1:26379,sentinel2:26379',
                'database' => '0',
                'password' => '',
                'compress_data' => '1',
            ],
        ],
    ],
],
```

---

## 4. Redis L2 Cache (Adobe Commerce Cloud)

L2 cache dùng shared memory để giảm tải Redis khi nhiều PHP processes cùng request cache miss.

```yaml
# .magento.env.yaml (Cloud)
stage:
  deploy:
    REDIS_BACKEND: '\Magento\Framework\Cache\Backend\RemoteSynchronizedCache'
```

**Lưu ý L2:**
- Mặc định cleanup khi đạt 95% memory
- Chỉ dùng trên Cloud infrastructure
- Không áp dụng cho on-premises

---

## 5. Best Practices

| Khuyến nghị | Lý do |
|---|---|
| Dùng DB number riêng cho mỗi loại | Tránh xung đột key, dễ flush riêng lẻ |
| Bật compression (`gzip`) cho session | Giảm memory usage |
| Tắt compression cho FPC | FPC data đã nén, double-compress tốn CPU |
| Set `max_lifetime` hợp lý | Tránh session tồn tại quá lâu |
| Dùng Sentinel cho production | HA, tự động failover |
| Monitor memory usage | Redis không có eviction mặc định cho session |

---

## 6. Verify

```bash
# Kiểm tra Redis đang chạy
redis-cli ping

# Kiểm tra session đang dùng Redis
bin/magento config:show session/save

# Flush cache (không flush session)
bin/magento cache:flush

# Flush session Redis DB riêng
redis-cli -n 2 FLUSHDB
```

---

## Liên kết

- Cache Management: xem [cache-management.md](./cache-management.md)
- Performance: xem [performance.md](./performance.md)
- Deployment Pipeline: xem [../ops/deployment-pipeline.md](../ops/deployment-pipeline.md)
