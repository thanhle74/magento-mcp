# Magento 2 uiElement Internals Series (Alan Storm)

Tài liệu này gom 6 bài `uiElement Internals` để dùng khi cần debug sâu Magento UI runtime (không chỉ fix triệu chứng).

Nguồn:

- [Magento 2: Defaults, uiElement, Observables, and the Fundamental Problem of Userland Object Systems](https://alanastorm.com/magento-2-defaults-uielement-observables-and-the-fundamental-problem-of-userland-object-systems/)
- [Magento 2: Javascript Primer for uiElement Internals](https://alanastorm.com/magento-2-javascript-primer-for-uielement-internals/)
- [Tracing Javascript’s Prototype Chain](https://alanastorm.com/tracing-javascripts-prototype-chain/)
- [Magento 2: uiElement Standard Library Primer](https://alanastorm.com/magento-2-uielement-standard-library-primer/)
- [Magento 2: Using the uiClass Object Constructor](https://alanastorm.com/magento-2-using-the-uiclass-object-constructor/)
- [Magento 2: uiClass Internals](https://alanastorm.com/magento-2-uiclass-internals/)

---

## 1) Lộ trình đọc đề xuất

1. Defaults + uiElement + observables problem
2. Javascript Primer for uiElement Internals
3. Tracing Javascript’s Prototype Chain
4. uiElement Standard Library Primer
5. Using the uiClass Object Constructor
6. uiClass Internals

Gợi ý: với team mới, đọc 1-4 để đủ debug; đọc 5-6 khi cần root-cause bug phức tạp liên quan inheritance hoặc `_super`.

---

## 2) Những điểm then chốt cần nhớ

## A. Magento dùng userland object system cho JS UI

- `uiClass` và `uiElement` không phải class ES chuẩn; là object system do Magento dựng trên RequireJS + underscore + utils.
- Cần tránh giả định theo OOP truyền thống (Java/PHP), nhất là ở `defaults`, prototype chain, constructor behavior.

## B. Bẫy lớn: object trong `defaults` có thể bị share reference

- Nếu đặt object/observable trực tiếp trong `defaults`, nhiều instance có thể dùng chung reference.
- Dấu hiệu: thay đổi ở component A làm component B đổi theo dù không liên quan.
- Đây là nguồn bug rất khó thấy trong checkout/listing khi có nhiều component cùng kiểu.

## C. `this`, `call/apply/bind`, prototype chain là kiến thức bắt buộc

- Muốn đọc hiểu `uiClass` internals phải nắm chắc `this` binding và constructor function behavior.
- Phân biệt rõ:
  - javascript `[[prototype]]` (`__proto__`)
  - property `.prototype` của function constructor
- Nhầm hai thứ này sẽ debug sai hướng.

## D. Hiểu module nền trước khi đọc core internals

- `underscore`: `each`, `extend`, `isObject`.
- `mageUtils`: `extend` (deep copy), `nested`, `omit`, `template`.
- `mage/utils/wrapper`: `wrapSuper` để hỗ trợ `this._super`.

## E. `uiClass` features quan trọng cho debug

- `new` keyword có thể optional (new-less creation).
- `extend` tạo constructor kế thừa.
- merge `defaults` + template literal parsing.
- override method có thể gọi parent qua `_super`.
- `initialize`/`initConfig` là lifecycle quan trọng; quên gọi `_super` dễ làm config không init đúng.

---

## 3) Mapping với vấn đề thường gặp trong project Magento

- Bug “2 UI instance ảnh hưởng lẫn nhau” -> kiểm tra object reference trong `defaults`.
- Bug “component tạo được nhưng hành vi thiếu config” -> kiểm tra `initialize`/`initConfig` và `_super`.
- Bug “override method không giống kỳ vọng” -> kiểm tra `wrapper.wrapSuper` + chain kế thừa thực tế.
- Bug “khó trace method/data nguồn gốc” -> trace theo prototype chain + module alias thật (không chỉ alias ngắn).

---

## 4) Checklist debug nhanh cho `uiElement/uiClass`

- [ ] Instance có đang share object reference từ `defaults` không?
- [ ] `this` trong callback/method có bị bind sai context không?
- [ ] Method đang chạy đến từ object hiện tại hay từ parent prototype?
- [ ] Override có gọi `_super` đúng không?
- [ ] `initialize` / `initConfig` có bị custom và bỏ `_super` không?
- [ ] Module utility dùng `_.extend` hay `utils.extend` (shallow vs deep copy)?

---

## 5) Prompt mẫu để gọi AI debug sâu

```text
Dựa trên .spec/config/references/frontend/uielement-internals-series.md:
- Điều tra bug runtime trong UI component <name>
- Chỉ ra khả năng do shared defaults reference, this binding, prototype chain, hoặc _super/initConfig
- Trả về root-cause theo thứ tự xác suất + bước verify cụ thể trong browser console/uiRegistry
- Đề xuất fix tối thiểu, tránh phá inheritance chain hiện có
```

---

## Liên kết nội bộ

- [UI Components full series (13 bài)](./ui-components-series.md)
- [UI Components — How-to & Debug](./ui-components-howto.md)
- [Magento 2 Advanced JavaScript Series](./advanced-javascript-series.md)
