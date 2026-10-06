# Research Log

> Mục đích: ghi lại topic nào đã research rồi để hook tránh chạy lại.
> Cập nhật tự động sau mỗi lần hook chạy xong.
> Để force re-research 1 topic: xóa dòng đó khỏi danh sách bên dưới.
> Mục đã xong (struck-through) được dồn về [research-log-archive.md](./research-log-archive.md).

---

## Đã research (tóm tắt theo chủ đề — toàn bộ tháng 2026-04)

> Bảng chi tiết ~145 dòng (2026-04-22 → 2026-04-23) đã nén theo chủ đề; tên topic giữ nguyên văn để tra cứu/tránh research lại. Cột kết quả trỏ tới file đã chứa nội dung.

| Chủ đề (đã research) | Ngày | Kết quả |
|---|---|---|
| Plugin & Event/Observer: before/after/around plugin, interceptor chain + sortOrder/conflict, plugin trên Repository/Controller/Block/interface/disabled, 7 event core (sales_order_place_after, catalog_product_save_after, customer_login, checkout_cart_add_product_complete, controller_action_predispatch, layout_generate_blocks_after, clean_cache_by_tags), custom event dispatch | 2026-04-22 | `core/plugin-patterns.md` (§1-10, kèm blueprint debug plugin §10), `core/event-observer-patterns.md` (§2-9, blueprint observer email + sync external API §10-11) |
| DI & ObjectManager: virtual type, proxy, factory, preference vs plugin, object manager pool shared/non-shared, generated code (Interceptor/Factory/Proxy + regenerate), config XML merge (load order, area), module sequence, area code | 2026-04-22 | `core/object-manager-generated.md` (§1-7) |
| Data layer: SearchCriteria/FilterGroup/SortOrder deep dive, custom SearchResults, DB transaction, bulk operations, soft delete, read/write split, schema migration zero-downtime, AbstractModel vs DataObject, collection addFieldToFilter/join/group, resourceModel hooks | 2026-04-22 | `core/search-criteria-data-layer.md` (§1-7), `core/model-collection-patterns.md` (§1-4) |
| Design patterns & PHP 8.x: Command, Strategy, Composite, Pipeline, Modifier, Validator chain, Builder, Null Object, Registry, Specification, Decorator, Converter, Mapper, Hydrator; named arguments, match, nullsafe, readonly, enum, first-class callable, generator | 2026-04-22 | `core/advanced-patterns.md` (§1-9 pattern cấu trúc; blueprint validator chain §6), `core/php8-data-idioms.md` (§1-6) |
| Service contracts & schema: repository getList/SearchCriteria, @api/@since, declarative schema (db_schema.xml, whitelist), data patch, extension attributes + join directive, EAV | 2026-04-22 | `core/service-contracts.md`, `core/declarative-schema.md`, `core/data-schema-patch.md`, `core/extension-attributes.md`, `core/attributes.md` |
| Debug & troubleshooting: DI compile error, plugin conflict, observer infinite loop, 500 error/WSOD, cache corruption, query log + EXPLAIN + MySQL optimization, profiler, memory leak (Blackfire), Xdebug (Docker/DDEV) | 2026-04-22/23 | `core/debugging-troubleshooting.md` (§2-11) |
| API & messaging: GraphQL (resolver, schema.graphqls, context, cache, query/mutation, pagination, auth, error handling), REST (webapi.xml, ACL, validation), async bulk REST, message queue MySQL vs AMQP + RabbitMQ (exchange, dead letter), Adobe I/O Events, API Mesh, PWA/headless | 2026-04-22/23 | `network/graphql/development.md`, `network/rest/overview.md`, `network/async-rest-api.md`, `network/message-queues.md`, `infrastructure/rabbitmq.md`, `network/adobe-io-events.md`, `network/api-mesh.md`, `network/pwa-headless.md` |
| UI Components (Admin): listing/form/DataProvider/columns, admin grid (filters, mass actions, inline edit, bookmarks), admin form (fieldset, field types, dependencies, dynamic rows), checkout steps (payment/shipping renderer), widget, pager/toolbar | 2026-04-22/23 | `frontend/ui-components.md`, `frontend/admin-ui-grid.md` (§5-8), `frontend/admin-form.md`, `frontend/checkout-steps.md`, `frontend/widget.md`, `frontend/pager-toolbar.md` |
| Frontend theme & JS: RequireJS (mixins, map, shim, bundles, async), KnockoutJS (observable, computed, custom binding, lifecycle), Luma theme override, LESS (extend, mixin, variables, critical CSS) | 2026-04-22/23 | `frontend/requirejs-knockoutjs.md` (§1-4), `frontend/less-css.md` |
| Business/Domain: order lifecycle + order management advanced (hold/cancel/reorder/partial invoice-ship), checkout totals/quote/address, customer (account, address, group, session), catalog product types + custom product type (price model, stock), catalog/cart price rules + coupon + tax/FPT, shipping carrier (collectRates, tracking, free/table rates), payment method (offline vs online, vault, 3DS) | 2026-04-22/23 | `business/order-lifecycle.md`, `business/order-management-advanced.md`, `business/quote-totals.md`, `business/customer-management.md`, `business/catalog-product-types.md`, `business/custom-product-type.md`, `business/catalog-price-rules.md` (§1-6), `infrastructure/shipping-carrier.md`, `security/payment-gateway.md` (§14) |
| Infrastructure & performance: cache types/invalidation/Varnish VCL/ESI/FPC hole punching + private content, Redis (session, sentinel), indexer/mview, cron (cron_schedule, group), logging Monolog, performance N+1/eager loading, import/export (CSV, behavior), MSI (source/stock/salable_qty), Elasticsearch/OpenSearch (mapping, analyzer) | 2026-04-22 | `infrastructure/cache-management.md`, `infrastructure/varnish-fpc.md` (§1-5, blueprint hole punching §3), `infrastructure/redis.md`, `infrastructure/indexing-mview.md`, `infrastructure/cron-jobs.md` (§4-8), `infrastructure/logging.md`, `infrastructure/performance.md`, `infrastructure/import-export.md`, `infrastructure/search-navigation.md`, `inventory/inventory-msi.md` |
| Security: CSRF/XSS/SQL injection + input validation (§9-10), ACL (acl.xml, resource, role), CSP (whitelist, nonce), 2FA (provider, bypass API), rate limiting/DDoS, admin security (brute force, session, IP whitelist), API token lifecycle | 2026-04-22/23 | `security/security-best-practices.md`, `security/acl.md`, `security/csp.md`, `security/two-factor-auth.md`, `security/rate-limiting.md`, `security/admin-security.md` (§4-6) |
| Ops, tooling & testing: CLI command (Input/OutputInterface), multi-store scope/config, deployment pipeline (setup:upgrade, di:compile, static-content:deploy), upgrade (UCT, breaking changes) + composer patches, staging & preview (Commerce), B2B modules (company, shared catalog, negotiable quote, PO), PHPUnit mock + integration test fixtures + MFTF, static analysis (PHPStan/PHPMD/PHPCS), pestle/n98-magerun2/PHPStorm Magento plugin | 2026-04-22/23 | `ops/maintenance-cli.md`, `ops/multi-store.md`, `ops/deployment-pipeline.md`, `ops/upgrade.md` (§3-4), `ops/staging-preview-commerce.md`, `ops/b2b-modules.md`, `ops/testing-guide.md`, `ops/unit-testing.md` (§7), `ops/static-analysis.md`, `ops/tooling.md` (§1-3) |
| Layout & View: Layout XML (handles, blocks, containers, arguments), ViewModel (ArgumentInterface, phtml binding), Hyvä (Alpine.js, Magewire, Tailwind) | 2026-04-22 | `frontend/layout-xml.md`, `frontend/frontend-view-models.md`, `frontend/hyva-theme.md` |
| Blueprints đã tạo: custom product type, extension attributes join, custom widget, integration test module, console command progress bar, custom price modifier (catalog rule), custom REST API pagination, GraphQL mutation input validation, transactional email (variables, transport, inline CSS), custom shipping carrier, custom payment offline | 2026-04-22 | `examples/INDEX.md` (bảng Integration Blueprints) |
| Khai thác lịch sử chat Claude Code × Magento (26 session digest, ~450MB transcript → ~80 lesson runtime-verified): payment gateway VN (refund no-IPN poll, result-code classifier, CAS refund state), payment-first checkout (fingerprint drift, recovery cron), transactional email (outbox idempotency, claim lease, MailException), PageBuilder (style tag crash, data-background-images), Smile ElasticSuite gotchas, docker-compose multi-project (Cloudflare tunnel, parallel stack), deploy (setup:config:set default-y, 1061 atomic ALTER, config.php churn), CMS PCRE backtrack + `{{media url=}}`, flat-index EAV table, FPM sizing/slow-log, nginx bot filter + ModSecurity, ORM hydration gotchas, data-fix script pattern | 2026-10-06 | `security/payment-gateway.md` (§24-25), `business/order-lifecycle.md`, `business/payment-first-checkout.md`, `core/transaction-side-effect-cleanup.md`, `infrastructure/notification-transactional-email.md`, `infrastructure/cache-management.md`, `infrastructure/search-navigation.md`, `infrastructure/import-export.md`, `ops/docker-compose-multi-project.md`, `ops/deploy-troubleshooting.md`, `ops/maintenance-cli.md`, `ops/web-server-config.md`, `core/custom-index-tables.md`, `frontend/cms-content-gotchas.md`, `frontend/pagebuilder-content-type.md`, `core/plugin-patterns.md`, `core/model-collection-patterns.md`, `core/search-criteria-data-layer.md`, `core/declarative-schema.md`, `network/web-api.md`, `ops/unit-testing.md` |

