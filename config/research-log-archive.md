# Research Log — Archive (đã xong, lưu trữ)

> Các mục đã research xong (struck-through) được chuyển vào đây khỏi `research-log.md`
> để log sống gọn. Topic giữ nguyên văn để tra cứu/tránh research lại.
> Để force re-research: mục vẫn tra cứu được ở đây.

**Nâng cao / chuyên sâu (Adobe Commerce only)**

- ~~Staging & Preview (Commerce): version, update, campaign, timeline~~ ✅ Done
**Core / Architecture**

- ~~Around plugin: khi nào dùng, performance cost, callable pattern đúng~~ ✅ Done
- ~~Interceptor chain: thứ tự thực thi khi nhiều plugin cùng target 1 method~~ ✅ Done
- ~~Object Manager pool: shared vs non-shared instance, scope~~ ✅ Done
- ~~Generated code: Interceptor, Factory, Proxy — khi nào regenerate, troubleshoot~~ ✅ Done
- ~~Config XML merge: load order, area (global/frontend/adminhtml/webapi_rest/cron)~~ ✅ Done
- ~~Module sequence: `<sequence>` trong module.xml, circular dependency~~ ✅ Done
- ~~Area code: frontend/adminhtml/webapi_rest/webapi_soap/graphql/cron — ảnh hưởng DI~~ ✅ Done
- ~~AbstractModel vs DataObject: khi nào dùng cái nào, magic getter/setter~~ ✅ Done
- ~~Collection: addFieldToFilter, join, group, having — performance pitfalls~~ ✅ Done
- ~~ResourceModel: _beforeSave/_afterSave, connection, table prefix~~ ✅ Done
**Frontend**

- ~~RequireJS: mixins, map, shim, bundles, async loading~~ ✅ Done
- ~~KnockoutJS: observable, computed, custom binding, component lifecycle~~ ✅ Done
- ~~Checkout steps: custom step, payment renderer, shipping method renderer~~ ✅ Done
- ~~Admin form: fieldset, field types, dependencies, dynamic rows~~ ✅ Done
- ~~Admin grid: filters, mass actions, inline edit, bookmarks~~ ✅ Done
- ~~LESS/CSS: extend, mixin, variables, critical CSS, theme inheritance~~ ✅ Done
- ~~Luma theme: parent theme override, _module.less, _extend.less~~ ✅ Done
- ~~Pager/Toolbar: product list toolbar, sort, limit, custom toolbar~~ ✅ Done
**Business / Domain**

- ~~Catalog price: price waterfall, custom price modifier, group price~~ ✅ Done
- ~~Cart rules: condition combine, action types, coupon generation~~ ✅ Done
- ~~Tax: tax class, tax rule, FPT, display settings, store config~~ ✅ Done
- ~~Shipping: rate request, rate result, free shipping, table rates~~ ✅ Done
- ~~Order management: hold/unhold, cancel, reorder, partial invoice/ship~~ ✅ Done
**Infrastructure / DevOps**

- ~~Varnish: VCL config, ESI, cache purge, X-Magento-Tags~~ ✅ Done
- ~~RabbitMQ: exchange, queue, binding, dead letter, management UI~~ ✅ Done
- ~~MySQL: query optimization, EXPLAIN, slow query log, connection pool~~ ✅ Done
- ~~Xdebug: step debug, profiling, remote debug Docker/DDEV~~ ✅ Done
**Security**

- ~~Admin security: brute force protection, session lifetime, IP whitelist~~ ✅ Done
- ~~API token: integration token, customer token, admin token lifecycle~~ ✅ Done
**Testing & Quality**

- ~~Unit test: mock ObjectManager, mock Repository, data provider~~ ✅ Done
- ~~Integration test: fixtures, rollback, database isolation~~ ✅ Done
- ~~Static analysis: PHPStan, PHPMD, Magento coding standard (PHPCS)~~ ✅ Done
**Advanced Patterns / Architecture**

- ~~Command pattern: Command bus, CommandInterface, CommandPoolInterface~~ ✅ Done
- ~~Strategy pattern: pool of strategies, dynamic selection via DI~~ ✅ Done
- ~~Composite pattern: CompositeInterface, chaining processors~~ ✅ Done
- ~~Pipeline pattern: processor chain, SortedList, PipelineInterface~~ ✅ Done
- ~~Specification pattern: business rule objects, isSatisfiedBy~~ ✅ Done
- ~~Decorator pattern: wrapping service với extra behavior~~ ✅ Done
- ~~Null Object pattern: tránh null check, default implementation~~ ✅ Done
**Data Layer**

- ~~Collection vs Repository: khi nào dùng cái nào, performance trade-off~~ ✅ Done
- ~~SearchCriteria deep dive: FilterGroup logic (AND/OR), SortOrder, PageSize~~ ✅ Done
- ~~Custom SearchResults: SearchResultsInterface, TotalCount~~ ✅ Done
- ~~Database transaction: beginTransaction, commit, rollback trong ResourceModel~~ ✅ Done
- ~~Soft delete: is_active flag, filter trong collection~~ ✅ Done
- ~~Bulk operations: insertMultiple, insertOnDuplicate, deleteByIds~~ ✅ Done
- ~~Database connection: read/write split, slave connection~~ ✅ Done
- ~~Schema migration: alter column safely, zero-downtime migration~~ ✅ Done
**Performance Advanced**

