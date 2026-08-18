# LayUpShop — Two-Factor Authentication (2FA) cho Customer — Tech Design

> Phạm vi: **[New request][all sites]** — 2FA cho customer storefront LayUpShop.  
> **Phạm vi doc:** chỉ **thiết kế kỹ thuật + estimate giờ dev** (PHP/Magento module, schema, FE storefront, wiring). **Không** tính QA/UAT, BA, tài liệu vận hành — các hạng mục đó nằm ngoài file này.  
> Quy tắc implement: `spec/AGENTS.md`, `spec/config/constitution.md`, `spec/config/magento-patterns.md` (+ references security khi code).  
> **Xác nhận theo spec nội bộ:** `spec/config/references/security/two-factor-auth.md` — 2FA core (`Magento_TwoFactorAuth`) chỉ cho **Admin**; **không** có 2FA built-in cho **customer storefront (FE)** (đúng với project **Adobe Commerce / Enterprise** trong `composer.json`).

---

## 0) Đã kiểm tra code hiện tại (snapshot)

| Khu vực | Phát hiện |
|---------|-----------|
| Login JSON (modal / header) | `Laybyland\LaybyForceRegister\Controller\Customer\LoginPost` — `authenticate()` rồi `session->setCustomerDataAsLoggedIn()` ngay, trả JSON. |
| Login AJAX minicart | `Laybyland\LayupMinicart\Controller\Ajax\Login` — cùng pattern `authenticate` + `setCustomerDataAsLoggedIn`. |
| Checkout | Mageplaza OSC + `authentication.js` — cần rà soát khi có bước 2FA (không giả định chỉ 1 endpoint). |
| Admin 2FA core | Có sẵn cho admin; **không** map 1:1 sang customer (UI, session, provider khác). |

**Kết luận:** Cần module/feature riêng + chỉnh **tất cả** điểm vào session customer sau `authenticate` (ưu tiên plugin/service thay vì copy-paste logic OTP vào từng controller).

---

## 1) Kiến trúc thực thi (đề xuất)

```
[ Browser ]
    │  (1) email + password
    ▼
[ Magento — Login controllers / AccountManagement plugin ]
    │  credentials OK & account active
    ▼
[ 2FA Gate Service ]
    ├─ 2FA disabled globally / per website / per customer → complete login (session)
    ├─ 2FA enabled, chưa bậy trên account → complete login (optional: prompt enroll)
    └─ 2FA enabled & enrolled → KHÔNG setCustomerDataAsLoggedIn
            │  tạo pending token (server-side, TTL ngắn, HttpOnly cookie hoặc encrypted payload)
            ▼
[ Browser ] (2) nhập OTP / TOTP / backup code
    ▼
[ Magento — Verify controller / API ]
    │  OK → setCustomerDataAsLoggedIn + xóa pending token + optional "remember device"
    └─ FAIL → rate limit + audit log (không leak enum user)
```

| Thành phần | Việc làm | Cấm |
|------------|----------|-----|
| **Gate service** | Quyết định sau `authenticate`: full login vs pending-2FA; TTL; single-use token | Không lưu mật khẩu trong pending state |
| **OTP/TOTP providers** | Interface + 1–2 implementation đã chốt (vd Email OTP, TOTP) | Không hardcode store ID; không `ObjectManager::getInstance()` |
| **Persistence** | `db_schema.xml` — bảng hoặc column mở rộng an toàn (secret encrypted at rest) | `InstallSchema` / raw `json_encode` trong service (dùng `Serializer\Json` inject) |
| **Controllers / UI** | Bước 2 UI + endpoint verify; reuse layout/theme hiện tại | Không fork logic auth rời rạc không test được |

**Quy tắc vàng**

1. **Một nguồn sự thật** cho “đã qua 2FA”: chỉ `setCustomerDataAsLoggedIn` sau verify thành công (hoặc sau policy “2FA off”).  
2. **Checkout không thêm bước 2FA giữa đường** — 2FA chỉ tại login; guest checkout không đổi. Customer đã login (session hợp lệ) tiếp tục checkout bình thường.  
3. **Không làm yếu session fixation**: regenerate session id khi promote từ pending → logged-in (bám pattern Magento customer session).  
4. **Rate limit + lockout** theo IP + identifier (email hash / customer id sau bước 1) — chống brute OTP.