## Chưa research

> Backlog blueprint (chưa có file trên disk) đã chuyển sang `examples/INDEX.md` → mục **Backlog (chưa có blueprint)**.




### Business / Domain
- Return/RMA: return request, item condition, resolution (Commerce)
- Gift card: account, balance, usage (Commerce)
- Reward points: earn/spend rules, balance, expiry (Commerce)
- Customer segment: condition, auto-assign, use in price rules (Commerce)
- Catalog permission: category/product access by customer group (Commerce)

### Infrastructure / DevOps
- New Relic: APM integration, custom attributes, transaction naming
- Blackfire: profiling, assertions, CI integration
- Docker/DDEV: service config, custom commands, Xdebug toggle
- CI/CD: GitHub Actions / GitLab CI cho Magento, ECE-tools
- Cloud (Adobe Commerce Cloud): ece-tools, .magento.env.yaml, patches
- Monitoring: health check endpoint, cron health, queue health

### Security
- Encryption: key rotation, sensitive config, env.php
- File permissions: var/, pub/, generated/ — production vs dev
- Dependency confusion: composer package naming, private packagist

### Testing & Quality
- API functional test: WebApiAbstract, REST/GraphQL test
- Mutation testing: infection/phpunit, score interpretation
- Load testing: k6, JMeter cho Magento checkout flow

