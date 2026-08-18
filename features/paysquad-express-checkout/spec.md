# Spec - paysquad-express-checkout

## Input
- Feature: `PaySquad Express Checkout — "Buy Now with PaySquad"`
- Vấn đề: Customer muốn checkout nhanh với PaySquad trực tiếp từ minicart, không cần chọn payment method thủ công tại trang checkout
- Mục tiêu: Thêm nút "Buy Now with PaySquad" vào minicart; khi click, redirect thẳng đến OSC với PaySquad được pre-select và là payment method duy nhất hiển thị
- Module/scope biết chắc: `app/code/Secomm/PaySquad` (module `Secomm_PaySquad`; payment method code `paysquad`, config `payment/paysquad/*`)

## Business + scope

- In-scope:
  - Nút "Buy Now with PaySquad" trong minicart (hiển thị khi cart có ít nhất 1 item và PaySquad enabled)
  - Session flag `paysquad_express=1` được set khi click nút
  - Redirect đến `onestepcheckout-index-index` (Mageplaza OSC)
  - Plugin filter payment methods: khi flag active, chỉ cho phép `paysquad`
  - JS auto-select PaySquad khi flag active tại checkout
  - Flag clear sau khi: order placed thành công, customer navigate ra khỏi checkout, hoặc session expire
  - Admin config: toggle bật/tắt nút Express Checkout độc lập với toggle PaySquad chính
  - Thêm config path `payment/paysquad/express_checkout_enabled` vào `config.xml` và `system.xml`

- Out-of-scope:
  - Thay đổi flow checkout sau khi PaySquad được select (giữ nguyên flow hiện tại)
  - Hỗ trợ Hyvä theme (chỉ Luma/OSC)
  - Express checkout từ product page hoặc cart page (chỉ minicart)
  - Multi-store config riêng cho từng store view (dùng default scope)

## Acceptance criteria

**AC-01 — Nút minicart:**
- Nút "Buy Now with PaySquad" hiển thị trong minicart khi: `payment/paysquad/active = 1` VÀ `payment/paysquad/express_checkout_enabled = 1` VÀ cart có ít nhất 1 item (và trong giới hạn min/max order total nếu cấu hình)
- Nút ẩn khi PaySquad disabled (`active = 0`) hoặc Express Checkout disabled (`express_checkout_enabled = 0`)
- Nút ẩn khi cart trống
- Trên storefront Laybyland (Mageplaza QuickCart): nút KO có thể bị disable khi cart có BNPL exclusion / giới hạn sản phẩm (theo `bnplExclusionMessage` / `cartMaxProductActive` trong theme) — cần thống nhất với business rule “Decision” bên dưới
- Nút render qua KnockoutJS (QuickCart): cờ hiển thị đọc từ `window.checkout` (inject qua `Secomm\PaySquad\Plugin\Block\Cart\Sidebar::afterGetConfig`), ví dụ `isPaySquadExpressEnabled`; **không** dùng `window.checkoutConfig.payment.*` cho minicart

**AC-02 — Session flag:**
- WHEN customer click nút "Buy Now with PaySquad", THE Express_Checkout_Controller SHALL set session flag `paysquad_express = 1` qua AJAX call đến endpoint `/paysquad/express/set`
- WHEN session flag được set thành công, THE Express_Checkout_Controller SHALL trả về JSON `{"success": true}`
- IF AJAX call thất bại, THEN THE Minicart_Button SHALL hiển thị lỗi và không redirect

**AC-03 — Redirect:**
- WHEN session flag được set thành công, THE Minicart_Button SHALL redirect customer đến URL của `onestepcheckout-index-index`
- THE Redirect SHALL dùng URL được build bởi `Magento\Framework\UrlInterface` (không hardcode path)

**AC-04 — Filter payment methods:**
- WHILE session flag `paysquad_express = 1` active, THE Payment_Filter_Plugin SHALL filter danh sách payment methods chỉ còn `paysquad`
- THE Payment_Filter_Plugin SHALL là `afterGetActiveQuoteMethods` plugin trên `Magento\Payment\Model\MethodList`
- WHEN customer ở trang checkout không phải OSC (ví dụ: standard checkout), THE Payment_Filter_Plugin SHALL vẫn áp dụng filter nếu flag active

**AC-05 — Auto-select PaySquad tại checkout:**
- WHEN trang OSC load với session flag `paysquad_express = 1`, THE ConfigProvider SHALL expose `isExpressCheckout: true` trong `window.checkoutConfig.payment.paysquad`
- WHEN `isExpressCheckout = true`, THE PaySquad_JS_Component SHALL tự động select PaySquad làm payment method active (gọi `selectPaymentMethod()`)
- THE Auto_Select SHALL xảy ra sau khi payment methods list đã render (dùng KO subscription hoặc `afterRender`)

**AC-05b — Ẩn payment methods khác tại OSC:**
- WHILE session flag `paysquad_express = 1` active, THE Payment_Filter_Plugin SHALL đảm bảo chỉ `paysquad` có trong danh sách trả về từ `MethodList::getActiveQuoteMethods`
- Các payment method khác bị ẩn hoàn toàn (không render trong DOM), không chỉ bị disable

**AC-06 — Clear flag:**
- WHEN order được placed thành công (event `checkout_onepage_controller_success_action`), THE Flag_Clear_Observer SHALL unset session flag `paysquad_express`
- WHEN customer navigate ra khỏi trang checkout (request đến route khác ngoài `onestepcheckout/*`), THE Flag_Clear_Observer (`controller_action_predispatch`) SHALL unset session flag `paysquad_express` (implementation hiện tại: observer, không phải plugin `FrontController`)
- WHEN PHP session expire, THE flag SHALL tự động mất theo session (không cần xử lý thêm)
- THE Flag_Clear SHALL không ảnh hưởng đến order đã được tạo

