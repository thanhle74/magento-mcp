# Spec — Magento team library (central)

Repo này trên **VPS** — MCP **chỉ đọc** (`config/`, `references/`). Feature spec nằm trong từng project: **`<magento-repo>/.spec/`**.

## Dev setup

[thanhle74/magento-spec-mcp SETUP.md](https://github.com/thanhle74/magento-spec-mcp/blob/main/SETUP.md)

1. MCP remote → `get_team_standards`
2. `init-project-spec.sh` → `.spec/` trong project Magento
3. `/spec` trong Cursor

## Luồng

```text
get_team_standards  →  .spec/features/.../spec.md  →  code  →  get_review_gate
```

## Cấu trúc (central)

```
config/
  constitution.md
  checklist.md
  magento-patterns.md
  references/
```

Feature specs: **không** lưu ở đây nữa (dùng `.spec/` per project).