### Advanced Patterns / Architecture
- Event Sourcing: domain events, event store, replay
- CQRS: separate read/write models trong Magento context
- Saga pattern: distributed transaction, compensating actions

### Data Layer
- Optimistic locking: version field, conflict detection
- Custom DB function: MySQL stored procedure từ Magento

### API / Integration
- Webhook: outbound webhook, retry, signature verification
- OAuth 1.0a: integration token flow, consumer key/secret
- JWT: customer token structure, expiry, refresh
- SOAP API: WSDL generation, complex types, fault handling
- GraphQL subscription: real-time updates (nếu có)
- API versioning: V1/V2, backward compat strategy
- Hypermedia: HATEOAS trong Magento REST response
- API documentation: Swagger/OpenAPI generation từ webapi.xml
- Rate limit per customer/IP: custom implementation

### Frontend Advanced
- Custom form element: UI Component field type mới
- Dynamic rows: UI Component dynamic_rows, record template
- Modal component: modal, slide, popup — trigger từ JS
- Notification component: messages, global messages, inline
- Multiselect/Select2: custom options provider, AJAX load
- File upload: UI Component file uploader, validation
- Date/time picker: UI Component date, timezone handling
- Color picker: custom field type
- WYSIWYG: TinyMCE integration, custom plugin
- Map/Location: Google Maps integration trong admin form

### Checkout Advanced
- Custom checkout field: shipping/billing address custom field
- Custom checkout validation: JS mixin, custom validator
- One-step checkout: layout override, step removal
- Guest checkout: convert guest to customer post-order
- Persistent cart: remember cart across sessions
- Mini cart: custom item renderer, totals
- Order summary: custom totals renderer
- Checkout agreements: terms and conditions, checkbox
- Address suggestion: Google Places API integration
- Checkout with multiple addresses: multishipping flow

### Customer Advanced
- Customer attribute: custom EAV attribute, frontend input type
- Customer group pricing: tier price per group
- Customer segment: dynamic segment, condition types (Commerce)
- Wishlist: add/remove, share, move to cart
- Compare products: comparison list, attributes shown
- Recently viewed: session vs persistent storage
- Customer notification: subscription, unsubscribe
- Social login: OAuth provider integration
- GDPR: data export, anonymization, consent
- Account lockout: failed login attempts, unlock

