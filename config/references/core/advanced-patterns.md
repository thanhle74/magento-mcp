# Tham khảo: Advanced Patterns trong Magento 2

Nguồn:
- https://dev.to/grahamcrocker/implement-a-strategy-pattern-in-magento2-2mc5 — strategy pattern
- https://developer.adobe.com/commerce/php/development/payments-integrations/payment-gateway/command-pool/ — command pool
- https://developer.adobe.com/commerce/php/development/build/dependency-injection-file/ — DI patterns

---
> Nhóm ngôn ngữ & data-layer idiom (PHP 8.x, Builder, Null Object, Registry, Collection vs Repository, idempotent upsert) đã tách sang [php8-data-idioms.md](./php8-data-idioms.md).

## 1. Command pattern — CommandInterface, CommandPoolInterface

Dùng trong payment gateway, nhưng áp dụng được cho mọi use case cần pool of commands.

### Interface

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Api;

/**
 * @api
 * @since 1.0.0
 */
interface CommandInterface
{
    /**
     * @param array $commandSubject
     * @return \Magento\Payment\Gateway\Command\ResultInterface|null
     */
    public function execute(array $commandSubject): mixed;
}
```

### CommandPool

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\CommandInterface;
use Magento\Framework\Exception\NotFoundException;

class CommandPool
{
    /**
     * @param CommandInterface[] $commands
     */
    public function __construct(
        private readonly array $commands = []
    ) {}

    public function get(string $commandCode): CommandInterface
    {
        if (!isset($this->commands[$commandCode])) {
            throw new NotFoundException(
                __('Command "%1" is not defined.', $commandCode)
            );
        }

        if (!$this->commands[$commandCode] instanceof CommandInterface) {
            throw new \LogicException(
                sprintf('Command "%s" must implement CommandInterface.', $commandCode)
            );
        }

        return $this->commands[$commandCode];
    }
}
```

### di.xml — cấu hình command pool

```xml
<!-- Tạo command pool với virtualType -->
<virtualType name="Vendor\Module\Model\OrderCommandPool"
             type="Vendor\Module\Model\CommandPool">
    <arguments>
        <argument name="commands" xsi:type="array">
            <item name="create" xsi:type="string">Vendor\Module\Model\Command\CreateOrderCommand</item>
            <item name="cancel" xsi:type="string">Vendor\Module\Model\Command\CancelOrderCommand</item>
            <item name="refund" xsi:type="string">Vendor\Module\Model\Command\RefundOrderCommand</item>
        </argument>
    </arguments>
</virtualType>

<!-- Inject pool vào service -->
<type name="Vendor\Module\Service\OrderService">
    <arguments>
        <argument name="commandPool" xsi:type="object">
            Vendor\Module\Model\OrderCommandPool
        </argument>
    </arguments>
</type>
```

### Sử dụng

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Vendor\Module\Model\CommandPool;

class OrderService
{
    public function __construct(
        private readonly CommandPool $commandPool
    ) {}

    public function processOrder(string $action, array $data): mixed
    {
        return $this->commandPool->get($action)->execute($data);
    }
}
```

---

## 2. Strategy pattern — pool of strategies, dynamic selection via DI

Thay thế switch/if-else bằng pool of strategy classes.

### Interface

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Processor;

/**
 * @api
 * @since 1.0.0
 */
interface ProcessorInterface
{
    /**
     * Kiểm tra strategy này có xử lý được type này không
     */
    public function isApplicable(string $type): bool;

    /**
     * Xử lý
     */
    public function process(array $data): array;
}
```

### Strategy pool

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Processor;

use Magento\Framework\Exception\LocalizedException;

class ProcessorPool
{
    /**
     * @param ProcessorInterface[] $processors
     */
    public function __construct(
        private readonly array $processors = []
    ) {}

