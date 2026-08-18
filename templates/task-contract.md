# Task Contract Template (Anti-vibe Coding)

Mục tiêu của file này là biến yêu cầu thành **hợp đồng thực thi** để AI trả về output đúng, có thể verify, có tiêu chí pass/fail rõ ràng.

## 1) Metadata

- Task name:
- Owner:
- Priority: `P0|P1|P2`
- Deadline (nếu có):

## 2) Goal

- Kết quả cần đạt (business + technical):
- Impact mong đợi:

## 3) Scope được phép sửa

- Allowed files/modules:
- Allowed layers: `Controller|Service|Repository|UI Component|GraphQL|Webapi|Patch|...`

## 4) Out of scope (cấm sửa)

- Không được sửa:
- Không được đổi hành vi:

## 5) Inputs / References bắt buộc

- Constitution: `.spec/config/constitution.md`
- Pattern docs:
  - (liệt kê file cụ thể trong `.spec/config/references/...`)
- Blueprint:
  - (nếu có trong `.spec/examples/integration/...`)

## 6) Constraints kỹ thuật

- Backward compatibility:
- Performance constraints:
- Security constraints:
- Data migration constraints:

## 7) Acceptance Criteria (pass/fail)

- [ ] AC1:
- [ ] AC2:
- [ ] AC3:
- [ ] Không sinh regression ở flow liên quan.

## 8) Verify steps bắt buộc

- [ ] `bin/magento setup:upgrade` (nếu có patch/schema)
- [ ] `bin/magento setup:di:compile`
- [ ] `bin/magento cache:flush`
- [ ] Test tay:
  - [ ] Scenario 1:
  - [ ] Scenario 2:

## 9) Output contract (AI phải báo cáo)

AI bắt buộc trả về:

1. Files changed (đường dẫn cụ thể)
2. Lý do thay đổi theo từng nhóm file
3. Verify steps đã chạy + kết quả
4. Risk còn lại (nếu có)

## 10) Prompt mẫu để giao task

```text
Đọc `.spec/config/constitution.md`, sau đó đọc task contract tại `<path-to-contract>`.
Chỉ sửa trong phạm vi được phép.
Implement theo Acceptance Criteria.
Báo cáo đúng Output contract:
1) files changed
2) lý do thay đổi
3) verify steps + kết quả
4) risk còn lại
Nếu thiếu thông tin quan trọng, hỏi lại trước khi sửa code.
```
