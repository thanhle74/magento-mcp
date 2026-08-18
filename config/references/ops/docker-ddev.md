# Docker/DDEV cho Magento 2 Development

Nguồn:
- [DDEV Magento 2 Setup](https://www.weeumson.com/posts/DDEV-for-Magento-2-local-dev/) — weeumson.com
- [DDEV Official Docs](https://ddev.readthedocs.io/en/stable/) — ddev.readthedocs.io
- [markshust/docker-magento](https://github.com/markshust/docker-magento) — github.com/markshust

---

## 1. DDEV — Local Development Environment

DDEV là wrapper cho Docker Compose, đơn giản hóa setup local environment.

### Cài đặt DDEV

```bash
# macOS
brew install ddev/ddev/ddev

# Ubuntu/Debian
curl -fsSL https://apt.fury.io/drud/gpg.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/ddev.gpg > /dev/null
echo "deb [signed-by=/etc/apt/trusted.gpg.d/ddev.gpg] https://apt.fury.io/drud/ * *" | sudo tee /etc/apt/sources.list.d/ddev.list
sudo apt update && sudo apt install -y ddev

# macOS/Windows: bật Mutagen để tăng I/O performance
ddev config global --mutagen-enabled
```

### Khởi tạo project Magento 2

```bash
mkdir my-magento && cd my-magento

# Init DDEV config
ddev config \
  --project-type=magento2 \
  --php-version=8.3 \
  --docroot=pub \
  --create-docroot \
  --disable-settings-management

# Thêm services
ddev get ddev/ddev-elasticsearch
ddev get ddev/ddev-varnish
ddev get ddev/ddev-cron

# Start
ddev start
```

### .ddev/config.yaml

```yaml
name: my-magento
type: magento2
php_version: "8.3"
webserver_type: nginx-fpm
docroot: pub
timezone: Asia/Ho_Chi_Minh
host_db_port: "3307"
omit_containers: [dba]
additional_fqdns: ["magento.test"]

hooks:
  post-start:
    - exec: /var/www/html/bin/magento cron:install
```

### Các lệnh DDEV thường dùng

```bash
# Start/Stop
ddev start
ddev stop
ddev restart

# SSH vào container
ddev ssh

# Chạy lệnh trong container
ddev exec bin/magento cache:clean
ddev exec composer install

# Shortcut cho bin/magento
ddev magento cache:clean
ddev magento setup:upgrade

# Database
ddev import-db --file=dump.sql.gz
ddev export-db --file=dump.sql.gz
ddev mysql  # MySQL console

# Xdebug
ddev xdebug on
ddev xdebug off
ddev xdebug toggle
ddev xdebug status

# Logs
ddev logs
ddev logs -f  # follow

# Status
ddev describe
ddev status
```

### Cài đặt Magento trong DDEV

```bash
# Tạo project
ddev composer create --repository=https://repo.magento.com/ \
  magento/project-community-edition:2.4.8 -y

# SSH vào container để install
ddev ssh

bin/magento setup:install \
  --base-url='https://my-magento.ddev.site/' \
  --db-host=db \
  --db-name=db \
  --db-user=db \
  --db-password=db \
  --elasticsearch-host=elasticsearch \
  --admin-firstname=Admin \
  --admin-lastname=Admin \
  --admin-email=admin@example.com \
  --admin-user=admin \
  --admin-password=Password1! \
  --language=en_US \
  --currency=USD \
  --timezone=Asia/Ho_Chi_Minh \
  --use-rewrites=1 \
  --backend-frontname=admin \
  --amqp-host="rabbitmq" \
  --amqp-port="5672" \
  --amqp-user="rabbitmq" \
  --amqp-password="rabbitmq" \
  --amqp-virtualhost="/"

# Sau install
bin/magento deploy:mode:set developer
bin/magento module:disable Magento_TwoFactorAuth
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento indexer:reindex
bin/magento cache:flush
```

---

## 2. markshust/docker-magento

Alternative Docker setup phổ biến cho Magento 2.

### Cài đặt

```bash
# Clone setup scripts
curl -s https://raw.githubusercontent.com/markshust/docker-magento/master/lib/onelinesetup | bash -s -- magento.test 2.4.8 community

# Hoặc manual
git clone https://github.com/markshust/docker-magento.git
```

### Các lệnh thường dùng

```bash
# Start/Stop
bin/start
bin/stop
bin/restart

# SSH
bin/bash  # vào PHP container

# Magento commands
bin/magento cache:clean
bin/magento setup:upgrade

# Composer
bin/composer install

# Xdebug
bin/xdebug enable
bin/xdebug disable

# MySQL
bin/mysql
bin/mysqldump > dump.sql

# Logs
bin/log web
bin/log db
```

---

## 3. Xdebug với DDEV

```bash
# Enable
ddev xdebug on

# PhpStorm: Preferences > PHP > Servers
# Name: my-magento.ddev.site
# Host: my-magento.ddev.site
# Port: 443
# Debugger: Xdebug
# Path mappings: /path/to/project → /var/www/html

# Cài Xdebug Helper extension cho Chrome
# Set IDE Key: PHPSTORM
```

---

## 4. Custom DDEV Commands

```bash
# Tạo custom command
mkdir -p .ddev/commands/web
```

```bash
#!/bin/bash
## Description: Run Magento setup commands
## Usage: magento-setup
## Example: ddev magento-setup

cd /var/www/html
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f
bin/magento cache:flush
```

```bash
chmod +x .ddev/commands/web/magento-setup
ddev magento-setup
```

---

## 5. CI/CD với GitHub Actions

```yaml
# .github/workflows/ci.yml
name: Magento 2 CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          tools: composer
      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist
      - name: Run PHPCS
        run: vendor/bin/phpcs --standard=Magento2 app/code/

  phpstan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - name: Install dependencies
        run: composer install --no-interaction
      - name: Run PHPStan
        run: vendor/bin/phpstan analyse --level=5 app/code/

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - name: Install dependencies
        run: composer install --no-interaction
      - name: Run Unit Tests
        run: vendor/bin/phpunit -c dev/tests/unit/phpunit.xml.dist app/code/Vendor/Module/Test/Unit
```

---

## 6. Lưu ý

- **Mutagen:** Bắt buộc bật trên macOS/Windows để tránh I/O chậm
- **Xdebug:** Tắt khi không debug — ảnh hưởng performance đáng kể
- **PHP version:** DDEV hỗ trợ nhiều PHP version, dễ switch
- **Services:** Elasticsearch, Varnish, RabbitMQ đều có DDEV addon chính thức
- **Cron:** Dùng `ddev get ddev/ddev-cron` để chạy Magento cron trong container

---

## Liên kết

- Tooling: xem [tooling.md](./tooling.md)
- Deployment Pipeline: xem [deployment-pipeline.md](./deployment-pipeline.md)
- RabbitMQ: xem [../infrastructure/rabbitmq.md](../infrastructure/rabbitmq.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
