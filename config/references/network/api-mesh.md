# Tham khảo: API Mesh for Adobe Developer App Builder

Nguồn:
- https://developer.adobe.com/graphql-mesh-gateway/gateway/mesh_walkthrough/
- https://developer.adobe.com/graphql-mesh-gateway/gateway/transforms/

---

## 0. Tổng quan

API Mesh là service của Adobe cho phép **compose nhiều API sources** (REST, GraphQL, SOAP) thành một GraphQL endpoint duy nhất. Chạy trên Adobe Developer App Builder (serverless).

**Khi nào dùng:**
- Cần expose unified API từ nhiều nguồn (Commerce + ERP + CRM)
- Muốn transform/rename fields từ API bên ngoài
- Cần rate limiting và caching ở tầng API gateway
- Headless storefront cần aggregate data từ nhiều service

**Yêu cầu:**
- Adobe Developer Console account
- Node.js + `@adobe/aio-cli`
- Adobe App Builder project

---

## 1. Cài đặt CLI

```bash
npm install -g @adobe/aio-cli
npm install -g @adobe/aio-cli-plugin-api-mesh
aio login
```

---

## 2. Cấu trúc `mesh.json`

```json
{
    "meshConfig": {
        "sources": [
            {
                "name": "CommerceGraphQL",
                "handler": {
                    "graphql": {
                        "endpoint": "https://your-store.example.com/graphql"
                    }
                }
            },
            {
                "name": "CommerceREST",
                "handler": {
                    "openapi": {
                        "source": "https://your-store.example.com/rest/all/schema?services=all"
                    }
                }
            },
            {
                "name": "ExternalERP",
                "handler": {
                    "openapi": {
                        "source": "https://erp.example.com/api/openapi.json"
                    }
                }
            }
        ]
    }
}
```

**Handler types:**

| Handler | Dùng cho |
|---|---|
| `graphql` | GraphQL endpoint |
| `openapi` | REST API với OpenAPI/Swagger spec |
| `soap` | SOAP web service |
| `json_schema` | JSON API không có schema |

---

## 3. Transforms — Biến đổi Schema

Transforms cho phép modify schema trước khi expose ra ngoài.

### 3.1 Prefix Transform (tránh conflict field names)

```json
{
    "meshConfig": {
        "sources": [
            {
                "name": "CommerceREST",
                "handler": {"openapi": {"source": "..."}},
                "transforms": [
                    {"prefix": {"value": "REST_"}}
                ]
            },
            {
                "name": "CommerceGraphQL",
                "handler": {"graphql": {"endpoint": "..."}},
                "transforms": [
                    {"prefix": {"value": "GQL_"}}
                ]
            }
        ]
    }
}
```

### 3.2 Rename Transform

```json
{
    "transforms": [
        {
            "rename": {
                "renames": [
                    {
                        "from": {"type": "Query", "field": "GetV1Products"},
                        "to": {"type": "Query", "field": "getProducts"}
                    }
                ]
            }
        }
    ]
}
```

### 3.3 Filter Schema Transform

```json
{
    "transforms": [
        {
            "filterSchema": {
                "filters": [
                    "Query.!adminQuery",
                    "Mutation.!adminMutation"
                ]
            }
        }
    ]
}
```

### 3.4 Type Merging (combine types từ nhiều sources)

```json
{
    "meshConfig": {
        "additionalTypeDefs": "extend type Product { erpData: ErpProductData }",
        "additionalResolvers": [
            {
                "targetTypeName": "Product",
                "targetFieldName": "erpData",
                "sourceName": "ExternalERP",
                "sourceTypeName": "Query",
                "sourceFieldName": "getErpProduct",
                "requiredSelectionSet": "{ sku }",
                "sourceArgs": {
                    "sku": "{root.sku}"
                }
            }
        ]
    }
}
```

---

## 4. Tạo và Deploy Mesh

```bash
# Tạo mesh mới
aio api-mesh:create mesh.json

# Cập nhật mesh
aio api-mesh:update mesh.json

# Xem mesh hiện tại
aio api-mesh:get

# Xem trạng thái build
aio api-mesh:status

# Xem URL của mesh
aio api-mesh:describe
```

---

## 5. Rate Limiting trong API Mesh

API Mesh không có built-in rate limiting. Cần implement ở tầng App Builder hoặc dùng CDN:

```json
{
    "meshConfig": {
        "plugins": [
            {
                "httpDetailsExtensions": {
                    "if": "context.request.headers['x-rate-limit-remaining'] < 10"
                }
            }
        ]
    }
}
```

Hoặc dùng Fastly/Cloudflare trước API Mesh endpoint.

---

## 6. Authentication

```json
{
    "meshConfig": {
        "sources": [
            {
                "name": "CommerceAdmin",
                "handler": {
                    "graphql": {
                        "endpoint": "https://your-store.example.com/graphql",
                        "operationHeaders": {
                            "Authorization": "Bearer {context.headers['x-commerce-token']}"
                        }
                    }
                }
            }
        ]
    }
}
```

---

## 7. Lưu ý quan trọng

- API Mesh là **Adobe Commerce only** (không có trên Open Source)
- Mesh chạy trên Adobe infrastructure — không cần server riêng
- Build time sau khi create/update: vài phút
- Dùng `aio api-mesh:source:discover` để tìm pre-built sources
- Không expose sensitive admin endpoints qua mesh — dùng `filterSchema` để loại bỏ

---

## 8. Verify steps

```bash
# Kiểm tra mesh đang chạy
aio api-mesh:status

# Lấy URL mesh
aio api-mesh:describe

# Test query
curl -X POST <mesh-url> \
  -H "Content-Type: application/json" \
  -d '{"query": "{ storeConfig { store_code } }"}'
```

---

## Liên kết

- GraphQL: xem [graphql/development.md](./graphql/development.md)
- Adobe I/O Events: xem [adobe-io-events.md](./adobe-io-events.md)
- REST API: xem [rest/overview.md](./rest/overview.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
