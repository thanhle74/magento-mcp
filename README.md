# Magento Spec & Standards (SSOT & MCP Server)

Repo này là **Thư viện tri thức trung tâm (Single Source of Truth - SSOT)** về chuẩn Magento 2.4.8-p5 / PHP 8.3, tích hợp sẵn **MCP Server Stdio**.

Repo này **không chứa quy trình hay quản lý task/feature**. Bạn có thể kết nối MCP Server này vào bất kỳ dự án Magento nào để AI Agent ở dự án đó tham chiếu chuẩn kỹ thuật.

---

## 📌 Cấu trúc

- `config/` — Nguồn sự thật:
  - `constitution.md` — Chuẩn kỹ thuật PHP 8.3 & Magento core.
  - `checklist.md` — Tiêu chí Review Gate & DoD.
  - `magento-patterns.md` — Bản đồ thiết kế (Plugin, Event, GraphQL, REST, Admin...).
  - `references/` — Hướng dẫn mẫu code chi tiết cho từng component.
  - `glossary.md` — Thuật ngữ Magento core.
- `examples/` — Blueprint mã mẫu theo chủ đề (vào `examples/INDEX.md` để chọn).
- `src/index.js` — MCP Server (stdio).

---

## ⚡ Cấu hình kết nối MCP Server

**Claude Code** (khuyến nghị scope `user` để available ở mọi project):

```bash
claude mcp add magento-spec -s user -- node /path/to/spec/src/index.js
```

**Cursor** (`~/.cursor/mcp.json`), **Antigravity** (`~/.gemini/antigravity/mcp_config.json`) và các client khác:

```json
{
  "mcpServers": {
    "magento-spec": {
      "command": "node",
      "args": ["/path/to/spec/src/index.js"]
    }
  }
}
```

> `SPEC_ROOT` (env) là tùy chọn — mặc định server tự lấy thư mục gốc của repo. Chỉ set khi bạn đặt repo ở nơi khác và muốn ghi đè.

---

## 🛠️ MCP Tools cung cấp cho AI

| Tool | Mô tả |
|---|---|
| `get_team_standards` | Nạp nhanh Constitution, Checklist & Pattern index. |
| `get_pattern_reference` | Lấy chi tiết mẫu code theo tên (VD: `core/plugin-patterns.md`). Không truyền path → list tất cả references. |
| `search_standards` | Tìm kiếm chuẩn/quy tắc/blueprint theo từ khóa trong `config/` + `examples/`. |
| `get_review_gate` | Nạp checklist kiểm tra chất lượng code trước khi hoàn thành. |
| `read_spec_file` | Đọc bất kỳ file tài liệu nào trong repo (`config/`, `examples/`, ...). |

---

## 🔄 Quy trình khuyến nghị cho AI Agent

1. **Trước code:** `get_team_standards` → nạp Constitution + Checklist + Pattern index.
2. **Khi implement:** `get_pattern_reference` / `search_standards` / `read_spec_file` để tra cứu pattern — không đoán từ memory.
3. **Trước khi báo done:** `get_review_gate` → qua §12 Review Gate trong `checklist.md`.
