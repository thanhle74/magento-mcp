# Magento Front End 2020 Series (Alan Storm)

Tài liệu này gom 6 bài trong series **Magento Front End 2020** để dùng làm:

- roadmap đánh giá hướng frontend Magento 2
- tài liệu định hướng team khi chọn **Luma/UI Components**, **PWA Studio**, hoặc **Hyva**
- checklist thực thi khi cần POC nhanh cho storefront/admin UI

Nguồn:

- [React: Hello Web Programmer](https://alanastorm.com/react-hello-web-programmer/)
- [What is Magento PWA Studio](https://alanastorm.com/magento-pwa-studio-what-is/)
- [Magento PWA Studio: Looking at the Tools](https://alanastorm.com/magento-pwa-studio-react-upward/)
- [A note on the PHP UPWARD Server](https://alanastorm.com/a-note-on-the-php-upward-server/)
- [Hyva Admin: UI Components you can use](https://alanastorm.com/hyva-admin-ui-components-you-can-use/)
- [Magento Front End 2020: A Preview and Review of Hyva](https://alanastorm.com/magento-frontend-2020-a-preview-review-of-hyva/)
- [Do Not Try to Bend the Fork, That's Impossible](https://alanastorm.com/do-not-try-to-bend-the-fork-thats-impossible/)
- [Read No Frills Magento Layout for Free](https://alanastorm.com/read-no-frills-magento-layout-for-free/)
- [Finishing No Frills Magento 2 Layout](https://alanastorm.com/finishing-no-frills-magento-2-layout/)

---

## 1) Lộ trình đọc đề xuất

1. React primer (để hiểu ngôn ngữ/mental model của PWA team).
2. PWA Studio architecture (vai trò React + UPWARD + Magento backend).
3. PWA tooling thực tế (buildpack, venia template, giới hạn docs/workflow).
4. Ghi chú UPWARD PHP vs JS deployment.
5. Hyva Admin DSL (admin grid nhanh, ít overhead hơn UI Components gốc).
6. Hyva frontend approach (Tailwind + Alpine + giảm nặng runtime JS).

---

## 2) Tổng hợp kiến trúc theo từng hướng

## A. Magento truyền thống (Luma/UI Components)

- Full-stack MVC vẫn là lõi.
- Frontend dùng RequireJS + Knockout + UI Components.
- Mạnh về backward compatibility và hệ sinh thái extension cũ.
- Đổi lại: payload lớn, debug JS/UI runtime phức tạp, DX dễ nặng.

## B. PWA Studio

- React app chạy qua Node tooling và gọi data qua GraphQL.
- UPWARD đóng vai trò lớp điều phối/proxy request.
- Build bằng monorepo package set (`buildpack`, `peregrine`, `venia-*`, `upward-*`).
- Phù hợp team có năng lực React/GraphQL mạnh; cần chấp nhận curve học + moving parts.

## C. Hyva (Frontend)

- Rebuild storefront theo hướng giảm phụ thuộc UI Components runtime.
- Dùng TailwindCSS + AlpineJS, giảm số request và độ phức tạp block tree.
- Tối ưu hiệu năng frontend và DX cho team theme hiện đại.

## D. Hyva Admin

- Toolkit độc lập để build admin grid nhanh bằng DSL XML gọn.
- Không thay toàn bộ admin backend; tập trung cải thiện DX khi tạo UI mới.
- Dễ tiếp cận hơn XML DSL của Magento UI Components cho use case CRUD grid.

---

## 3) Decision guide nhanh cho project

- Chọn **Luma/UI Components** khi:
  - cần tận dụng tối đa module/theme cũ,
  - scope frontend chủ yếu là custom vừa/nhỏ.
- Chọn **PWA Studio / custom React storefront** khi:
  - team đã mạnh React + GraphQL + Node build pipeline,
  - cần UX headless sâu và tách lifecycle frontend/backend.
- Chọn **Hyva** khi:
  - ưu tiên tốc độ storefront + đơn giản vận hành frontend,
  - muốn giảm gánh nặng RequireJS/Knockout/UI Components trên storefront.
- Chọn **Hyva Admin** cho custom admin grid mới khi:
  - muốn triển khai nhanh, giữ cấu hình tập trung, giảm boilerplate.

---

## 4) Practical notes cho repo `.spec` này

- Với task storefront truyền thống: đọc `advanced-javascript-series.md` + `ui-components-series.md` trước.
- Với task headless/PWA: đọc file này trước, sau đó define rõ boundary:
  - phần nào nằm ở Magento backend API,
  - phần nào ở Node/React app.
- Với task admin grid nhanh: cân nhắc pattern Hyva Admin để tạo prototype, rồi chuẩn hóa theo conventions của repo.
- Nếu task đụng sâu layout/block/template:
  - ưu tiên quay về nguyên lý layout gốc trước khi tối ưu JS framework,
  - tránh "bẻ cong" kiến trúc vượt khỏi abstraction mà team đang kiểm soát.

---

## 5) Cross-reading: mindset + nền tảng layout

- [Do Not Try to Bend the Fork, That's Impossible](https://alanastorm.com/do-not-try-to-bend-the-fork-thats-impossible/):
  - nhắc team chọn chiến lược theo giới hạn thật của hệ thống, không kỳ vọng sai abstraction.
- [Read No Frills Magento Layout for Free](https://alanastorm.com/read-no-frills-magento-layout-for-free/):
  - bổ trợ rất tốt khi debug block/layout handles và quyết định phạm vi custom đúng lớp.
- [Finishing No Frills Magento 2 Layout](https://alanastorm.com/finishing-no-frills-magento-2-layout/):
  - nhấn mạnh nền tảng layout/XML và luồng bootstrap CSS/JS vẫn là trọng tâm trong Magento 2 thực chiến.

---

## 6) Prompt mẫu để dùng với AI

```text
Đọc `.spec/config/references/frontend/magento-frontend-2020-series.md`
và đề xuất approach cho task frontend này:
1) Chọn stack: Luma/UI Components, PWA/React, hay Hyva.
2) Nêu trade-off chính (DX, performance, maintainability, ecosystem fit).
3) Đưa plan triển khai theo phạm vi module/file cho phép sửa.
4) Báo cáo verify steps tương ứng stack đã chọn.
```

---

## Liên kết nội bộ

- [Magento 2 Advanced JavaScript Series](./advanced-javascript-series.md)
- [UI Components full series](./ui-components-series.md)
- [UI Components — How-to & Debug](./ui-components-howto.md)
- [JavaScript init scripts](./javascript-init-scripts.md)
