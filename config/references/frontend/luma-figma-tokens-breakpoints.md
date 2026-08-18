# Luma Figma Tokens and Breakpoints
> Chuẩn mapping design token từ Figma sang LESS để giữ consistency mobile/desktop.

## Token bắt buộc

- Color
- Typography
- Spacing
- Radius
- Shadow
- Z-index

## Rule mapping

- Token đặt tên theo semantic, không theo màu cụ thể.
- Không hardcode giá trị trong component nếu token đã có.
- Nếu desktop/mobile khác nhau, giữ cùng semantic name và override tại breakpoint.

## Breakpoint strategy

- Mobile-first implementation.
- Desktop là extension, không build desktop-first rồi patch ngược.
- Mỗi component phải ghi rõ behavior mobile vs desktop.

## Rủi ro chính

- Token naming theo màu -> khó đổi theme.
- Desktop/mobile drift -> phải review cặp theo component.
- CSS phình to -> cần review duplicate định kỳ.
