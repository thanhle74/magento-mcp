# QUICKSTART

## Trung tâm: `config/`

Thư viện chuẩn: [`config/README.md`](config/README.md)

**Bắt buộc mỗi session code/review:** MCP `get_team_standards` (constitution + checklist + magento-patterns).

Feature `spec.md` = phạm vi việc; **không** thay `config/`.

## Trigger

| Prefix | Thứ tự |
|--------|--------|
| `Q:` | `config/` liên quan → trả lời |
| `HOTFIX:` | `get_team_standards` → spec ngắn → fix |
| `FEATURE:` | `get_team_standards` → spec → `OK spec` → implement |

## FEATURE

1. Vị trí: `projects/<p>/features/<tên>/` hoặc `features/<tên>/`
2. `./scripts/new-feature.sh <tên> [project]`
3. **`get_team_standards`** (đã đọc config core)
4. Điền `spec.md` + đọc code scope
5. Pattern cần → `read_spec config/references/...`
6. `python scripts/validate-feature.py <path>`
7. `OK spec` → implement Tasks  
8. **`get_review_gate`** → PHPCS + checklist §12 → mới được báo done

## MCP

| Bước | Tool |
|------|------|
| Trước code | `get_team_standards` |
| Sau code / review | **`get_review_gate`** |
| Spec | `read_spec`, `write_spec`, … |
