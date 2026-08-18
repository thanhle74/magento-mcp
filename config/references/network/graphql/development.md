# GraphQL — Development (schema, resolver, mở rộng, test)

Tóm tắt nhánh **Development** trên Adobe; chi tiết và mã mẫu: mở từng link **Nguồn**.  
**App Server / stateless resolver:** xem thêm [`../graphql-app-server.md`](../graphql-app-server.md).

---

## 1. Định nghĩa schema cho module

Nguồn: [Define the GraphQL schema for a module](https://developer.adobe.com/commerce/webapi/graphql/develop/)

- Mỗi module bổ sung GraphQL đặt **`etc/schema.graphqls`**; Magento **stitch** toàn bộ file thành một schema (tương tự merge XML).
- File gốc: `app/code/Magento/GraphQl/etc/schema.graphqls` — cấu trúc query/mutation cơ bản, toán tử so sánh, phân trang; cú pháp do **`webonyx/graphql-php`** kiểm tra.
- Trong `schema.graphqls` định nghĩa: query/mutation, type/interface, input, enum, `@doc`, và (khi cần) **`@resolver`**, **`@cache`** (xem §4 Identity).
- Các mục con trên Adobe: **Define queries**, **Define mutations**, **Define enumerations**, **Annotations** (`@doc(description: "...")`), **Query caching** (liên quan cache tag / Identity).

---

## 2. Resolvers

Nguồn: [GraphQL resolvers](https://developer.adobe.com/commerce/webapi/graphql/develop/resolvers/)

- Resolver xử lý từng field; context dùng chung: **`Magento\Framework\GraphQl\Query\Resolver\ContextInterface`**.
- Interface phổ biến:
  - **`ResolverInterface`** — `resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)`.
  - **`BatchResolverInterface`** — gom nhiều nhánh cùng kiểu (vd. `related_products`) để tránh N+1. Trả về `BatchResponse`.
  - **`BatchServiceContractResolverInterface`** — batch nhưng ủy quyền xử lý cho service contract.
- Mutation thường implement `ResolverInterface` (xem ví dụ đầy đủ trên Adobe).

### Resolver class template

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;

class MyResolver implements ResolverInterface
{
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        // Kiểm tra auth nếu cần
        if (false === $context->getExtensionAttributes()->getIsCustomer()) {
            throw new GraphQlAuthorizationException(__('Customer not authenticated.'));
        }

        // Validate input
        if (empty($args['id'])) {
            throw new GraphQlInputException(__('Required parameter "id" is missing.'));
        }

        // Trả về array — Magento map sang GraphQL type
        return [
            'id' => $args['id'],
            'name' => 'Example',
        ];
    }
}
```

### Context — thông tin request

```php
// Lấy customer ID
$customerId = $context->getUserId();

// Kiểm tra customer đã login
$isCustomer = $context->getExtensionAttributes()->getIsCustomer();

// Lấy store
$store = $context->getExtensionAttributes()->getStore();
```

### Exception types cho GraphQL

| Class | HTTP code | Dùng khi |
|-------|-----------|---------|
| `GraphQlInputException` | 400 | Input không hợp lệ |
| `GraphQlAuthorizationException` | 401 | Không có quyền |
| `GraphQlAuthenticationException` | 401 | Chưa đăng nhập |
| `GraphQlNoSuchEntityException` | 404 | Entity không tồn tại |
| `GraphQlAlreadyExistsException` | 409 | Entity đã tồn tại |

---

## 3. Mở rộng schema có sẵn

Nguồn: [Extend an existing GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/develop/extend-existing-schema/)

- **Stitching:** mọi `schema.graphqls` gộp thành một schema; node cùng **tên + loại** (type/interface/enum) được **mở rộng/ghi đệ quy** (giống tinh thần XML merge).
- Có thể: thêm field lên type/interface có sẵn, thêm thuộc tính, điều chỉnh hành vi resolver qua extension point, mở rộng **config** (Adobe mô tả các bước “Extend the schema”, “Resolve the field value”, “Extend configuration data”).
- **Related** trên doc: plugin resolver, `etc/graphql/di.xml`, v.v. — đọc trang đầy đủ khi implement.

---

## 4. Identity class (cache tag cho query cache được)

Nguồn: [Implement an identity class](https://developer.adobe.com/commerce/webapi/graphql/develop/identity-class/)

- Query **cache được** (kiểu product/category/CMS) cần class **Identity** trong `Model/Resolver/...`, implement **`Magento\Framework\GraphQl\Query\Resolver\IdentityInterface`**.
- **`getIdentities(array $resolvedData): array`** — map kết quả resolver → **cache tags** (prefix + id từng entity; thường thêm tag “tổng” không có id để xóa hàng loạt). Ví dụ core: `cat_p_1`, `cat_p_2`, … và `cat_p`.
- Trong `schema.graphqls`, chỉ định qua directive **`@cache(cacheIdentity: "Fully\\Qualified\\ClassName")`** trên field/query tương ứng.

---

## 5. Dịch vụ urlResolver tùy chỉnh

Nguồn: [Create a custom GraphQL urlResolver service](https://developer.adobe.com/commerce/webapi/graphql/develop/create-custom-url-resolver/)

- Module **`Magento\UrlRewrite`** xử lý rewrite URL canonical; custom entity vẫn cần **lưu/xóa** bản ghi trong bảng **`url_rewrite`**.
- Pattern: observer save/delete (tham chiếu `ProcessUrlRewriteSavingObserver` / observer xóa tương tự trong doc).
- **`etc/graphql.xml`:** mở rộng enum **`UrlRewriteEntityTypeEnum`** (thêm item entity của bạn).
- **`events.xml`:** gắn observer với sự kiện save/delete entity (tên event module bạn).
- Chi tiết: Events & observers, endpoint `urlResolver` trong reference.

---

## 6. Debug query

Nguồn: [Debugging GraphQL queries](https://developer.adobe.com/commerce/webapi/graphql/develop/debugging/)

- Debug PHP như request HTTP thường: **Xdebug** + PhpStorm (hoặc IDE khác).
- Gợi ý: thêm query string **`?XDEBUG_SESSION_START=PHPSTORM`** vào URL endpoint GraphQL, hoặc header/cookie **`XDEBUG_SESSION=PHPSTORM`** để bắt session debug.
- Liên quan: [Headers](https://developer.adobe.com/commerce/webapi/graphql/usage/headers/), xử lý exception (§7).

---

## 7. Xử lý exception

Nguồn: [Exception handling](https://developer.adobe.com/commerce/webapi/graphql/develop/exceptions/)

- Web API “che” `LocalizedException` khỏi client; GraphQL chỉ trả chi tiết verbose cho exception implement **`GraphQL\Error\ClientAware`** khi **developer mode** — không thì ghi log (`exception.log`) và client nhận lỗi chung.
- Nên dùng `ClientAware` cho lỗi **dự kiến** gắn field GraphQL; **tránh** lạm dụng để không lộ dữ liệu nhạy cảm.
- Các class trong **`Magento\Framework\GraphQl\Exception`** (ví dụ):  
  `GraphQlInputException` (`graphql-input`), `GraphQlAuthorizationException` (`graphql-authorization`), `GraphQlAuthenticationException`, `GraphQlNoSuchEntityException`, `GraphQlAlreadyExistsException`, …

---

## 8. Functional testing

Nguồn: [GraphQL functional testing](https://developer.adobe.com/commerce/webapi/graphql/develop/functional-testing/)

- Viết test trong module (thư mục `Test/GraphQl` / pattern Magento); dùng **`GraphQlQueryTest`** mặc định hoặc test tùy chỉnh (Adobe mô tả từng bước).
- **Fixtures** dữ liệu & config; có thể kỳ vọng exception trong test.
- Chạy test: framework PHPUnit/Magento (xem “Run functional tests” trên doc).

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Chỉ gọi API (Usage): [`usage.md`](./usage.md)
- App Server & stateless: [`../graphql-app-server.md`](../graphql-app-server.md)