- ~~Full Page Cache: hole punching, private content, ESI~~ ✅ Done
**PHP / OOP Deep Dive (Magento context)**

- ~~PHP 8.x features: named arguments, match expression, nullsafe operator, fibers~~ ✅ Done
- ~~Readonly properties: PHP 8.1+, dùng trong DTO/Data Object~~ ✅ Done
- ~~Enum: PHP 8.1+, dùng thay constant trong Magento~~ ✅ Done
- ~~First-class callable: PHP 8.1+, array_map với method reference~~ ✅ Done
- ~~Generator: yield, lazy collection, memory-efficient iteration~~ ✅ Done
**Magento Code Patterns (thực chiến)**

- ~~Builder pattern: SearchCriteriaBuilder, FilterBuilder deep dive~~ ✅ Done
- ~~Registry pattern: Magento\Framework\Registry — legacy, cách thay thế~~ ✅ Done
- ~~Modifier pattern: UI Component modifier, pool modifier~~ ✅ Done
- ~~Converter pattern: toDataModel, toArray, hydrator~~ ✅ Done
- ~~Validator chain: ValidatorInterface, CompositeValidator~~ ✅ Done
- ~~Processor chain: ProcessorInterface, sorted processor pool~~ ✅ Done
- ~~Mapper pattern: DB row → Data Object mapping~~ ✅ Done
- ~~Hydrator pattern: populate object từ array data~~ ✅ Done
**Debugging & Troubleshooting (thực chiến)**

- ~~Magento profiler: enable/disable, HTML output, custom profiler~~ ✅ Done
- ~~Query log: enable query log, slow query, EXPLAIN trong Magento~~ ✅ Done
- ~~DI compile error: common errors, how to fix, regenerate~~ ✅ Done
- ~~Plugin conflict: debug interceptor chain, identify conflicting plugin~~ ✅ Done
- ~~Observer infinite loop: detect, prevent, area restriction~~ ✅ Done
- ~~Memory leak: detect với Blackfire, common causes trong Magento~~ ✅ Done
- ~~500 error debug: exception.log, system.log, display_errors~~ ✅ Done
- ~~White screen of death: common causes, recovery steps~~ ✅ Done
- ~~Cache corruption: symptoms, flush strategy, cache backend check~~ ✅ Done
**Code Generation & Tooling**

- ~~Pestle: module scaffold, di.xml generation, common commands~~ ✅ Done
- ~~n98-magerun2: common commands, custom commands, scripting~~ ✅ Done
- ~~PHPStorm Magento plugin: DI navigation, plugin generation, inspections~~ ✅ Done
**Event / Observer Patterns (thực chiến)**

- ~~sales_order_place_after: common use cases, data available~~ ✅ Done
- ~~catalog_product_save_after: product save hook, reindex trigger~~ ✅ Done
- ~~customer_login: session data, redirect logic~~ ✅ Done
- ~~checkout_cart_add_product_complete: cart modification~~ ✅ Done
- ~~controller_action_predispatch: request intercept, redirect~~ ✅ Done
- ~~layout_generate_blocks_after: dynamic block injection~~ ✅ Done
- ~~clean_cache_by_tags: custom cache invalidation~~ ✅ Done
- ~~Custom event dispatch: best practices, naming convention, area~~ ✅ Done
**Plugin Patterns (thực chiến)**

- ~~Before plugin: modify arguments, add validation~~ ✅ Done
- ~~After plugin: modify return value, add data~~ ✅ Done
- ~~Around plugin: conditional execution, skip original~~ ✅ Done
- ~~Plugin on interface vs class: best practice~~ ✅ Done
- ~~Plugin disabled: di.xml disabled="true", area-specific disable~~ ✅ Done
- ~~Plugin sortOrder conflict: debug, resolve~~ ✅ Done
- ~~Plugin on Repository: common patterns (add filter, transform result)~~ ✅ Done
- ~~Plugin on Controller: redirect, modify response~~ ✅ Done
- ~~Plugin on Block: modify template, add data~~ ✅ Done
**Repository & Collection Patterns (thực chiến)**

- ~~Batch processing: load collection in chunks, memory management~~ ✅ Done
- ~~Collection cache: setPageSize, setCurPage, pagination~~ ✅ Done
**GraphQL Deep Dive (thực chiến)**

- ~~Custom query: schema.graphqls, resolver, di.xml~~ ✅ Done (trong graphql-mutation blueprint)
- ~~Custom mutation: input type, output type, validator~~ ✅ Done
- ~~Cache: @cache directive, cache identity, invalidation~~ ✅ Done
- ~~Error handling: GraphQlInputException, GraphQlNoSuchEntityException~~ ✅ Done
- ~~Authorization: isAllowed, customer context check~~ ✅ Done
- ~~Pagination: PageInfo, currentPage, pageSize~~ ✅ Done
**REST API Deep Dive (thực chiến)**

- ~~Custom endpoint: webapi.xml, interface, implementation~~ ✅ Done (trong custom-rest-api blueprint)
- ~~Custom search criteria: custom filter, custom sort~~ ✅ Done