**AC-07 — Admin config:**
- Admin config có thêm field `Express Checkout Button` (yes/no) trong group payment PaySquad (`payment/paysquad` trong `config.xml` / `system.xml`)
- Default value: `0` (disabled) trong `config.xml`
- Config path: `payment/paysquad/express_checkout_enabled`

**AC-08 — Security:**
- Endpoint `/paysquad/express/set` chỉ chấp nhận POST request
- THE Express_Checkout_Controller SHALL validate CSRF token (dùng Magento form key hoặc AJAX form key)
- IF cart trống khi request đến `/paysquad/express/set`, THEN THE Express_Checkout_Controller SHALL trả về JSON `{"success": false, "message": "Cart is empty"}` và không set flag

## Decision

- Requirement understanding:
  - Feature này là "express lane" — customer skip bước chọn payment method, PaySquad được pre-select và là lựa chọn duy nhất
  - Session flag là cơ chế trung tâm: set tại minicart, đọc tại checkout (PHP filter + JS auto-select), clear sau khi xong
  - Filter payment methods phải xảy ra ở PHP layer (plugin trên `MethodList`) để đảm bảo OSC không render các method khác, không chỉ ẩn bằng CSS/JS
  - Auto-select ở JS layer là UX enhancement — đảm bảo PaySquad được chọn ngay khi trang load, không cần customer click thêm
  - Clear flag cần 2 trigger: success (observer) và navigate away (plugin trên dispatch/router)

- Risks/assumptions:
  - Mageplaza OSC có thể override `MethodList` hoặc dùng API riêng để lấy payment methods — cần verify plugin hook đúng chỗ; nếu OSC dùng REST API `/V1/carts/mine/payment-methods`, plugin trên `MethodList` vẫn đúng vì OSC gọi qua service contract
  - Auto-select JS phụ thuộc vào timing của KO component render — cần dùng `isChecked` observable thay vì DOM manipulation trực tiếp
  - Clear flag khi navigate away: dùng plugin trên `Magento\Framework\App\FrontController::dispatch` hoặc observer `controller_action_predispatch` để check route; cần cẩn thận không clear flag khi customer đang ở các sub-route của OSC (ví dụ: AJAX calls từ OSC)

- Approach đã chốt:
  - Module: `Secomm_PaySquad` tại `app/code/Secomm/PaySquad/`
  - Session flag dùng `Magento\Checkout\Model\Session` (không dùng `Magento\Framework\Session\SessionManagerInterface` generic)
  - Plugin filter: `afterGetActiveQuoteMethods` trên `Magento\Payment\Model\MethodList` — đơn giản, không cần around
  - Clear flag khi navigate away: observer `controller_action_predispatch` check route không phải `onestepcheckout`
  - AJAX endpoint `/paysquad/express/set` để set flag (tránh GET request có thể bị prefetch)
  - `ConfigProvider` hiện tại được mở rộng để expose `isExpressCheckout` flag

- Business rules chính:
  - Nút chỉ hiển thị khi cả `active` VÀ `express_checkout_enabled` đều = 1 VÀ cart không có BNPL-excluded product
  - Khi flag active: PaySquad là payment method DUY NHẤT — không phải "được chọn sẵn trong danh sách đầy đủ"
  - Flag clear ngay khi order placed hoặc rời checkout — không persist sang session tiếp theo
  - BNPL exclusion check dùng `Laybyland\BnplExclusion\Helper\Data::isQuoteContainExcludeBnplItems()` — tái sử dụng logic đã có

- Scope được phép sửa: `app/code/Secomm/PaySquad/` + override theme Mageplaza QuickCart trên `Laybyland/layup` khi cần nút minicart

## Testcase

- Happy:
  - TC-01: PaySquad enabled + express enabled + cart có item + không có BNPL-excluded product → nút hiển thị trong minicart
  - TC-02: Customer click nút → AJAX set flag → redirect đến OSC URL
  - TC-03: Tại OSC với flag active → chỉ PaySquad trong payment list → PaySquad auto-selected
  - TC-04: Customer place order thành công → flag bị clear → quay lại checkout thấy đầy đủ payment methods
  - TC-05: Customer navigate ra khỏi checkout (về homepage) → flag bị clear

- Edge:
  - TC-06: Customer click nút → AJAX thành công → mở tab mới đến checkout → flag active trong cả 2 tab (session shared)
  - TC-07: Express checkout → customer thay đổi ý, chọn payment method khác tại OSC → không thể (chỉ có PaySquad) → customer phải navigate away để reset
  - TC-08: Flag active nhưng PaySquad bị disable trong Admin giữa chừng → `MethodList` trả về empty → OSC hiển thị "No payment methods available"
  - TC-09: Customer click nút khi cart trống (race condition) → endpoint trả `success: false` → không redirect
  - TC-14: Cart có product với `bnpl_exclude = 1` → nút ẩn trong minicart
  - TC-15: Cart có mix product (1 excluded + 1 không excluded) → nút ẩn

- Negative:
  - TC-10: PaySquad disabled (`active = 0`) → nút không hiển thị dù `express_checkout_enabled = 1`
  - TC-11: `express_checkout_enabled = 0` → nút không hiển thị dù PaySquad enabled
  - TC-12: POST đến `/paysquad/express/set` không có form key hợp lệ → 403 hoặc redirect về homepage (Magento CSRF protection)
  - TC-13: Flag không active → `MethodList` trả về đầy đủ payment methods (không bị filter)