---

## 2) Hạng mục kỹ thuật + estimate (**chỉ giờ dev**, chưa buffer)

### T1. Spike + interface — **6h**

- Spike thư viện TOTP (vd `spomky-labs/otphp` hoặc tương đương) + cách encrypt secret (Magento `encryptor` / field-level).  
- Định nghĩa `TwoFactorAuthProviderInterface`, `PendingLoginTokenManagerInterface`, `TwoFactorCustomerConfigInterface`.

### T2. Schema + resource model — **8h**

- Bảng gợi ý (tên chỉ minh họa — finalize khi implement):

| Bảng / thực thể | Mục đích |
|-----------------|----------|
| `customer_twofactor_profile` | `customer_id`, `method`, `secret_enc`, `enabled`, `enrolled_at`, `last_used_at` |
| `customer_twofactor_recovery` | `customer_id`, `code_hash`, `used_at` (hoặc JSON blob hashed từng code — trade-off normalize) |
| `customer_twofactor_attempt` (optional) | audit rate limit / hoặc dùng cache Redis — chọn 1, tránh duplicate |

- `db_schema.xml` + whitelist; không EAV cho secret.

### T3. Core verify + rate limit — **14h**

- Service verify OTP/TOTP/backup; constant-time compare.  
- Rate limiter: config `max_attempts`, `window_seconds`, `lockout_minutes` (scope website).  
- Logging: **không** log plaintext OTP/secret; log `customer_id` + event + result.

### T4. Plugin / orchestration login — **18h**

- **Ưu tiên:** plugin `around` trên `AccountManagementInterface::authenticate` **không** khuyến nghị nếu ảnh hưởng admin/API khác — thường an toàn hơn: **wrapper service** được gọi từ các controller login custom + plugin mỏng trên các entry còn lại (core `LoginPost` nếu enabled).  
- Refactor nhẹ `LaybyForceRegister` + `LayupMinicart` để gọi chung `CustomerLoginOrchestrator` (tránh lệch hành vi).  
- Pending token: short TTL (vd 5 phút), signature HMAC + nonce.

### T5. Bước 2 — routes + layout + JS/Knockout — **16h**

- Route `customer/account/login2fa` (tên ví dụ), block form, CSRF, form_key.  
- Responsive; copy tone UI LayUpShop hiện tại.

### T6. Customer account — bật/tắt / enroll / recovery — **14h**

- Tab “Security” trong account: enable 2FA, scan QR (TOTP), confirm code, hiển thị recovery codes một lần, regenerate recovery.  
- Email templates (Magento email) cho email OTP nếu chọn channel email.

### T7. “Remember this device” (optional) — **8h**

- Cookie / fingerprint signed, TTL config, revoke từ account.  
- Trade-off bảo mật: default nên OFF trừ khi product chỉ định.

### T8. Admin `system.xml` + ACL — **6h**

- Section module, flag bật/tắt, method, rate limit, TTL pending token.  
- `spec/AGENTS.md`: resource ACL + verify cache sau đổi config.

---

### 2.1. Tổng hợp estimate dev (T1–T8)

| Hạng mục | Giờ |
|----------|----:|
| T1 Spike + interface | 6 |
| T2 Schema + RM | 8 |
| T3 Verify + rate limit | 14 |
| T4 Orchestration + login paths | 18 |
| T5 Bước 2 UI | 16 |
| T6 Account security | 14 |
| T7 Remember device (optional) | 8 |
| T8 Admin config | 6 |
| **Cộng (gồm T7)** | **90** |
| **Bỏ T7 (MVP không remember device)** | **82** |
| **Buffer dev (rủi ro OSC / đa website ~15%)** | **+12–14** (trên 82) / **+13–14** (trên 90) |
| **Tổng dev chỉ đạo (~)** | **~94–96 h** (không T7) / **~103–104 h** (có T7) |

**Gợi ý phase — chỉ dev**

