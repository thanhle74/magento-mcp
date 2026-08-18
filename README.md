# Magento Spec & Standards (SSOT & MCP Server)

Repo này là **Thư viện tri thức trung tâm (Single Source of Truth - SSOT)** về chuẩn Magento 2.4.8-p4 / PHP 8.3, tích hợp sẵn **MCP Server Stdio**.

Repo này **không chứa quy trình hay quản lý task/feature**. Bạn có thể kết nối MCP Server này vào bất kỳ dự án Magento nào để AI Agent ở dự án đó tham chiếu chuẩn kỹ thuật.

---

## 📌 Cấu trúc Nguồn sự thật (`config/`)

- `config/constitution.md` — Chuẩn kỹ thuật PHP 8.3 & Magento core.
- `config/checklist.md` — Tiêu chí Review Gate & DoD.
- `config/magento-patterns.md` — Bản đồ thiết kế (Plugin, Event, GraphQL, REST, Admin...).
- `config/references/` — Hướng dẫn mẫu code chi tiết cho từng component.

---

## ⚡ Cấu hình kết nối MCP Server

Thêm đoạn cấu hình sau vào Antigravity (`~/.gemini/antigravity/mcp_config.json`) hoặc Cursor (`~/.cursor/mcp.json`) ở bất kỳ máy / workspace nào:

```json
{
  "mcpServers": {
    "magento-spec": {
      "command": "node",
      "args": ["/home/thanhle/Sites/spec/src/index.js"],
      "env": {
        "SPEC_ROOT": "/home/thanhle/Sites/spec"
      }
    }
  }
}
```

---

## 🛠️ MCP Tools cung cấp cho AI

| Tool | Mô tả |
|---|---|
| `get_team_standards` | Nạp nhanh Constitution, Checklist & Pattern index. |
| `get_pattern_reference` | Lấy chi tiết mẫu code theo tên (VD: `core/plugin-patterns.md`). |
| `search_standards` | Tìm kiếm chuẩn/quy tắc theo từ khóa trong `config/`. |
| `get_review_gate` | Nạp checklist kiểm tra chất lượng code trước khi hoàn thành. |
| `read_spec_file` | Đọc bất kỳ file tài liệu nào trong thư viện spec. |
