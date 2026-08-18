# Tooling cho Magento 2 Development

Nguồn:
- [Pestle Documentation](https://pestle.readthedocs.io/en/latest/) — pestle.readthedocs.io
- [n98-magerun2 GitHub](https://github.com/netz98/n98-magerun2) — github.com/netz98
- [n98-magerun2 Overview](https://www.atwix.com/magento-2/n98-magerun2-tool-overview/) — atwix.com

---

## 1. Pestle — Code Generation Tool

Pestle là CLI tool để generate Magento 2 boilerplate code.

### Cài đặt

```bash
# Download phar
curl -LO https://pestle.pulsestorm.net/pestle.phar
chmod +x pestle.phar
sudo mv pestle.phar /usr/local/bin/pestle.phar

# Hoặc qua Composer
composer global require pulsestorm/pestle
```

### Các lệnh thường dùng

```bash
# Tạo module mới
pestle.phar generate_module
# → Hỏi: Vendor Namespace, Module Name, Version

# Tạo route + controller
pestle.phar generate_route
# → Tạo routes.xml, Controller/Index/Index.php

# Tạo plugin
pestle.phar generate_plugin_xml
# → Tạo di.xml với plugin declaration

# Tạo observer
pestle.phar generate_observer
# → Tạo events.xml + Observer class

# Tạo command CLI
pestle.phar generate_command
# → Tạo Console/Command class

# Tạo cron job
pestle.phar generate_cron
# → Tạo crontab.xml + Cron class

# Tạo unit test
pestle.phar generate_unit_test

# Liệt kê tất cả commands
pestle.phar list
```

### Lưu ý

- Pestle generate code theo pattern cũ hơn — luôn review và refactor theo constitution
- Đặc biệt: thêm `declare(strict_types=1)`, typed properties, return types
- Pestle không generate `db_schema.xml` — phải tạo thủ công

---

## 2. n98-magerun2 — Swiss Army Knife

n98-magerun2 là CLI tool mạnh hơn `bin/magento` với nhiều lệnh tiện ích.

### Cài đặt

```bash
# Download phar
wget https://files.magerun.net/n98-magerun2.phar
chmod +x n98-magerun2.phar
sudo mv n98-magerun2.phar /usr/local/bin/n98-magerun2

# Hoặc qua Composer
composer global require n98/magerun2
```

### Cache & Indexer

```bash
# Cache
n98-magerun2 cache:clean
n98-magerun2 cache:flush
n98-magerun2 cache:list
n98-magerun2 cache:enable full_page
n98-magerun2 cache:disable full_page

# Indexer
n98-magerun2 index:reindex
n98-magerun2 index:list
```

### Admin User Management

```bash
# Liệt kê admin users
n98-magerun2 admin:user:list

# Đổi password admin
n98-magerun2 admin:user:change-password admin newpassword123

# Tạo admin user mới
n98-magerun2 admin:user:create --username=newadmin --email=admin@example.com \
  --password=Password123! --firstname=New --lastname=Admin

# Xóa admin user
n98-magerun2 admin:user:delete admin
```

### System Info & Cron

```bash
# System info
n98-magerun2 sys:info
n98-magerun2 sys:check

# Cron
n98-magerun2 sys:cron:list
n98-magerun2 sys:cron:history
n98-magerun2 sys:cron:run vendor_module_cron_job

# Log sizes
n98-magerun2 dev:log:size
```

### Database

```bash
# Dump database
n98-magerun2 db:dump --compression=gzip --strip="@development" > dump.sql.gz

# Import database
n98-magerun2 db:import dump.sql.gz

# Query
n98-magerun2 db:query "SELECT * FROM store"

# Console MySQL
n98-magerun2 db:console
```

### Config Management

```bash
# Đọc config
n98-magerun2 config:store:get web/secure/base_url

# Set config
n98-magerun2 config:store:set web/secure/base_url https://new-url.com/

# Xóa config
n98-magerun2 config:store:delete web/secure/base_url

# Dump tất cả config
n98-magerun2 config:store:dump
```

### Development

```bash
# Bật/tắt maintenance mode
n98-magerun2 maintenance:enable
n98-magerun2 maintenance:disable
n98-magerun2 maintenance:allow-ips 127.0.0.1

# Deploy mode
n98-magerun2 deploy:mode:show
n98-magerun2 deploy:mode:set developer

# Module management
n98-magerun2 module:list
n98-magerun2 module:enable Vendor_Module
n98-magerun2 module:disable Vendor_Module

# Tạo module skeleton
n98-magerun2 dev:module:create --add-all Vendor Module
```

### Custom Commands

Tạo custom n98-magerun2 command trong project:

```yaml
# app/etc/n98-magerun2.yaml
commands:
  customCommandClasses:
    - Vendor\Module\Command\CustomCommand
```

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Command;

use N98\Magento\Command\AbstractMagentoCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class CustomCommand extends AbstractMagentoCommand
{
    protected function configure(): void
    {
        $this->setName('vendor:module:custom')
             ->setDescription('Custom command description');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->detectMagento($output);
        if (!$this->initMagento()) {
            return 1;
        }

        $output->writeln('<info>Custom command executed</info>');
        return 0;
    }
}
```

---

## 3. PHPStorm Magento Plugin

Plugin chính thức: [Magento PhpStorm](https://plugins.jetbrains.com/plugin/8024-magento-phpstorm)

### Tính năng chính

- **DI Navigation:** Click vào interface → nhảy đến implementation trong di.xml
- **Plugin Generation:** Right-click method → Generate Plugin
- **Event/Observer:** Autocomplete event names, generate observer
- **XML Validation:** Validate di.xml, events.xml, routes.xml
- **Template Navigation:** Click template path → mở file phtml
- **Inspections:** Phát hiện vi phạm Magento coding standards

### Setup

1. `Preferences > Plugins > Marketplace`
2. Tìm "Magento PhpStorm"
3. Install và restart
4. `Preferences > Languages & Frameworks > PHP > Frameworks > Magento`
5. Set Magento installation path

---

## 4. Makefile cho Magento Tasks

```makefile
# Makefile
.PHONY: install upgrade compile deploy clean test

install:
	composer install --no-interaction
	bin/magento setup:install ...

upgrade:
	bin/magento setup:upgrade
	bin/magento setup:di:compile
	bin/magento setup:static-content:deploy -f

compile:
	bin/magento setup:di:compile

deploy:
	bin/magento setup:static-content:deploy -f en_US vi_VN

clean:
	bin/magento cache:clean
	bin/magento cache:flush

test:
	vendor/bin/phpunit -c dev/tests/unit/phpunit.xml.dist app/code/Vendor/Module/Test/Unit

phpcs:
	vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/

phpstan:
	vendor/bin/phpstan analyse --level=5 app/code/Vendor/Module/
```

---

## Liên kết

- Static Analysis: xem [static-analysis.md](./static-analysis.md)
- Unit Testing: xem [unit-testing.md](./unit-testing.md)
- Deployment Pipeline: xem [deployment-pipeline.md](./deployment-pipeline.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
