# AGENTS.md — Magento SSOT Knowledge Base & MCP Server

Magento 2.4.8-p5 / PHP 8.3 Central Reference Library. Repo này là **thư viện tri thức trung tâm (Single Source of Truth)** đi kèm **MCP Server (stdio)** để AI Agent ở bất kỳ dự án Magento nào tra cứu chuẩn kỹ thuật.

## Nguyên tắc repo (bắt buộc)

- **Pure SSOT**: repo KHÔNG chứa quy trình làm việc, task, feature spec, template workflow. Dự án tiêu thụ (consuming project) tự quản process riêng.
- Mọi nội dung chuẩn nằm trong `config/`. Mã mẫu nằm trong `examples/`.
- Ngôn ngữ: nội dung chuẩn tiếng Việt có dấu; tên class/method/code tiếng Anh.

## Cấu trúc

- `config/constitution.md` — chuẩn code PHP 8.3 / Magento 2.4.8-p5, SOLID, security, DB declarative schema.
- `config/checklist.md` — tiêu chí Review Gate & DoD (§12).
- `config/magento-patterns.md` — **index duy nhất** mọi pattern → link sang `config/references/`.
- `config/references/<khu-vực>/` — reference chi tiết theo chủ đề (core, network, frontend, infrastructure, ops, security, business, inventory).
- `config/glossary.md` — thuật ngữ Magento core.
- `config/research-log.md` — log nghiên cứu (bookkeeping; đã bị loại khỏi `search_standards`).
- `examples/INDEX.md` — index blueprint mã mẫu.
- `src/index.js` — MCP Server.

## Quy tắc chỉnh sửa nội dung

1. **Reference mới phải được index**: thêm file vào `config/references/` → bắt buộc thêm dòng tương ứng trong `magento-patterns.md` (hoặc `examples/INDEX.md`). File không được index là file mồ côi — agent sẽ không tìm ra.
2. **Không tạo file trùng chủ đề**: kiểm tra `magento-patterns.md` trước — nếu chủ đề đã có, mở rộng file cũ thay vì tạo file mới.
3. **Core files (`constitution`, `checklist`, `magento-patterns`)** được nạp nguyên văn qua `get_team_standards` — giữ gọn, không nhét mã mẫu dài vào 3 file này.
4. **File reference không nên vượt ~30KB** — chia nhỏ theo chủ đề nếu to hơn (token cost mỗi lần agent đọc).
5. Sửa `SEARCH_EXCLUDE` trong `src/index.js` khi thêm log/bookkeeping mới.

## Verify MCP Server sau khi sửa `src/index.js`

```bash
npm test
```

Smoke test (`scripts/smoke-test.mjs`) kiểm: capabilities (tools + prompts), 5 tools, path traversal bị chặn, `isError` khi thiếu argument, đọc file core, search phủ `config/` + `examples/`, cảnh báo size cho file lớn, listing không còn file đã gộp/xóa, 3 prompts + xử lý argument/error.

## Kiểm tra link / orphan (index discipline)

```bash
npm run check:links
```

`scripts/check-links.mjs` kiểm: mọi link `.md` relative trong docs phải tồn tại; mọi file trong `config/references/` + `examples/` phải được tham chiếu từ ít nhất một index (`magento-patterns.md`, `examples/INDEX.md`, hoặc file reference cha như `network/graphql/README.md`). CI (`.github/workflows/ci.yml`) chạy cả hai check trên mọi push/PR.

## MCP Tools (dành cho dự án consume)

| Tool | Mô tả |
|---|---|
| `get_team_standards` | Constitution + Checklist + Pattern index. |
| `get_pattern_reference` | Reference chi tiết theo path (không truyền path → list tất cả). |
| `search_standards` | Tìm keyword trong `config/` + `examples/`. |
| `get_review_gate` | Checklist review trước khi báo done. |
| `read_spec_file` | Đọc file bất kỳ trong repo. |

## MCP Prompts (slash commands)

Định nghĩa trong `PROMPTS` (src/index.js) — mỗi prompt là message hướng dẫn agent gọi tools nào, nội dung chuẩn vẫn nằm trong `config/`.

| Prompt | Chức năng |
|---|---|
| `session-start` | Bootstrap đầu session: nạp standards + pattern index, tóm tắt rule. |
| `review` | Review diff hiện tại theo Review Gate (checklist §12). |
| `implement` | Implement task theo quy trình: load chuẩn → chọn pattern → code → review gate. |

Quy tắc chỉnh sửa prompts: prompt chỉ trỏ về tools/sections, KHÔNG nhét nội dung chuẩn vào prompt text (tránh trùng SSOT).

Cấu hình kết nối cho dự án khác: xem `README.md`.
