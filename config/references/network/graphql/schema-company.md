# GraphQL — Schema (Guide): Company (B2B) (queries + mutations + unions)

Tóm tắt nhóm **Company (B2B)** trên Adobe: đây là thành phần trung tâm của B2B, quản lý cấu trúc công ty (admin, team, user, role, phân quyền, credit). File này tổng hợp **queries** (§3–§7), **mutations** (§9–§20), và **unions** (§21–§22). Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Company (B2B) (nhóm schema)

Nguồn: [Company (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/)

- Đây là nhóm tính năng **B2B** dành cho **Adobe Commerce** (không phải Magento Open Source).
- Company là thực thể gốc để gom nhiều buyer vào một corporate account, xây cây tổ chức (team/subteam/user) và điều khiển quyền thao tác (đặt hàng, quote, credit, profile, ...).

---

## 2. Company (B2B) — danh sách queries (mục lục)

Nguồn: [Company (B2B) queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `company` | [company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/company/) | §3 |
| `isCompanyAdminEmailAvailable` | [isCompanyAdminEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-admin-email-available/) | §4 |
| `isCompanyEmailAvailable` | [isCompanyEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-email-available/) | §5 |
| `isCompanyRoleNameAvailable` | [isCompanyRoleNameAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-role-name-available/) | §6 |
| `isCompanyUserEmailAvailable` | [isCompanyUserEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-user-email-available/) | §7 |

---

## 8. Company (B2B) — danh sách mutations (mục lục)

Nguồn: [Company (B2B) mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/)

Theo Adobe, nhóm mutations này phục vụ quản trị công ty B2B: tạo/cập nhật company, quản lý user/team/role, và đổi vị trí team trong cây tổ chức.

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `createCompany` | [createCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create/) | §9 |
| `createCompanyRole` | [createCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-role/) | §10 |
| `createCompanyTeam` | [createCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-team/) | §11 |
| `createCompanyUser` | [createCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-user/) | §12 |
| `updateCompany` | [updateCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update/) | §13 |
| `updateCompanyRole` | [updateCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-role/) | §14 |
| `updateCompanyStructure` | [updateCompanyStructure](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-structure/) | §15 |
| `updateCompanyTeam` | [updateCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-team/) | §16 |
| `updateCompanyUser` | [updateCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-user/) | §17 |
| `deleteCompanyRole` | [deleteCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-role/) | §18 |
| `deleteCompanyTeam` | [deleteCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-team/) | §19 |
| `deleteCompanyUser` | [deleteCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-user/) | §20 |

---

## 3. `company`

Nguồn: [company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/company/)

- Trả về chi tiết company của user hiện tại (cần token của company user).
- Có thể query cấu trúc công ty nhiều tầng qua union (`Customer` và `CompanyTeam`), dùng `__typename` để phân biệt kiểu dữ liệu trong response.
- Adobe nêu rõ object `CompanyCredit` chứa `available_credit`, `outstanding_balance`, `credit_limit`; các giá trị này không chỉnh trực tiếp bằng mutation trong query này.
- Cú pháp (theo doc): `company: Company`
- **Bắt buộc** customer authentication token.

---

## 4. `isCompanyAdminEmailAvailable`

Nguồn: [isCompanyAdminEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-admin-email-available/)

- Kiểm tra email có dùng được để tạo company administrator hay không.
- Nếu email trùng customer hoặc company admin khác, kết quả `is_email_available = false`.
- Cú pháp (theo doc): `isCompanyAdminEmailAvailable(email: String!): IsCompanyAdminEmailAvailableOutput`
- **Bắt buộc** customer authentication token.

---

## 5. `isCompanyEmailAvailable`

Nguồn: [isCompanyEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-email-available/)

- Kiểm tra email có hợp lệ để đăng ký company không.
- Adobe lưu ý email có thể trùng existing customer/admin nhưng nếu trùng **company email** đã có thì trả `false`.
- Cú pháp (theo doc): `isCompanyEmailAvailable(email: String!): IsCompanyEmailAvailableOutput`
- **Bắt buộc** customer authentication token.

---

## 6. `isCompanyRoleNameAvailable`

Nguồn: [isCompanyRoleNameAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-role-name-available/)

- Kiểm tra tên role có thể tạo mới trong company hay không.
- Nếu role name đã tồn tại trong company, trả `is_role_name_available = false`.
- Cú pháp (theo doc): `isCompanyRoleNameAvailable(name: String!): IsCompanyRoleNameAvailableOutput`
- **Bắt buộc** customer authentication token.

---

## 7. `isCompanyUserEmailAvailable`

Nguồn: [isCompanyUserEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-user-email-available/)

- Kiểm tra email có thể dùng để tạo company user không.
- Trả `false` nếu email trùng customer hiện có hoặc company administrator.
- Cú pháp (theo doc): `isCompanyUserEmailAvailable(email: String!): IsCompanyUserEmailAvailableOutput`
- **Bắt buộc** customer authentication token.

---

## 9. `createCompany`

Nguồn: [createCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create/)

- Tạo company từ guest hoặc customer (khởi tạo company admin trong payload).
- Email company admin phải chưa tồn tại trong hệ thống.
- Company admin chưa thể thao tác B2B cho tới khi request được admin duyệt.
- Cú pháp (theo doc): `createCompany(input: CompanyCreateInput!): CreateCompanyOutput`

---

## 10. `createCompanyRole`

Nguồn: [createCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-role/)

- Tạo role mới cho company, bắt buộc truyền danh sách `permissions`.
- Adobe liệt kê đầy đủ resource tree (`Magento_Company::*`, `Magento_Sales::*`, `Magento_NegotiableQuote::*`, `Magento_PurchaseOrder::*`...).
- Cú pháp (theo doc): `createCompanyRole(input: CompanyRoleCreateInput!): CreateCompanyRoleOutput`
- Lỗi thường gặp: trùng tên role, hoặc cấp quyền con khi quyền cha đang deny.

---

## 11. `createCompanyTeam`

Nguồn: [createCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-team/)

- Tạo team mới trong company.
- `target_id` cho phép chỉ định node cha trong company structure; bỏ qua thì team nằm ở root.
- Cú pháp (theo doc): `createCompanyTeam(input: CompanyTeamCreateInput!): CreateCompanyTeamOutput`

---

## 12. `createCompanyUser`

Nguồn: [createCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-user/)

- Tạo company user mới (cần quyền `Magento_Company::users_edit`).
- Hành vi theo email: email mới thì tạo user ngay; email là customer chưa thuộc company thì gửi invitation; email đã thuộc company thì trả lỗi.
- Có thể set `target_id` để gắn user vào node/team cụ thể; cần `role_id` hợp lệ.
- Cú pháp (theo doc): `createCompanyUser(input: CompanyUserCreateInput!): CreateCompanyUserOutput`
- Lỗi thường gặp: email không hợp lệ, thiếu field bắt buộc, `role_id` không tồn tại.

---

## 13. `updateCompany`

Nguồn: [updateCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update/)

- Cập nhật thông tin top-level của company (name/legal_name/email/địa chỉ).
- Không dùng mutation này để sửa administrator, teams, roles, resources.
- Cú pháp (theo doc): `updateCompany(input: CompanyUpdateInput!): UpdateCompanyOutput`

---

## 14. `updateCompanyRole`

Nguồn: [updateCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-role/)

- Cập nhật role và permissions của company.
- Lưu ý quan trọng của Adobe: khi gửi `permissions`, mutation sẽ **rewrite toàn bộ** quyền theo payload mới, nên phải gửi đủ hierarchy cần giữ.
- Cú pháp (theo doc): `updateCompanyRole(input: CompanyRoleUpdateInput!): UpdateCompanyRoleOutput`
- Lỗi thường gặp: trùng tên role, permission tree không hợp lệ, `role_id` không tồn tại.

---

## 15. `updateCompanyStructure`

Nguồn: [updateCompanyStructure](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-structure/)

- Đổi node cha của một company team trong cây tổ chức.
- Input chính: `tree_id` (node cần move) và `parent_tree_id` (node cha mới).
- Cú pháp (theo doc): `updateCompanyStructure(input: CompanyStructureUpdateInput!): UpdateCompanyStructureOutput`

---

## 16. `updateCompanyTeam`

Nguồn: [updateCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-team/)

- Cập nhật dữ liệu team hiện có (ví dụ tên và mô tả).
- Cú pháp (theo doc): `updateCompanyTeam(input: CompanyTeamUpdateInput!): UpdateCompanyTeamOutput`

---

## 17. `updateCompanyUser`

Nguồn: [updateCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-user/)

- Cập nhật thông tin company user (job title, role, trạng thái active/inactive, ...).
- Cần `id` user hợp lệ; có thể đổi role qua `role_id`.
- Cú pháp (theo doc): `updateCompanyUser(input: CompanyUserUpdateInput!): UpdateCompanyUserOutput`
- Lỗi thường gặp: user không thuộc company của bạn, `role_id` không tồn tại, email trùng website khác.

---

## 18. `deleteCompanyRole`

Nguồn: [deleteCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-role/)

- Xoá role theo `id` (id lấy từ query `company`).
- Cú pháp (theo doc): `deleteCompanyRole(id: ID!): DeleteCompanyRoleOutput`

---

## 19. `deleteCompanyTeam`

Nguồn: [deleteCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-team/)

- Xoá team theo `id` (id lấy từ query `company`).
- Cú pháp (theo doc): `deleteCompanyTeam(id: ID!): DeleteCompanyTeamOutput`

---

## 20. `deleteCompanyUser`

Nguồn: [deleteCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-user/)

- Deactivate company user theo `id`.
- Cú pháp (theo doc): `deleteCompanyUser(id: ID!): DeleteCompanyUserOutput`
- Lỗi thường gặp: thiếu quyền thao tác, không thể xoá chính mình, không thể deactivate company admin hiện tại.

---

## 21. Company (B2B) — unions

Nguồn: [Company (B2B) unions](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/unions/)

- Nhóm unions cho Company hiện tập trung vào `CompanyStructureEntity`, dùng để mô tả node trong cây cấu trúc company.

---

## 22. `CompanyStructureEntity` (union)

Nguồn: [CompanyStructureEntity union](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/unions/structure-entity/)

- `CompanyStructureEntity` là GraphQL union cho node trong company structure.
- **Possible types** theo Adobe: `CompanyTeam` và `Customer`.
- Trường dùng union này: `CompanyStructureItem.entity`.
- Khi query cần dùng inline fragments (`... on CompanyTeam`, `... on Customer`) và nên lấy thêm `__typename` để phân biệt kiểu runtime.

---

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Checkout: [`schema-checkout.md`](./schema-checkout.md)
- Cart: [`schema-cart.md`](./schema-cart.md)
- Company unions (Adobe): [Company unions](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/unions/)