    public function getProcessor(string $type): ProcessorInterface
    {
        foreach ($this->processors as $processor) {
            if ($processor->isApplicable($type)) {
                return $processor;
            }
        }

        throw new LocalizedException(
            __('No processor found for type "%1".', $type)
        );
    }
}
```

### Concrete strategies

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Processor;

class SimpleProductProcessor implements ProcessorInterface
{
    public function isApplicable(string $type): bool
    {
        return $type === 'simple';
    }

    public function process(array $data): array
    {
        // Logic cho simple product
        return array_merge($data, ['processed_by' => 'simple']);
    }
}

class ConfigurableProductProcessor implements ProcessorInterface
{
    public function isApplicable(string $type): bool
    {
        return $type === 'configurable';
    }

    public function process(array $data): array
    {
        // Logic cho configurable product
        return array_merge($data, ['processed_by' => 'configurable']);
    }
}
```

### di.xml

```xml
<type name="Vendor\Module\Model\Processor\ProcessorPool">
    <arguments>
        <argument name="processors" xsi:type="array">
            <item name="simple" xsi:type="object">
                Vendor\Module\Model\Processor\SimpleProductProcessor
            </item>
            <item name="configurable" xsi:type="object">
                Vendor\Module\Model\Processor\ConfigurableProductProcessor
            </item>
        </argument>
    </arguments>
</type>
```

---

## 3. Composite pattern — CompositeInterface, chaining processors

Dùng khi cần áp dụng nhiều processors theo thứ tự.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Processor;

class CompositeProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface[] $processors Sorted by sortOrder
     */
    public function __construct(
        private readonly array $processors = []
    ) {}

    public function isApplicable(string $type): bool
    {
        return true; // Composite áp dụng cho mọi type
    }

    public function process(array $data): array
    {
        foreach ($this->processors as $processor) {
            if ($processor->isApplicable($data['type'] ?? '')) {
                $data = $processor->process($data);
            }
        }
        return $data;
    }
}
```

---

## 4. Pipeline pattern — processor chain, SortedList

Magento dùng pattern này nhiều trong checkout totals, shipping rates...

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\ProcessorInterface;

/**
 * Sorted processor chain — processors chạy theo sortOrder
 */
class ProcessorChain
{
    private array $sortedProcessors = [];

    /**
     * @param array $processors ['sortOrder' => ProcessorInterface]
     */
    public function __construct(array $processors = [])
    {
        // Sort theo key (sortOrder)
        ksort($processors);
        $this->sortedProcessors = $processors;
    }

    public function process(mixed $subject): mixed
    {
        foreach ($this->sortedProcessors as $processor) {
            $subject = $processor->process($subject);
        }
        return $subject;
    }
}
```

```xml
<!-- di.xml — processors với sortOrder -->
<type name="Vendor\Module\Model\ProcessorChain">
    <arguments>
        <argument name="processors" xsi:type="array">
            <item name="10" xsi:type="object">Vendor\Module\Model\Processor\ValidateProcessor</item>
            <item name="20" xsi:type="object">Vendor\Module\Model\Processor\TransformProcessor</item>
            <item name="30" xsi:type="object">Vendor\Module\Model\Processor\EnrichProcessor</item>
        </argument>
    </arguments>
</type>
```

---

## 5. Modifier pattern — UI Component modifier, pool modifier

Dùng trong UI Component để modify data/meta.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Ui\DataProvider\Product\Form\Modifier;

use Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\AbstractModifier;

class CustomModifier extends AbstractModifier
{
    public function modifyData(array $data): array
    {
        // Modify data trước khi render form
        foreach ($data as $productId => $productData) {
            $data[$productId]['product']['custom_field'] = 'custom_value';
        }
        return $data;
    }

    public function modifyMeta(array $meta): array
    {
        // Modify meta (field config, visibility...)
        $meta['product-details']['children']['custom_field'] = [
            'arguments' => [
                'data' => [
                    'config' => [
                        'label' => __('Custom Field'),
                        'componentType' => 'field',
                        'formElement' => 'input',
                        'dataType' => 'text',
                        'sortOrder' => 100,
                    ],
                ],
            ],
        ];
        return $meta;
    }
}
```

```xml
<!-- di.xml -->
<virtualType name="Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Pool">
    <arguments>
        <argument name="modifiers" xsi:type="array">
            <item name="vendor_custom" xsi:type="array">
                <item name="class" xsi:type="string">
                    Vendor\Module\Ui\DataProvider\Product\Form\Modifier\CustomModifier
                </item>
                <item name="sortOrder" xsi:type="number">100</item>
            </item>
        </argument>
    </arguments>