| Phase | Nội dung kỹ thuật | Giờ dev (ước lượng) |
|-------|-------------------|---------------------|
| **P1** | Một phương thức (email OTP *hoặc* TOTP), không T7, recovery tối giản + flag website | **~82 h** + buffer **~12–14 h** |
| **P2** | Thêm phương thức 2 hoặc T7 + chỉnh sửa OSC/edge sau P1 | **+36–48 h** dev |
| **P3** | SMS gateway + adapter | **+20–32 h** dev (+ ngoài scope: chi phí nhà mạng / compliance) |

---

## 3) Phương án OTP — trade-off & khuyến nghị

| Phương án | Ưu | Nhược |
|------------|-----|--------|
| **Email OTP** | Triển khai nhanh; không cần app; dùng transport email Magento | Phụ thuộc inbox; delay SMTP; nguy cơ nếu email bị compromise |
| **TOTP (Google Authenticator / Authy)** | Chuẩn industry; offline; không phí tin nhắn | UX enroll phức hơn; cần backup codes |
| **SMS OTP** | Quen thị trường | Chi phí; deliverability; regulatory; SIM swap |

**Khuyến nghị kỹ thuật:** **TOTP + recovery codes** làm baseline; **Email OTP** làm option cấu hình. Tránh bật cả ba kênh trong một phase dev.

**Phụ thuộc product (không nằm trong giờ ở trên):** bắt buộc vs opt-in; B2B/API; compliance SMS — chốt trước khi freeze schema & flow.

---

## 4) Ảnh hưởng checkout & trải nghiệm

| Kịch bản | Hành vi mong muốn |
|----------|-------------------|
| Guest checkout | Không đổi — không gọi 2FA. |
| Đã login trước khi vào checkout | Không hiện thêm bước 2FA. |
| Login ngay trên checkout (OSC) | Sau password → **cùng một luồng** pending → màn hình/step 2FA inline hoặc redirect `login2fa` rồi redirect về checkout — **không** mất giỏ (session cart). |
| Session timeout giữa checkout | Magento hiện tại yêu cầu login lại — 2FA chỉ lặp lại tại login. |

---

## 5) Bảo mật (tối thiểu)

- OTP length & entropy (vd 6–8 số / 32-bit TOTP window skew ±1 step).  
- Không trả message lỗi khác nhau giữa “sai OTP” và “sai user” **sau bước 1** (đã biết user hợp lệ) — có thể thống nhất message chung sau bước 2.  
- CSP / XSS: form 2FA là target mới — audit template escape.  
- Brute force: rate limit + captcha (nếu site đã có) sau N lần fail.

---

## Phụ lục A — Cấu trúc module gợi ý

```
app/code/Laybyland/CustomerTwoFactor/   # hoặc Secomm_* theo convention repo
├── Api/
├── Model/Service/
├── Controller/Customer/
├── Plugin/Customer/        # chỉ nơi thật sự cần
├── etc/
│   ├── frontend/routes.xml
│   ├── adminhtml/system.xml
│   └── db_schema.xml
└── view/frontend/
```

Phụ thuộc: `Magento_Customer`, `Magento_Store`, (optional) `Magento_Security` patterns — đọc reference **security** trong `spec/config/references/` khi viết `plan.md`.

---

## Phụ lục B — Deploy / toggle / rollback (kỹ thuật)

### B.1. Thứ tự deploy

1. Deploy module + `setup:upgrade`.  
2. Default `customer_2fa/enabled = 0`.  
3. Bật theo website khi sẵn sàng; `setup:di:compile` theo pipeline build.

### B.2. Rollback

- Tắt flag → orchestrator bypass → login về flow cũ.  
- Không drop bảng enroll trong rollback mềm.

---

## Phụ lục C — Map tài liệu kỹ thuật

| Tài liệu | Ghi chú |
|----------|--------|
| `spec/AGENTS.md` | DI, schema, logger, `system.xml` |
| `spec/config/constitution.md` | Chuẩn code |
| `spec/config/magento-patterns.md` + `references/security/*` | Pattern + security |
| `spec/projects/laybyland/glossary.md` | Domain (tham chiếu UX account nếu cần) |
