# AGENTS.md — AI

Magento 2.4.8-p4 / PHP 8.3.

## Nguyên tắc số 1: `config/` là trung tâm

[`config/README.md`](config/README.md) = thư viện tài liệu chuẩn. **Bắt buộc đọc trước** mọi FEATURE, implement, review, HOTFIX (có sửa code), và `Q:` (câu hỏi kỹ thuật).

| Bước | Việc |
|------|------|
| 1 | **`get_team_standards`** (MCP) hoặc đọc đủ 3 file core trong `config/` |
| 2 | `read_spec` → `features/.../spec.md` (nghiệp vụ feature) |
| 3 | `read_spec` → `config/references/...` theo pattern trong `magento-patterns.md` |
| 4 | Code theo `constitution.md` + pattern references |
| 5 | **`get_review_gate`** — BẮT BUỘC trước báo done / khi review PR-module |
| 6 | PHPCS, test, verify; báo cáo sections checklist đã review |

**Cấm:** implement/review/approve chỉ dựa feature `spec.md`, bỏ qua `config/`.

Workflow: [`QUICKSTART.md`](QUICKSTART.md)

## Trigger

| Prefix | Hành vi |
|--------|---------|
| `Q:` | Đọc **`config/`** + code; không tạo feature |
| `HOTFIX:` | `get_team_standards` → spec tối giản → fix |
| `FEATURE:` | standards → spec → `OK spec` → code → **review gate** → done |
| Review module | `get_team_standards` + **`get_review_gate`** + code + checklist |

## Feature `spec.md`

Một file: AC, test cases, Tasks, Status. Không thay `config/`.

Tạo: `./scripts/new-feature.sh <tên> [project]`

## Pattern trong `config/references/`

- Bắt đầu từ `magento-patterns.md`
- Chỉ mở file reference **đúng pattern** feature cần
- Ghi path đã đọc vào Technical notes của `spec.md`

## MCP

| Khi | Tool |
|-----|------|
| Trước code / spec | **`get_team_standards`** |
| Sau code / review | **`get_review_gate`** (bắt buộc) |
| Feature / search | `read_spec`, `search_spec`, … |

## Output

Files changed · test · **checklist** · testcase — theo [`config/constitution.md`](config/constitution.md).