</virtualType>
```

---

## 6. Validator chain — ValidatorInterface, CompositeValidator

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Validator;

use Magento\Framework\Validation\ValidationResult;
use Magento\Framework\Validation\ValidationResultFactory;

interface ValidatorInterface
{
    public function validate(array $data): ValidationResult;
}

class CompositeValidator implements ValidatorInterface
{
    /**
     * @param ValidatorInterface[] $validators
     */
    public function __construct(
        private readonly ValidationResultFactory $validationResultFactory,
        private readonly array $validators = []
    ) {}

    public function validate(array $data): ValidationResult
    {
        $errors = [];

        foreach ($this->validators as $validator) {
            $result = $validator->validate($data);
            if (!$result->isValid()) {
                $errors = array_merge($errors, $result->getErrors());
            }
        }

        return $this->validationResultFactory->create(['errors' => $errors]);
    }
}
```

```xml
<type name="Vendor\Module\Model\Validator\CompositeValidator">
    <arguments>
        <argument name="validators" xsi:type="array">
            <item name="required_fields" xsi:type="object">
                Vendor\Module\Model\Validator\RequiredFieldsValidator
            </item>
            <item name="email_format" xsi:type="object">
                Vendor\Module\Model\Validator\EmailFormatValidator
            </item>
        </argument>
    </arguments>
</type>
```

---

## 7. Specification pattern — business rule objects

Specification pattern biến business conditions thành objects có thể compose.

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Specification;

/**
 * Base specification interface
 */
interface SpecificationInterface
{
    public function isSatisfiedBy(mixed $candidate): bool;

    public function and(self $other): self;

    public function or(self $other): self;

    public function not(): self;
}

/**
 * Abstract base với composite logic
 */
abstract class AbstractSpecification implements SpecificationInterface
{
    public function and(SpecificationInterface $other): SpecificationInterface
    {
        return new AndSpecification($this, $other);
    }

    public function or(SpecificationInterface $other): SpecificationInterface
    {
        return new OrSpecification($this, $other);
    }

    public function not(): SpecificationInterface
    {
        return new NotSpecification($this);
    }
}

class AndSpecification extends AbstractSpecification
{
    public function __construct(
        private readonly SpecificationInterface $left,
        private readonly SpecificationInterface $right
    ) {}

    public function isSatisfiedBy(mixed $candidate): bool
    {
        return $this->left->isSatisfiedBy($candidate)
            && $this->right->isSatisfiedBy($candidate);
    }
}

class OrSpecification extends AbstractSpecification
{
    public function __construct(
        private readonly SpecificationInterface $left,
        private readonly SpecificationInterface $right
    ) {}

    public function isSatisfiedBy(mixed $candidate): bool
    {
        return $this->left->isSatisfiedBy($candidate)
            || $this->right->isSatisfiedBy($candidate);
    }
}

class NotSpecification extends AbstractSpecification
{
    public function __construct(
        private readonly SpecificationInterface $wrapped
    ) {}

    public function isSatisfiedBy(mixed $candidate): bool
    {
        return !$this->wrapped->isSatisfiedBy($candidate);
    }
}
```

**Concrete specifications:**

```php
// Kiểm tra order có thể ship
class OrderCanShipSpecification extends AbstractSpecification
{
    public function isSatisfiedBy(mixed $order): bool
    {
        return $order->canShip()
            && $order->getState() === \Magento\Sales\Model\Order::STATE_PROCESSING;
    }
}

// Kiểm tra order có địa chỉ hợp lệ
class OrderHasValidAddressSpecification extends AbstractSpecification
{
    public function isSatisfiedBy(mixed $order): bool
    {
        $address = $order->getShippingAddress();
        return $address !== null
            && !empty($address->getStreet())
            && !empty($address->getCity());
    }
}

// Compose specifications
$canShipSpec = new OrderCanShipSpecification();
$hasAddressSpec = new OrderHasValidAddressSpecification();
$readyToShipSpec = $canShipSpec->and($hasAddressSpec);

