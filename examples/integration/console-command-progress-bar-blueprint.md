# Blueprint: Console Command với Progress Bar

> Nguồn: https://magecomp.com/blog/add-progress-bar-using-custom-cli-command-magento-2/ — đã refactor theo constitution
> Mục đích: Tạo CLI command với progress bar cho batch processing

---

## Cấu trúc module

```
app/code/Vendor/Module/
├── etc/
│   └── di.xml
└── Console/
    └── Command/
        └── ProcessEntitiesCommand.php
```

---

## `etc/di.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Framework\Console\CommandListInterface">
        <arguments>
            <argument name="commands" xsi:type="array">
                <item name="vendor_process_entities" xsi:type="object">
                    Vendor\Module\Console\Command\ProcessEntitiesCommand
                </item>
            </argument>
        </arguments>
    </type>
</config>
```

---

## `Console/Command/ProcessEntitiesCommand.php`

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Console\Command;

use Magento\Framework\Console\Cli;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Vendor\Module\Api\EntityRepositoryInterface;
use Vendor\Module\Model\ResourceModel\Entity\CollectionFactory;

class ProcessEntitiesCommand extends Command
{
    private const COMMAND_NAME = 'vendor:module:process-entities';
    private const ARGUMENT_BATCH_SIZE = 'batch-size';
    private const OPTION_DRY_RUN = 'dry-run';

    public function __construct(
        private readonly CollectionFactory $collectionFactory,
        private readonly EntityRepositoryInterface $entityRepository,
        private readonly LoggerInterface $logger,
        string $name = self::COMMAND_NAME
    ) {
        parent::__construct($name);
    }

    protected function configure(): void
    {
        $this->setName(self::COMMAND_NAME)
            ->setDescription('Process all entities with progress bar')
            ->addArgument(
                self::ARGUMENT_BATCH_SIZE,
                InputArgument::OPTIONAL,
                'Number of entities to process per batch',
                '100'
            )
            ->addOption(
                self::OPTION_DRY_RUN,
                null,
                InputOption::VALUE_NONE,
                'Run without making actual changes'
            );

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $batchSize = (int) $input->getArgument(self::ARGUMENT_BATCH_SIZE);
        $isDryRun = (bool) $input->getOption(self::OPTION_DRY_RUN);

        if ($isDryRun) {
            $output->writeln('<comment>DRY RUN mode — no changes will be made</comment>');
        }

        $output->writeln('<info>Starting entity processing...</info>');

        try {
            $collection = $this->collectionFactory->create();
            $totalCount = $collection->getSize();

            if ($totalCount === 0) {
                $output->writeln('<comment>No entities found to process.</comment>');
                return Cli::RETURN_SUCCESS;
            }

            $output->writeln(sprintf('<info>Found %d entities to process</info>', $totalCount));

            // Tạo progress bar
            $progressBar = new ProgressBar($output, $totalCount);
            $progressBar->setFormat(
                ' %current%/%max% [%bar%] %percent:3s%% | Elapsed: %elapsed:6s% | ETA: %estimated:-6s% | Memory: %memory:6s%'
            );
            $progressBar->start();

            $processed = 0;
            $errors = 0;
            $page = 1;

            do {
                $collection = $this->collectionFactory->create();
                $collection->setPageSize($batchSize);
                $collection->setCurPage($page);

                $items = $collection->getItems();

                foreach ($items as $entity) {
                    try {
                        if (!$isDryRun) {
                            $this->processEntity($entity);
                        }
                        $processed++;
                    } catch (\Exception $e) {
                        $errors++;
                        $this->logger->error(
                            sprintf('Error processing entity %s: %s', $entity->getId(), $e->getMessage()),
                            ['exception' => $e]
                        );
                    }

                    $progressBar->advance();
                }

                $page++;
            } while (count($items) === $batchSize);

            $progressBar->finish();
            $output->write(PHP_EOL);

            // Summary
            $output->writeln(sprintf(
                '<info>Processing complete: %d processed, %d errors</info>',
                $processed,
                $errors
            ));

            if ($errors > 0) {
                $output->writeln('<comment>Check var/log for error details</comment>');
                return Cli::RETURN_FAILURE;
            }

            return Cli::RETURN_SUCCESS;

        } catch (\Exception $e) {
            $output->writeln(sprintf('<error>Fatal error: %s</error>', $e->getMessage()));
            $this->logger->critical('ProcessEntitiesCommand failed', ['exception' => $e]);
            return Cli::RETURN_FAILURE;
        }
    }

    private function processEntity(mixed $entity): void
    {
        // Custom processing logic
        // Ví dụ: update status, sync với external system, etc.
    }
}
```

---

## Ví dụ nâng cao: Command với multiple steps

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Console\Command;

use Magento\Framework\Console\Cli;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class MultiStepCommand extends Command
{
    protected function configure(): void
    {
        $this->setName('vendor:module:multi-step')
            ->setDescription('Multi-step processing with progress');
        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // SymfonyStyle cho output đẹp hơn
        $io = new SymfonyStyle($input, $output);

        $io->title('Multi-Step Processing');

        $steps = [
            'Step 1: Validate data' => [$this, 'validateData'],
            'Step 2: Process records' => [$this, 'processRecords'],
            'Step 3: Update indexes' => [$this, 'updateIndexes'],
        ];

        foreach ($steps as $stepName => $callable) {
            $io->section($stepName);

            $items = $callable($output);
            $progressBar = new ProgressBar($output, count($items));
            $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%%');
            $progressBar->start();

            foreach ($items as $item) {
                // Process item
                $progressBar->advance();
            }

            $progressBar->finish();
            $output->write(PHP_EOL);
            $io->success("$stepName completed");
        }

        $io->success('All steps completed successfully!');
        return Cli::RETURN_SUCCESS;
    }

    private function validateData(OutputInterface $output): array
    {
        return range(1, 50); // Placeholder
    }

    private function processRecords(OutputInterface $output): array
    {
        return range(1, 200); // Placeholder
    }

    private function updateIndexes(OutputInterface $output): array
    {
        return range(1, 10); // Placeholder
    }
}
```

---

## Verify steps

```bash
bin/magento setup:upgrade
bin/magento cache:clean

# Kiểm tra command đã đăng ký
bin/magento list | grep vendor

# Chạy dry run
bin/magento vendor:module:process-entities --dry-run

# Chạy thật với batch size 50
bin/magento vendor:module:process-entities 50

# Xem help
bin/magento vendor:module:process-entities --help
```

---

## Liên kết

- CLI Command Reference: [config/references/ops/maintenance-cli.md](../../config/references/ops/maintenance-cli.md)
- Logging: [config/references/infrastructure/logging.md](../../config/references/infrastructure/logging.md)