### Catalog Advanced
- Layered navigation: custom filter, price filter, swatch filter
- Product relations: upsell, crosssell, related — custom rule
- Bundle product: dynamic price, fixed price, ship separately
- Downloadable product: link, sample, purchase limit
- Virtual product: no shipping, service-based
- Grouped product: associated products, qty handling
- Configurable product: swatch, super attribute, child visibility
- Product video: YouTube/Vimeo embed, gallery
- Product attachment: custom downloadable file per product
- Dynamic category: smart category rules, auto-assign products

### Sales / Order Advanced
- Custom order status: new status, state mapping, notification
- Order comment: visible to customer, email notification
- Partial refund: creditmemo with adjustment fee/refund
- Order archive: archive old orders, performance
- Custom invoice: PDF customization, logo, fields
- Custom packing slip: PDF template
- Order export: CSV/XML export, scheduled export
- Return merchandise: RMA flow, label generation
- Fraud detection: custom fraud check, order hold
- Split order: multiple shipments, partial fulfillment

### Performance Advanced
- HTTP/2: server push, multiplexing, header compression
- Image optimization: WebP, lazy load, srcset, CDN
- JS bundling: RequireJS bundle, critical JS, defer
- CSS critical path: above-fold CSS, async load
- Database query cache: query cache vs Redis cache
- Flat catalog: flat product/category table, pros/cons
- Async email: queue email sending, batch processing
- Deferred stock update: async inventory deduction
- Profiling: Magento built-in profiler, Blackfire, Tideways

### DevOps / Infrastructure Advanced
- Zero-downtime deployment: blue-green, rolling update
- Database backup: automated backup, point-in-time recovery
- Log aggregation: ELK stack, Graylog, Papertrail
- Error tracking: Sentry integration, error grouping
- Uptime monitoring: Pingdom, StatusCake, custom health check
- CDN: Fastly, Cloudflare, cache rules cho Magento
- Object storage: S3/GCS cho media, pub/media sync
- Kubernetes: Magento on K8s, horizontal scaling, session sharing
- Terraform: infrastructure as code cho Magento cloud
- Ansible: configuration management, deployment automation

### PHP / OOP Deep Dive (Magento context)
- Abstract class vs Interface: khi nào dùng cái nào trong Magento
- Trait: dùng trong Magento có hợp lệ không, use case thực tế
- Intersection types: PHP 8.1+, type safety nâng cao
- Closure binding: Closure::bind, Closure::fromCallable
- Anonymous class: test double, inline implementation

### Magento Code Patterns (thực chiến)
- Fluent interface: method chaining trong Builder/Query
- Action pool: array of actions, dynamic dispatch

### Debugging & Troubleshooting (thực chiến)
- Xdebug step debug: breakpoint, watch, call stack trong PhpStorm

### Code Generation & Tooling
- Mage2Gen: online generator, module skeleton
- PHP CS Fixer: Magento ruleset, auto-fix, CI integration
- PHPStan: Magento extension, level config, baseline
- Rector: automated refactoring, Magento-specific rules
- GrumPHP: pre-commit hooks, quality gates
- Composer scripts: post-install, post-update automation
- Makefile: common Magento dev tasks automation

### Event / Observer Patterns (thực chiến)
- adminhtml_block_html_before: admin block modification
- magento_customer_authenticated: post-auth hook

### Plugin Patterns (thực chiến)
- Plugin on Model: intercept save/load/delete

### Repository & Collection Patterns (thực chiến)
- Custom filter: addFilter với custom condition
- Join extension attribute: joinField, joinTable
- Custom sort: addOrder, custom sort direction
- Aggregate query: group by, count, sum trong collection
- Subquery: correlated subquery trong Magento collection
- Raw query: getConnection()->query() khi nào dùng
- Custom resource model: _getLoadSelect override
- Multi-table join: joinLeft, joinInner, alias

### GraphQL Deep Dive (thực chiến)
- Custom type: interface type, union type
- Resolver chain: ResolverInterface, composite resolver
- Context: UserContext, StoreContext, custom context
- Custom scalar type: custom scalar resolver

### REST API Deep Dive (thực chiến)
- Request validation: custom validator, input filter
- Response transformation: custom response builder
- Bulk endpoint: /async/bulk, operation status
- File upload via REST: multipart/form-data handling
- Streaming response: large data export
- Custom error response: WebapiException, HTTP status codes
- API versioning: V1/V2 coexistence
- Custom authentication: custom token provider
