# Luma Figma QA Gate
> Checklist bắt buộc trước khi merge page frontend.

## Visual

- [ ] Match Figma mobile
- [ ] Match Figma desktop
- [ ] Không lệch typography/spacing trọng yếu

## Responsive

- [ ] Không vỡ layout ở breakpoint trung gian
- [ ] Không overflow/scroll ngang ngoài ý muốn

## CSS quality

- [ ] Dùng token thay vì hardcode
- [ ] BEM naming đúng convention
- [ ] Không nested selector quá sâu
- [ ] Không style leak sang page khác

## Accessibility

- [ ] Focus state rõ ràng khi tab
- [ ] Contrast cơ bản đạt yêu cầu
- [ ] Semantic markup hợp lý

## Performance sanity

- [ ] Không gây layout shift lớn
- [ ] Asset size hợp lý
- [ ] Không thêm CSS/JS dư thừa
