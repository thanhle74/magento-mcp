# AGENTS.md — Magento SSOT Knowledge Base & MCP Server

Magento 2.4.8-p4 / PHP 8.3 Central Reference Library.

## Mục đích Repo

Repo này là **Thư viện tri thức trung tâm (Single Source of Truth - SSOT)** và **MCP Server**.
- **Không chứa quy trình làm việc hay quản lý task/feature:** Các dự án Magento khác sẽ sử dụng framework/quy trình riêng của dự án đó.
- **Vai trò:** Cung cấp thông tin chuẩn mực kỹ thuật (Constitution, Checklist, Design Patterns, Code References) thông qua các MCP Tool cho bất kỳ AI Agent nào tham chiếu.

---

## Cấu trúc Nguồn tri thức (`config/`)

- [`config/constitution.md`](config/constitution.md): Chuẩn code PHP 8.3 / Magento 2.4.8-p4, SOLID, Security, Performance, DB Declarative Schema.
- [`config/checklist.md`](config/checklist.md): Tiêu chí nghiệm thu & Review Gate (§12 Review gate).
- [`config/magento-patterns.md`](config/magento-patterns.md): Danh mục các mẫu thiết kế (GraphQL, REST, Plugin, Observer, Adminhtml, EAV...).
- [`config/references/`](config/references/): Thư viện mã mẫu và hướng dẫn chi tiết cho từng pattern.

---

## Tích hợp MCP Server

AI Agent ở bất kỳ dự án Magento nào chỉ cần kết nối tới MCP Server này để tra cứu chuẩn:

- **Command:** `node /home/thanhle/Sites/spec/src/index.js`
- **MCP Tools khả dụng:**
  - `get_team_standards`: Lấy nhanh Constitution, Checklist & Pattern index.
  - `get_pattern_reference`: Lấy hướng dẫn chi tiết cho pattern cụ thể (VD: `core/plugin-patterns.md`).
  - `search_standards`: Tìm kiếm chuẩn/quy tắc theo từ khóa trong `config/`.
  - `get_review_gate`: Lấy checklist nghiệm thu code.
  - `read_spec_file`: Đọc bất kỳ tài liệu tham khảo nào trong `config/`.
