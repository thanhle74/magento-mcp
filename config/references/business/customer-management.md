# Tham khảo: Customer Management

Nguồn: https://developer.adobe.com/commerce/php/module-reference/module-customer/

---

## 1. Service Contracts

### CustomerRepositoryInterface

```php
use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Customer\Api\Data\CustomerInterface;

// Lấy customer theo ID
$customer = $this->customerRepository->getById($customerId);

// Lấy customer theo email
$customer = $this->customerRepository->get($email, $websiteId);

// Lưu customer
$this->customerRepository->save($customer);

// Xóa customer
$this->customerRepository->deleteById($customerId);

// Tìm kiếm
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('group_id', 2)
    ->create();
$customers = $this->customerRepository->getList($searchCriteria)->getItems();
```

### AddressRepositoryInterface

```php
use Magento\Customer\Api\AddressRepositoryInterface;

// Lấy address theo ID
$address = $this->addressRepository->getById($addressId);

// Lấy tất cả addresses của customer
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('parent_id', $customerId)
    ->create();
$addresses = $this->addressRepository->getList($searchCriteria)->getItems();

// Lưu address
$this->addressRepository->save($address);
```

---

## 2. CustomerInterface — các field quan trọng

```php
$customer->getId();                    // entity_id
$customer->getEmail();
$customer->getFirstname();
$customer->getLastname();
$customer->getGroupId();               // Customer group ID
$customer->getWebsiteId();
$customer->getStoreId();
$customer->getCreatedAt();
$customer->getDefaultBilling();        // Address ID
$customer->getDefaultShipping();       // Address ID
$customer->getAddresses();             // Array of AddressInterface
$customer->getCustomAttribute('attr'); // Custom EAV attribute
```

---

## 3. Customer Group

Customer group dùng để phân loại khách hàng — ảnh hưởng đến giá (tier price), tax class, catalog rule.

| Group ID | Tên mặc định |
|----------|-------------|
| 0 | NOT LOGGED IN (guest) |
| 1 | General |
| 2 | Wholesale |
| 3 | Retailer |
| 32000 | ALL GROUPS (dùng trong tier price) |

```php
use Magento\Customer\Api\GroupRepositoryInterface;

// Lấy group của customer hiện tại
$groupId = $this->customerSession->getCustomerGroupId();

// Lấy thông tin group
$group = $this->groupRepository->getById($groupId);
$taxClassId = $group->getTaxClassId();
```

**Quy tắc:** KHÔNG hardcode group ID — dùng constant hoặc config.

---

## 4. Session vs HttpContext

Đây là điểm dễ nhầm nhất khi làm việc với customer trong context FPC (Full Page Cache).

### CustomerSession — KHÔNG dùng trong Block/ViewModel cho trang cached

```php
// SAI — CustomerSession không hoạt động đúng với FPC
// Block sẽ bị cache với state của customer đầu tiên
use Magento\Customer\Model\Session as CustomerSession;

class MyBlock extends Template
{
    public function isLoggedIn(): bool
    {
        return $this->customerSession->isLoggedIn(); // SAI với FPC
    }
}
```

### HttpContext — ĐÚNG cho trang cached

```php
// ĐÚNG — HttpContext hoạt động với FPC
use Magento\Framework\App\Http\Context as HttpContext;

class MyBlock extends Template
{
    public function isLoggedIn(): bool
    {
        return (bool) $this->httpContext->getValue(
            \Magento\Customer\Model\Context::CONTEXT_AUTH
        );
    }

    public function getCustomerGroupId(): int
    {
        return (int) $this->httpContext->getValue(
            \Magento\Customer\Model\Context::CONTEXT_GROUP
        );
    }
}
```

### CustomerData Sections — cho private data

Dữ liệu per-customer (tên, giỏ hàng, wishlist) phải load qua CustomerData sections (AJAX), không được lưu trong FPC.

```javascript
// JS: lấy customer data
require(['Magento_Customer/js/customer-data'], function(customerData) {
    var customer = customerData.get('customer');
    console.log(customer().fullname);
});
```

---

## 5. Customer Address

```php
use Magento\Customer\Api\Data\AddressInterfaceFactory;
use Magento\Customer\Api\Data\RegionInterfaceFactory;

// Tạo address mới
$address = $this->addressFactory->create();
$address->setFirstname('John')
        ->setLastname('Doe')
        ->setStreet(['123 Main St'])
        ->setCity('New York')
        ->setRegionId(43)  // NY
        ->setPostcode('10001')
        ->setCountryId('US')
        ->setTelephone('555-1234')
        ->setCustomerId($customerId)
        ->setIsDefaultBilling(true)
        ->setIsDefaultShipping(true);

$this->addressRepository->save($address);
```

---

## 6. Events quan trọng

| Event | Khi nào |
|-------|---------|
| `customer_register_success` | Đăng ký tài khoản thành công |
| `customer_login` | Đăng nhập |
| `customer_logout` | Đăng xuất |
| `customer_save_before` | Trước khi lưu customer |
| `customer_save_after` | Sau khi lưu customer |
| `customer_address_save_after` | Sau khi lưu address |
| `customer_account_edited` | Sau khi customer tự sửa account |

---

## 7. Custom Customer Attribute

```php
// Data Patch để thêm custom attribute
$customerSetup->addAttribute(
    \Magento\Customer\Model\Customer::ENTITY,
    'vendor_loyalty_points',
    [
        'type' => 'int',
        'label' => 'Loyalty Points',
        'input' => 'text',
        'required' => false,
        'visible' => true,
        'system' => false,
        'position' => 200,
        'is_used_in_grid' => true,
        'is_visible_in_grid' => true,
        'is_filterable_in_grid' => true,
    ]
);

// Gán attribute vào form sets
$attribute = $customerSetup->getEavConfig()
    ->getAttribute(\Magento\Customer\Model\Customer::ENTITY, 'vendor_loyalty_points');
$attribute->setData('used_in_forms', [
    'adminhtml_customer',
    'customer_account_edit',
]);
$attribute->save();
```

---

## 8. Lấy Customer trong Controller/Service

```php
// Trong Controller (frontend)
use Magento\Customer\Model\Session as CustomerSession;

$customerId = $this->customerSession->getCustomerId();
$customer = $this->customerSession->getCustomerData(); // CustomerInterface

// Trong Service (không có session context)
use Magento\Customer\Api\CustomerRepositoryInterface;

$customer = $this->customerRepository->getById($customerId);
```

---

## Liên kết

- Service Contracts: xem [../core/service-contracts.md](../core/service-contracts.md)
- Security: xem [../security/security-best-practices.md](../security/security-best-practices.md)
- Cache Management: xem [../infrastructure/cache-management.md](../infrastructure/cache-management.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
