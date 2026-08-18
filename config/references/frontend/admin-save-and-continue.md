# Admin Form Save and Continue

> Scope: Magento Admin UI Component form (`view/adminhtml/ui_component/*_form.xml`)

## Mục tiêu

Đảm bảo người dùng bấm **Save and Continue** thì:
- Dữ liệu được lưu bằng save action hiện có.
- Sau khi lưu thành công, quay lại màn hình edit hiện tại (không thoát về listing).

## Pattern chuẩn

1. **Đăng ký button trong UI form XML**
   - Thêm button trong `<settings><buttons>`.
   - Button class implement `Magento\Framework\View\Element\UiComponent\Control\ButtonProviderInterface`.

2. **Button event**
   - Dùng event `saveAndContinueEdit` tại:
   - `data_attribute > mage-init > button > event`.

3. **Không tách save endpoint**
   - Dùng chung `submitUrl` với nút Save thông thường.
   - Chỉ tạo endpoint riêng khi có xử lý nghiệp vụ khác biệt thực sự.

4. **Controller redirect**
   - Trong save controller, kiểm tra cờ request (`back` hoặc `save_and_continue`).
   - Nếu có cờ: redirect về `*/*/edit` với `entity_id`.
   - Nếu không: redirect về `*/*/` (listing) theo hành vi Save mặc định.

## Verify bắt buộc

- Case 1: bấm **Save**
  - Kỳ vọng: lưu thành công và quay về listing.
- Case 2: bấm **Save and Continue**
  - Kỳ vọng: lưu thành công và ở lại màn edit cùng entity vừa lưu.
- Case 3: save fail (validation/business error)
  - Kỳ vọng: hiển thị message lỗi, giữ lại form data, vẫn ở luồng edit.

## Lỗi thường gặp

- Đã có button nhưng controller luôn redirect về listing.
- Dùng event sai (`save` thay vì `saveAndContinueEdit`) nên không gửi cờ mong đợi.
- Tạo thêm controller SaveAndContinue không cần thiết, làm tăng duplicate flow.
