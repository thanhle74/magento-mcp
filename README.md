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
| `get_team_standards` | Nạp nhanh Constitution, Checklist & Pattern index. Truyền `part` (`constitution`\|`checklist`\|`patterns`) để nạp 1 file duy nhất. |
| `get_pattern_reference` | Lấy chi tiết mẫu code theo tên (VD: `core/plugin-patterns.md`). Không truyền path → list tất cả references (group theo area, kèm tóm tắt "dùng khi"). File lớn đọc slice bằng `offset`/`limit`. |
| `search_standards` | Tìm kiếm chuẩn/quy tắc/blueprint theo từ khóa trong `config/` + `examples/`. Nhiều từ khóa = AND; `"..."` cho exact phrase; `scope` thu hẹp vùng quét (`references`\|`config`\|`examples`). Kết quả group theo file, kèm số dòng + heading gần nhất để đọc tiếp bằng `offset`. |
| `get_review_gate` | Nạp checklist kiểm tra chất lượng code trước khi hoàn thành. |
| `read_spec_file` | Đọc bất kỳ file tài liệu nào trong repo (`config/`, `examples/`, ...). File lớn đọc slice bằng `offset`/`limit` (1-based). |

---

## ⚡ MCP Prompts (slash commands)

MCP server cung cấp sẵn 3 prompts — trong Claude Code hiện dạng slash command:

| Prompt | Lệnh | Chức năng |
|---|---|---|
| `session-start` | `/mcp__magento-spec__session-start` | Bootstrap đầu session: nạp standards + pattern index, tóm tắt rule quan trọng. |
| `review` | `/mcp__magento-spec__review` | Review diff hiện tại theo Review Gate (checklist §12), phân loại issue. |
| `implement` | `/mcp__magento-spec__implement "task..."` | Quy trình implement 1 task: load chuẩn → chọn pattern → code + unit test → review gate. |

Ví dụ:

```
/mcp__magento-spec__implement "thêm shipping method mới cho Laybyland"
```

---

## 🔄 Quy trình khuyến nghị cho AI Agent

1. **Trước code:** `/mcp__magento-spec__session-start` (hoặc gọi `get_team_standards` trực tiếp) → nạp Constitution + Checklist + Pattern index.
2. **Khi implement:** dùng `/mcp__magento-spec__implement`, hoặc gọi `get_pattern_reference` / `search_standards` / `read_spec_file` để tra cứu pattern — không đoán từ memory.
3. **Trước khi báo done:** `/mcp__magento-spec__review` (hoặc `get_review_gate`) → qua §12 Review Gate trong `checklist.md`.

---

## ✅ CI

Mọi push/PR chạy tự động (`.github/workflows/ci.yml`):

- `npm test` — smoke test MCP server (tools + prompts, path traversal, isError).
- `npm run check:links` — kiểm dead link + orphan reference (index discipline).
