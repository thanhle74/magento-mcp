# Luma Figma Architecture
> Chuẩn kiến trúc để tránh code drift khi scale nhiều page.

## Kiến trúc nền

- Child theme kế thừa `Magento/luma`.
- Override tối thiểu, chỉ override khi có lý do rõ.
- Không copy full core template nếu không cần.

## Trách nhiệm theo lớp

- **Layout XML**: tổ chức block/container và vị trí render.
- **PHTML**: render HTML, không chứa business logic nặng.
- **LESS**: style theo token + BEM, mobile-first.

## Nguyên tắc scale

- Component-first, page chỉ compose.
- Mỗi component có contract rõ (markup + class + states).
- Style tách theo component, tránh file global phình to.

## Anti-patterns cấm

- Hardcode màu/spacing khi đã có token.
- Selector lồng sâu gây specificity war.
- Chỉnh global style để vá lỗi cục bộ của một page.
