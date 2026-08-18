# Luma Figma Design Architecture
> Kiến trúc design layer cho LESS/tokens/font nhằm đảm bảo dễ maintain và scale đa page.

## Mục tiêu

- Chuẩn hóa token và font strategy cho toàn bộ frontend.
- Tránh hardcode và style drift giữa desktop/mobile.
- Giữ import flow rõ ràng, không phát sinh dependency vòng.

## Cấu trúc LESS khuyến nghị

- `tokens/_colors.less`
- `tokens/_spacing.less`
- `tokens/_typography.less`
- `tokens/_font-family.less`
- `tokens/_radius.less`
- `tokens/_shadow.less`
- `tokens/_zindex.less`
- `base/_font-face.less`
- `base/_reset.less` (nếu có)
- `components/<component>.less`
- `pages/<page>.less`

## Token taxonomy

- Token theo semantic, không theo màu cụ thể.
- Token typography tách riêng:
  - font-size
  - line-height
  - font-weight
- Font family tách riêng để dễ thay đổi branding toàn cục.

## Font strategy

- Ưu tiên self-host font cho ổn định và kiểm soát hiệu năng.
- Luôn có fallback stack rõ ràng.
- Nếu dùng nhiều weight/style, chỉ load subset cần thiết theo page.
- Có nguyên tắc hiển thị khi font chưa load (tránh layout shift lớn).

## Import order (bắt buộc)

1. Tokens
2. Base
3. Components
4. Pages

Rule:
- Component không import ngược page styles.
- Page không redefine token trừ trường hợp theme-level override đã duyệt.

## Responsive strategy

- Mobile-first ở cấp component.
- Desktop override theo breakpoint đã chuẩn hóa.
- Không giữ hai codebase style tách biệt cho mobile và desktop.

## Guardrails

- Không hardcode màu/spacing/font-size nếu token đã có.
- Không nested selector quá sâu.
- Không duplicate declaration giữa component tương tự.
- Không đưa patch cục bộ page vào token global khi chưa đánh giá impact.

## Review checklist nhanh

- [ ] Token mới có semantic name và lý do rõ ràng
- [ ] Font fallback đã khai báo
- [ ] Import order đúng chuẩn
- [ ] Component style không phụ thuộc ngầm page khác
- [ ] Mobile + desktop đều có behavior rõ
