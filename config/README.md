# config/ — Thư viện trung tâm (bắt buộc đọc)

Mọi feature `spec.md` chỉ mô tả **việc này**. Chuẩn code, review, pattern nằm ở đây.

## Luôn đọc trước (3 file)

| File | Vai trò |
|------|---------|
| [`constitution.md`](constitution.md) | Chuẩn PHP/Magento, SOLID, DoD, testing |
| [`checklist.md`](checklist.md) | Review gate trước khi báo done |
| [`magento-patterns.md`](magento-patterns.md) | Index pattern → link sang `references/` |

**MCP Cursor:** gọi `get_team_standards` (load cả 3).

## Tra cứu theo nhu cầu

| Thư mục / file | Khi nào |
|----------------|---------|
| [`references/`](references/) | Implement pattern cụ thể (REST, plugin, GraphQL, admin…) |
| [`glossary.md`](glossary.md) | Thuật ngữ Magento core |
| [`research-log.md`](research-log.md) | Ghi chú nghiên cứu (tùy chọn) |

**Quy tắc:** Đọc `magento-patterns.md` → chọn pattern → `read_spec config/references/...` tương ứng. Không đoán từ memory.

## Thứ tự làm việc

```
1. get_team_standards     → đọc config/ (trước code)
2. feature spec.md        → nghiệp vụ
3. code Magento
4. get_review_gate        → checklist + PHPCS + test (BẮT BUỘC trước báo done)
```

Không implement/review chỉ từ feature spec. Không báo done khi chưa qua **§12 Review gate** trong `checklist.md`.
