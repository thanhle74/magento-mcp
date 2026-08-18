# Static Analysis & Code Quality trong Magento 2

Nguồn:
- [Coding Standards](https://developer.adobe.com/commerce/php/coding-standards/) — developer.adobe.com
- [Static Analysis Setup](https://developer.adobe.com/commerce/testing/guide/static/analysis) — developer.adobe.com
- [PHPStan Magento Extension](https://github.com/bitExpert/phpstan-magento) — github.com/bitExpert
- [PHPStan in Magento 2](https://m.academy/blog/static-analysis-magento-phpstan/) — m.academy

---

## 1. Tổng quan

Magento 2 hỗ trợ các công cụ static analysis:

| Tool | Mục đích | Config file |
|------|----------|-------------|
| PHPCS (PHP_CodeSniffer) | Coding standard compliance | `phpcs.xml` |
| PHPMD | Mess detection (complexity, unused code) | `phpmd.xml` |
| PHPStan | Type safety, logic errors | `phpstan.neon` |
| ESLint | JavaScript code quality | `.eslintrc` |
| PHP CS Fixer | Auto-fix coding style | `.php-cs-fixer.php` |

---

## 2. PHPCS với Magento Coding Standard

### Cài đặt

```bash
composer require --dev magento/magento-coding-standard
```

### Chạy PHPCS

```bash
# Check toàn bộ module
vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/

# Check file cụ thể
vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/Model/Service.php

# Auto-fix (PHPCBF)
vendor/bin/phpcbf --standard=Magento2 app/code/Vendor/Module/

# Chỉ show errors (không show warnings) — KHÔNG dùng làm gate review trong repo này
vendor/bin/phpcs --standard=Magento2 --error-severity=1 --warning-severity=0 app/code/Vendor/Module/
```

### Chính sách repo (`.spec/config/checklist.md`)

- **Gate review**: 0 **errors** bắt buộc
- **Warnings** thiếu docblock / `@param` / `@return` trên `app/code/` custom: **phải sửa** trước khi báo task done — không coi “chỉ warning” là đủ
- Lệnh khuyến nghị (Docker project): `./bin/phpcs --standard=Magento2 app/code/<Vendor>/<Module>/`

### phpcs.xml (project config)

```xml
<?xml version="1.0"?>
<ruleset name="Project">
    <description>Project coding standard</description>

    <!-- Dùng Magento2 standard -->
    <rule ref="Magento2"/>

    <!-- Exclude paths -->
    <exclude-pattern>*/vendor/*</exclude-pattern>
    <exclude-pattern>*/generated/*</exclude-pattern>
    <exclude-pattern>*/Test/*</exclude-pattern>

    <!-- Exclude specific rules nếu cần -->
    <rule ref="Magento2.Functions.DiscouragedFunction">
        <exclude-pattern>*/Setup/Patch/*</exclude-pattern>
    </rule>
</ruleset>
```

### PhpStorm setup

1. `Preferences > Editor > Inspections`
2. `PHP > Quality Tools > PHP_CodeSniffer validation`
3. Set `Coding standard: Custom`
4. Path: `<project_root>/vendor/magento/magento-coding-standard/Magento2/ruleset.xml`

---

## 3. PHPStan với Magento Extension

### Cài đặt

```bash
composer require --dev phpstan/phpstan bitexpert/phpstan-magento
```

### phpstan.neon

```neon
includes:
    - vendor/bitexpert/phpstan-magento/extension.neon

parameters:
    level: 5
    paths:
        - app/code/Vendor/Module

    # Magento-specific ignores
    ignoreErrors:
        # Magic methods trong DataObject
        - '#Call to an undefined method Magento\\Framework\\DataObject::#'
        # Generated classes
        - '#Class Magento\\.*\\Interceptor#'

    # Bootstrap Magento autoloader
    bootstrapFiles:
        - vendor/autoload.php

    # Exclude generated code
    excludePaths:
        - generated/
        - vendor/
```

### Chạy PHPStan

```bash
# Level 0-9 (0 = basic, 9 = strictest)
vendor/bin/phpstan analyse --level=5 app/code/Vendor/Module/

# Generate baseline (ignore existing errors)
vendor/bin/phpstan analyse --generate-baseline phpstan-baseline.neon

# Dùng baseline
# Thêm vào phpstan.neon: includes: - phpstan-baseline.neon
```

---

## 4. PHP CS Fixer (Auto-fix)

### Cài đặt

```bash
composer require --dev friendsofphp/php-cs-fixer
```

### .php-cs-fixer.php

```php
<?php
declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in(__DIR__ . '/app/code')
    ->exclude(['generated', 'vendor'])
    ->name('*.php');

return (new Config())
    ->setRules([
        '@PSR12'                    => true,
        'declare_strict_types'      => true,
        'array_syntax'              => ['syntax' => 'short'],
        'no_unused_imports'         => true,
        'ordered_imports'           => ['sort_algorithm' => 'alpha'],
        'single_quote'              => true,
        'trailing_comma_in_multiline' => true,
    ])
    ->setFinder($finder);
```

### Chạy

```bash
# Dry run (chỉ show, không sửa)
vendor/bin/php-cs-fixer fix --dry-run --diff app/code/Vendor/Module/

# Auto-fix
vendor/bin/php-cs-fixer fix app/code/Vendor/Module/
```

---

## 5. GrumPHP (Pre-commit hooks)

### Cài đặt

```bash
composer require --dev phpro/grumphp
```

### grumphp.yml

```yaml
grumphp:
    tasks:
        phpcs:
            standard: Magento2
            show_sniffs_in_use: false
            triggered_by: [php]
            whitelist_patterns:
                - /^app\/code\//

        phpstan:
            configuration: phpstan.neon
            level: 5
            triggered_by: [php]

        phpcsfixer:
            config: .php-cs-fixer.php
            triggered_by: [php]
```

---

## 6. Magento Built-in Static Tests

```bash
# Chạy tất cả static tests
bin/magento dev:test:run static

# Chạy theo module
cd dev/tests/static
../../../vendor/bin/phpunit --filter 'Magento\\Test\\Php\\LiveCodeTest' \
  --testsuite static \
  -- app/code/Vendor/Module/
```

---

## 7. ESLint cho JavaScript

```bash
# Cài đặt (đã có trong Magento)
npm install

# Chạy ESLint
node_modules/.bin/eslint app/code/Vendor/Module/view/frontend/web/js/

# Auto-fix
node_modules/.bin/eslint --fix app/code/Vendor/Module/view/frontend/web/js/
```

---

## 8. CI/CD Integration

```yaml
# .github/workflows/quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: composer install --no-interaction
      - name: Run PHPCS
        run: vendor/bin/phpcs --standard=Magento2 app/code/

  phpstan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: composer install --no-interaction
      - name: Run PHPStan
        run: vendor/bin/phpstan analyse --level=5 app/code/
```

---

## 9. Checklist Quality Gate

- [ ] PHPCS pass với Magento2 standard (0 errors)
- [ ] PHPStan level ≥ 5 (0 errors)
- [ ] `declare(strict_types=1)` trong mọi file PHP
- [ ] Không có `var_dump`, `print_r`, `die`, `exit`
- [ ] Không có `ObjectManager::getInstance()`
- [ ] Return type declarations đầy đủ
- [ ] ESLint pass cho JS files

---

## Liên kết

- Unit Testing: xem [unit-testing.md](./unit-testing.md)
- Testing Guide: xem [testing-guide.md](./testing-guide.md)
- Constitution: xem [../../constitution.md](../../constitution.md)