foreach ($orders as $order) {
    if ($readyToShipSpec->isSatisfiedBy($order)) {
        $this->shipOrder($order);
    }
}
```

---

## 8. Decorator pattern — wrapping service với extra behavior

Decorator pattern trong Magento thường được implement qua `<preference>` hoặc plugin. Cách chuẩn nhất là dùng DI preference với wrapper class:

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\EntityRepositoryInterface;
use Vendor\Module\Api\Data\EntityInterface;
use Psr\Log\LoggerInterface;

/**
 * Decorator: thêm logging vào repository
 */
class LoggingEntityRepository implements EntityRepositoryInterface
{
    public function __construct(
        private readonly EntityRepositoryInterface $innerRepository,
        private readonly LoggerInterface $logger
    ) {}

    public function getById(int $id): EntityInterface
    {
        $this->logger->debug('EntityRepository::getById called', ['id' => $id]);
        $result = $this->innerRepository->getById($id);
        $this->logger->debug('EntityRepository::getById returned', ['entity_id' => $result->getId()]);
        return $result;
    }

    public function save(EntityInterface $entity): EntityInterface
    {
        $this->logger->info('EntityRepository::save called', ['entity_id' => $entity->getId()]);
        return $this->innerRepository->save($entity);
    }

    public function delete(EntityInterface $entity): bool
    {
        $this->logger->warning('EntityRepository::delete called', ['entity_id' => $entity->getId()]);
        return $this->innerRepository->delete($entity);
    }
}
```

```xml
<!-- etc/di.xml -->
<!-- Wrap original repository với decorator -->
<preference for="Vendor\Module\Api\EntityRepositoryInterface"
            type="Vendor\Module\Model\LoggingEntityRepository"/>

<!-- Inject original implementation vào decorator -->
<type name="Vendor\Module\Model\LoggingEntityRepository">
    <arguments>
        <argument name="innerRepository" xsi:type="object">
            Vendor\Module\Model\EntityRepository
        </argument>
    </arguments>
</type>
```

**Lưu ý:** Ưu tiên dùng **plugin** thay vì decorator/preference trong Magento. Decorator phù hợp khi cần wrap toàn bộ interface implementation.

---

## 9. Converter / Mapper / Hydrator patterns

### Converter pattern (toDataModel / toArray)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Vendor\Module\Api\Data\EntityInterface;
use Vendor\Module\Api\Data\EntityInterfaceFactory;

class EntityConverter
{
    public function __construct(
        private readonly EntityInterfaceFactory $entityFactory
    ) {}

    /**
     * Convert DB row array → Data Model
     */
    public function toDataModel(array $data): EntityInterface
    {
        $entity = $this->entityFactory->create();
        $entity->setId((int) ($data['entity_id'] ?? 0));
        $entity->setName((string) ($data['name'] ?? ''));
        $entity->setStatus((int) ($data['status'] ?? 0));
        return $entity;
    }

    /**
     * Convert Data Model → array for DB
     */
    public function toArray(EntityInterface $entity): array
    {
        return [
            'entity_id' => $entity->getId(),
            'name'      => $entity->getName(),
            'status'    => $entity->getStatus(),
        ];
    }
}
```

### Hydrator pattern (populate object từ array)

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\EntityManager\HydratorInterface;

class EntityHydrator implements HydratorInterface
{
    public function extract(object $entity): array
    {
        return [
            'entity_id' => $entity->getId(),
            'name'      => $entity->getName(),
            'status'    => $entity->getStatus(),
        ];
    }

    public function hydrate(object $entity, array $data): object
    {
        if (isset($data['entity_id'])) {
            $entity->setId((int) $data['entity_id']);
        }
        if (isset($data['name'])) {
            $entity->setName((string) $data['name']);
        }
        if (isset($data['status'])) {
            $entity->setStatus((int) $data['status']);
        }
        return $entity;
    }
}
```

Magento có `Magento\Framework\EntityManager\HydratorPool` để quản lý hydrators theo entity type.

---
## Liên kết
- PHP 8.x & data idioms: xem [php8-data-idioms.md](./php8-data-idioms.md)
