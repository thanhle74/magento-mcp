# GraphQL — Schema (Guide): Company (B2B)

Tóm tắt nhóm **Company (B2B)** trên Adobe, gồm **queries** kiểm tra email / role và truy vấn thông tin company, cùng **mutations** quản trị company/user/team/role/cấu trúc. Đây là tính năng **Adobe Commerce only** (B2B), không áp dụng cho Magento Open Source mặc định. Chi tiết field: từng link **Nguồn**.  
**Chữ ký theo bản:** [GraphQL API reference](https://developer.adobe.com/commerce/webapi/graphql/reference/) — xem [`reference.md`](./reference.md).

---

## 1. Company (B2B) (nhóm schema)

Nguồn: [Company (B2B)](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/)

- Company là entity trung tâm cho luồng B2B: cấu trúc công ty (team/sub-team/user), role/permission, và các workflow như order/quote/purchase/payment on account.
- Nhánh này thuộc nhóm **B2B** và chỉ khả dụng khi project bật module / edition tương ứng của Adobe Commerce.
- Ngoài queries, nhóm này còn có mutations quản trị company/role/team/user (create/update/delete) — xem thêm trên sidebar Adobe.

---

## 2. Company (B2B) — danh sách queries (mục lục)

Nguồn: [Company (B2B) queries](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/)

| Query | Nguồn Adobe | Trong file này |
|-------|-------------|----------------|
| `company` | [company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/company/) | §3 |
| `isCompanyAdminEmailAvailable` | [is-company-admin-email-available](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-admin-email-available/) | §4 |
| `isCompanyEmailAvailable` | [is-company-email-available](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-email-available/) | §5 |
| `isCompanyRoleNameAvailable` | [is-company-role-name-available](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-role-name-available/) | §6 |
| `isCompanyUserEmailAvailable` | [is-company-user-email-available](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-user-email-available/) | §7 |

---

## 3. `company`

Nguồn: [company](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/company/)

- Trả chi tiết công ty của user hiện tại; request phải có **customer token** của user thuộc company.
- Company structure có thể nhiều tầng (`Customer` và `CompanyTeam`); khi query sâu theo cây cấu trúc, dùng fragment + `__typename` để phân biệt object type trong union (theo doc).
- `CompanyCredit` trả các giá trị như `available_credit`, `outstanding_balance`; đây là dữ liệu trạng thái tín dụng công ty.
- Cú pháp guide (theo doc): `company: Company`.

---

## 4. `isCompanyAdminEmailAvailable`

Nguồn: [isCompanyAdminEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-admin-email-available/)

- Kiểm tra email có dùng được để tạo **company administrator** hay không.
- Nếu email trùng customer đã tồn tại hoặc company admin khác, trả `false`; `true` nghĩa là dùng được.
- Query yêu cầu **valid customer authentication token**.
- Cú pháp guide (theo doc): `isCompanyAdminEmailAvailable(email: String!): IsCompanyAdminEmailAvailableOutput`.

---

## 5. `isCompanyEmailAvailable`

Nguồn: [isCompanyEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-email-available/)

- Kiểm tra email có hợp lệ để đăng ký company hay không.
- Email có thể trùng customer hoặc company admin vẫn được; chỉ khi trùng **company email** đã tồn tại thì trả `false`.
- Query yêu cầu **valid customer authentication token**.
- Cú pháp guide (theo doc): `isCompanyEmailAvailable(email: String!): IsCompanyEmailAvailableOutput`.

---

## 6. `isCompanyRoleNameAvailable`

Nguồn: [isCompanyRoleNameAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-role-name-available/)

- Kiểm tra tên role có dùng được để tạo role mới trong company không.
- Nếu role name đã tồn tại trong company, trả `false`.
- Query yêu cầu **valid customer authentication token**.
- Cú pháp guide (theo doc): `isCompanyRoleNameAvailable(name: String!): IsCompanyRoleNameAvailableOutput`.

---

## 7. `isCompanyUserEmailAvailable`

Nguồn: [isCompanyUserEmailAvailable](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/queries/is-company-user-email-available/)

- Kiểm tra email có hợp lệ để tạo **company user** hay không.
- Nếu email trùng customer hiện có hoặc company admin, trả `false`.
- Query yêu cầu **valid customer authentication token**.
- Cú pháp guide (theo doc): `isCompanyUserEmailAvailable(email: String!): IsCompanyUserEmailAvailableOutput`.

---

## 8. Company (B2B) — danh sách mutations (mục lục)

Nguồn: [Company (B2B) mutations](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/)

- Nhóm mutation phục vụ quản trị B2B: tạo/cập nhật company, user, team, role; đổi vị trí team trong cây structure.
- Các mutation này yêu cầu **customer authentication token** hợp lệ (theo Adobe).

| Mutation | Nguồn Adobe | Trong file này |
|----------|-------------|----------------|
| `createCompany` | [create](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create/) | §9 |
| `createCompanyRole` | [create-role](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-role/) | §10 |
| `createCompanyTeam` | [create-team](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-team/) | §11 |
| `createCompanyUser` | [create-user](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-user/) | §12 |
| `deleteCompanyRole` | [delete-role](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-role/) | §13 |
| `deleteCompanyTeam` | [delete-team](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-team/) | §14 |
| `deleteCompanyUser` | [delete-user](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-user/) | §15 |
| `updateCompany` | [update](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update/) | §16 |
| `updateCompanyRole` | [update-role](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-role/) | §17 |
| `updateCompanyStructure` | [update-structure](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-structure/) | §18 |
| `updateCompanyTeam` | [update-team](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-team/) | §19 |
| `updateCompanyUser` | [update-user](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-user/) | §20 |

---

## 9. `createCompany`

Nguồn: [createCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create/)

- Tạo company theo yêu cầu customer hoặc guest; payload gồm thông tin công ty và company administrator.
- Email của tài khoản admin company phải **chưa tồn tại** trong hệ thống.
- Sau khi tạo, company admin cần được duyệt theo luồng B2B thì mới thao tác tiếp.
- `createCompany` có thể gọi bởi guest hoặc customer; nếu customer gọi thì email admin company không được trùng email customer đang dùng đăng nhập storefront.
- Cú pháp: `createCompany(input: CompanyCreateInput!): CreateCompanyOutput`

---

## 10. `createCompanyRole`

Nguồn: [createCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-role/)

- Tạo role mới cho company; bắt buộc gửi mảng `permissions`.
- Danh sách resource permission có thể lấy từ `company` query; permission mapping trong doc Adobe khá dài (Sales, Quote, PO, Company profile, user management, ...).
- Cú pháp: `createCompanyRole(input: CompanyRoleCreateInput!): CreateCompanyRoleOutput`

---

## 11. `createCompanyTeam`

Nguồn: [createCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-team/)

- Tạo team mới trong company.
- `target_id` xác định node cha trong structure; nếu bỏ qua, team vào root node.
- Có thể lấy `target_id` từ `company` query.
- Cú pháp: `createCompanyTeam(input: CompanyTeamCreateInput!): CreateCompanyTeamOutput`

---

## 12. `createCompanyUser`

Nguồn: [createCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/create-user/)

- Tạo company user mới (yêu cầu role của người thao tác có quyền `Magento_Company::users_edit`).
- Hành vi theo email:
  - email mới trên website -> tạo user ngay;
  - email đã là customer nhưng chưa thuộc company -> gửi invitation;
  - email đã thuộc company bất kỳ -> trả lỗi.
- `target_id` để gán node cha trong structure; mặc định root nếu không truyền.
- Cú pháp: `createCompanyUser(input: CompanyUserCreateInput!): CreateCompanyUserOutput`

---

## 13. `deleteCompanyRole`

Nguồn: [deleteCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-role/)

- Xóa role theo `id`.
- Có thể lấy `id` từ `company` query.
- Cú pháp: `deleteCompanyRole(id: ID!): DeleteCompanyRoleOutput`

---

## 14. `deleteCompanyTeam`

Nguồn: [deleteCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-team/)

- Xóa team theo `id`.
- Có thể lấy `id` từ `company` query.
- Cú pháp: `deleteCompanyTeam(id: ID!): DeleteCompanyTeamOutput`

---

## 15. `deleteCompanyUser`

Nguồn: [deleteCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/delete-user/)

- Deactivate company user theo `id`.
- Không thể tự xóa chính mình; không thể deactivate company admin hiện tại nếu chưa đổi admin khác (theo bảng lỗi Adobe).
- Cú pháp: `deleteCompanyUser(id: ID!): DeleteCompanyUserOutput`

---

## 16. `updateCompany`

Nguồn: [updateCompany](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update/)

- Cập nhật thông tin company cấp cao: address và các string như name/legal_name/email.
- Mutation này **không** cập nhật admin hoặc các object khác (team/role/resources).
- Cú pháp: `updateCompany(input: CompanyUpdateInput!): UpdateCompanyOutput`

---

## 17. `updateCompanyRole`

Nguồn: [updateCompanyRole](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-role/)

- Cập nhật role và permissions của role.
- Khi gửi `permissions`, cần truyền **đầy đủ hierarchy**; mutation sẽ rewrite toàn bộ permission theo payload mới.
- Cú pháp: `updateCompanyRole(input: CompanyRoleUpdateInput!): UpdateCompanyRoleOutput`

---

## 18. `updateCompanyStructure`

Nguồn: [updateCompanyStructure](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-structure/)

- Đổi node cha của một company team trong cây structure.
- Input thường gồm `tree_id` và `parent_tree_id`.
- Cú pháp: `updateCompanyStructure(input: CompanyStructureUpdateInput!): UpdateCompanyStructureOutput`

---

## 19. `updateCompanyTeam`

Nguồn: [updateCompanyTeam](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-team/)

- Cập nhật dữ liệu team (ví dụ name/description).
- Cú pháp: `updateCompanyTeam(input: CompanyTeamUpdateInput!): UpdateCompanyTeamOutput`

---

## 20. `updateCompanyUser`

Nguồn: [updateCompanyUser](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/mutations/update-user/)

- Cập nhật company user hiện có (job title, role, thông tin liên hệ, ... theo schema reference).
- Có thể lấy user ID và role ID bằng `company` query.
- Cú pháp: `updateCompanyUser(input: CompanyUserUpdateInput!): UpdateCompanyUserOutput`

---

## 21. Company (B2B) — unions

Nguồn: [CompanyStructureEntity union](https://developer.adobe.com/commerce/webapi/graphql/schema/b2b/company/unions/structure-entity/)

- `CompanyStructureEntity` là union cho node trong company structure; type thực tế có thể là:
  - `CompanyTeam`
  - `Customer`
- Dùng inline fragment + `__typename` khi query để phân nhánh field theo type.
- Union này xuất hiện trên field `CompanyStructureItem.entity`.

## Liên kết

- Mục lục folder: [`README.md`](./README.md)
- Luồng giỏ/checkout storefront: [`schema-cart.md`](./schema-cart.md), [`schema-checkout.md`](./schema-checkout.md)
- B2B liên quan: Company mutations / Negotiable quotes / Requisition lists trong sidebar [GraphQL schema](https://developer.adobe.com/commerce/webapi/graphql/schema/)
