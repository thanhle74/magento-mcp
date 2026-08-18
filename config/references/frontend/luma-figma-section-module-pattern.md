# Luma Section Module Pattern
> Pattern chuẩn cho trường hợp chia section UI trong theme và seed dữ liệu bằng module Data Patch.

## Mục tiêu

- Tách rõ trách nhiệm giữa presentation (theme) và seed content (module).
- Dùng lại được cho nhiều section/page mà không bị coupling cứng.

## Kiến trúc trách nhiệm

- **Theme (XML + PHTML + LESS)**:
  - Render section
  - Style và responsive behavior
  - Fallback khi CMS block chưa tồn tại
- **Module (Data Patch)**:
  - Tạo CMS block mặc định
  - Seed nội dung tối thiểu
  - Idempotent (chạy lại không tạo trùng)

## Naming convention

- CMS block identifier theo format:
  - `{project}_{page}_{section}`
  - Ví dụ: `laybyland_home_hero`
- XML block name:
  - `{page}.{section}`
  - Ví dụ: `home.hero`
- PHTML class BEM block:
  - `c-{page}-{section}`
  - Ví dụ: `c-home-hero`

## Flow triển khai cho 1 section

1. Chốt section contract (design mobile + desktop + states).
2. Tạo layout XML để inject section vào page handle.
3. Tạo PHTML render section, chỉ xử lý presentation.
4. Tạo module Data Patch để seed CMS block mặc định.
5. Trong PHTML, render CMS block theo identifier và có fallback.
6. Style bằng LESS theo token + BEM, mobile-first.

## Guardrails bắt buộc

- Không nhét business logic nặng vào PHTML.
- Không hardcode identifier rải rác nhiều file; gom vào config hằng số nếu dùng lại nhiều nơi.
- Data Patch phải kiểm tra tồn tại trước khi tạo/update.
- Nếu CMS block thiếu hoặc disabled, section vẫn render an toàn (fallback placeholder hoặc ẩn section có kiểm soát).

## Fallback strategy

- Ưu tiên 1: render CMS block theo identifier.
- Ưu tiên 2: nếu không tồn tại, render nội dung fallback ngắn trong PHTML.
- Ưu tiên 3: log warning nhẹ để QA/dev nhận biết thiếu seed data.

## Checklist cho section pattern

- [ ] XML mapping đúng handle.
- [ ] PHTML không chứa business logic.
- [ ] Data Patch idempotent.
- [ ] Identifier đúng naming convention.
- [ ] Section có fallback khi thiếu CMS block.
- [ ] LESS theo BEM + token, pass mobile/desktop QA.
