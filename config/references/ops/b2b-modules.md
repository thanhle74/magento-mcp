# Tham khảo: B2B Modules (Adobe Commerce)

Nguồn:
- https://developer.adobe.com/commerce/webapi/rest/b2b/negotiable-quote/
- https://developer.adobe.com/commerce/php/module-reference/module-negotiable-quote
- https://privatedevops.com/articles/magento-2-b2b-features-implementation-guide

---

## 0. Tổng quan

Adobe Commerce B2B là bộ modules chỉ có trên **Adobe Commerce** (không có trên Magento Open Source). Cung cấp các tính năng cho B2B e-commerce.

**Modules chính:**

| Module | Chức năng |
|---|---|
| `Magento_Company` | Quản lý company accounts, roles, permissions |
| `Magento_SharedCatalog` | Catalog riêng cho từng company/customer group |
| `Magento_NegotiableQuote` | Thương lượng giá giữa buyer và seller |
| `Magento_PurchaseOrder` | Quy trình phê duyệt purchase order |
| `Magento_RequisitionList` | Danh sách mua hàng thường xuyên |
| `Magento_QuickOrder` | Đặt hàng nhanh bằng SKU |
| `Magento_CompanyCredit` | Tín dụng công ty |

---

## 1. Company Management

### Company Structure

```
Company
├── Admin User (super_user)
├── Roles & Permissions
│   ├── Manager Role
│   └── Buyer Role
└── Users
    ├── Manager User
    └── Buyer User
```

### API: Tạo Company

```bash
POST /V1/company/
Authorization: Bearer <admin-token>

{
    "company": {
        "company_name": "Acme Corp",
        "company_email": "admin@acme.com",
        "street": ["123 Main St"],
        "city": "New York",
        "country_id": "US",
        "region_id": 43,
        "postcode": "10001",
        "telephone": "555-1234",
        "super_user_id": 5
    }
}
```

### API: Lấy thông tin Company của Customer

```bash
GET /V1/customers/{customerId}/company
Authorization: Bearer <admin-token>
```

---

## 2. Shared Catalog

Shared Catalog cho phép tạo catalog riêng với giá riêng cho từng company hoặc customer group.

### Loại Shared Catalog

| Loại | Mô tả |
|---|---|
| Public | Catalog mặc định cho tất cả |
| Custom | Catalog riêng cho company cụ thể |

### API: Tạo Shared Catalog

```bash
POST /V1/sharedCatalog/
Authorization: Bearer <admin-token>

{
    "sharedCatalog": {
        "name": "Wholesale Catalog",
        "description": "Catalog for wholesale customers",
        "customer_group_id": 3,
        "type": 1,
        "created_by": 1,
        "store_id": 0,
        "tax_class_id": 3
    }
}
```

### API: Gán Products vào Shared Catalog

```bash
POST /V1/sharedCatalog/{sharedCatalogId}/assignProducts
Authorization: Bearer <admin-token>

{
    "products": [
        {"sku": "product-sku-1"},
        {"sku": "product-sku-2"}
    ]
}
```

---

## 3. Negotiable Quote

Cho phép buyer request giảm giá, seller review và counter-offer.

### Workflow

```
Buyer tạo quote → Seller review → Seller counter-offer → Buyer accept → Convert to Order
```

### States của Negotiable Quote

| State | Mô tả |
|---|---|
| `created` | Buyer vừa tạo |
| `processing_by_customer` | Buyer đang xem xét |
| `processing_by_admin` | Seller đang xem xét |
| `submitted_by_customer` | Buyer đã submit |
| `submitted_by_admin` | Seller đã submit offer |
| `ordered` | Đã convert thành order |
| `closed` | Đã đóng |
| `declined` | Bị từ chối |
| `expired` | Hết hạn |

### API: Tạo Negotiable Quote (Buyer)

```bash
POST /V1/negotiableQuote/request
Authorization: Bearer <customer-token>

{
    "quoteId": 5,
    "quoteName": "Q2 2026 Order",
    "comment": "Requesting 15% discount for bulk order"
}
```

### API: Seller Update Quote

```bash
PUT /V1/negotiableQuote/{quoteId}
Authorization: Bearer <admin-token>

{
    "quote": {
        "id": 5,
        "negotiable_quote": {
            "quote_name": "Q2 2026 Order",
            "negotiated_price_type": 1,
            "negotiated_price_value": 10
        }
    }
}
```

### API: Seller Submit Quote

```bash
POST /V1/negotiableQuote/submitToCustomer
Authorization: Bearer <admin-token>

{
    "quoteId": 5,
    "comment": "We can offer 10% discount"
}
```

---

## 4. Purchase Order

Workflow phê duyệt đơn hàng trong nội bộ company.

### Purchase Order Rules

```
Order Amount > $1000 → Requires Manager Approval
Order Amount > $5000 → Requires Director Approval
```

### API: Lấy Purchase Orders

```bash
GET /V1/purchaseOrders/mine
Authorization: Bearer <customer-token>
```

### API: Approve Purchase Order

```bash
PUT /V1/purchaseOrders/{purchaseOrderId}/approve
Authorization: Bearer <manager-token>
```

---

## 5. Tích hợp B2B trong Custom Module

### Kiểm tra Company của Customer

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Service;

use Magento\Company\Api\CompanyManagementInterface;
use Magento\Customer\Api\CustomerRepositoryInterface;

class CompanyService
{
    public function __construct(
        private readonly CompanyManagementInterface $companyManagement,
        private readonly CustomerRepositoryInterface $customerRepository
    ) {}

    public function getCustomerCompany(int $customerId): ?\Magento\Company\Api\Data\CompanyInterface
    {
        return $this->companyManagement->getByCustomerId($customerId);
    }

    public function isCompanyAdmin(int $customerId): bool
    {
        $company = $this->getCustomerCompany($customerId);
        if ($company === null) {
            return false;
        }
        return $company->getSuperUserId() === $customerId;
    }
}
```

### Kiểm tra B2B module có sẵn không

```php
// Trong di.xml — inject conditionally
// Hoặc kiểm tra trong code:
if (class_exists(\Magento\Company\Api\CompanyManagementInterface::class)) {
    // B2B available
}
```

---

## 6. Lưu ý quan trọng

- B2B modules chỉ có trên **Adobe Commerce** — không có trên Magento Open Source
- Cần cài đặt riêng: `composer require magento/module-b2b`
- Shared Catalog ảnh hưởng đến performance — cần index đúng cách
- Negotiable Quote không tương thích với một số payment methods
- Purchase Order cần cấu hình roles và rules trong Admin trước khi dùng

---

## 7. Verify steps

```bash
# Kiểm tra B2B modules đã cài
bin/magento module:status | grep -i "company\|negotiable\|purchase"

# Enable B2B modules
bin/magento module:enable Magento_Company Magento_NegotiableQuote Magento_PurchaseOrder
bin/magento setup:upgrade
bin/magento cache:clean
```

---

## Liên kết

- Customer Management: xem [../business/customer-management.md](../business/customer-management.md)
- ACL: xem [../security/acl.md](../security/acl.md)
- REST API: xem [rest/overview.md](./rest/overview.md)
- Quy tắc chung: xem [../../constitution.md](../../constitution.md)
