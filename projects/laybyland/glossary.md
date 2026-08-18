# Project Glossary - Laybyland

> Thuật ngữ domain riêng của dự án Laybyland.
> Core Magento glossary: xem [../../config/glossary.md](../../config/glossary.md)

---

## Layby Domain (Laybyland_Layby)

> Layby = hình thức mua hàng trả góp không lãi suất: khách đặt cọc, trả dần theo lịch, nhận hàng khi trả đủ.

| Thuật ngữ | Định nghĩa |
|---|---|
| `layby_order` | Bản ghi layby gắn với 1 sales order (`laybyland_layby_order` table) — chứa thông tin kế hoạch trả góp |
| `layby_transaction` | 1 lần thanh toán trong kế hoạch layby (`laybyland_layby_transaction` table) |
| `layby_history` | Lịch sử thanh toán layby của customer (`laybyland_layby_history` table) |
| `layby_payment_method` | Phương thức thanh toán đã lưu của customer dùng cho layby (`laybyland_layby_payment_methods` table) |
| `layby_refund` | Bản ghi hoàn tiền layby (`laybyland_layby_payment_refund` table) |
| `term` | Số kỳ trả góp (số lần thanh toán) |
| `term_type` | Loại kỳ: `weekly`, `fortnightly`, `monthly` |
| `balance` | Số tiền còn lại chưa thanh toán trong kế hoạch layby |
| `paid_amount` | Tổng số tiền đã thanh toán |
| `next_billing_date` | Ngày thanh toán kỳ tiếp theo |
| `last_billing_date` | Ngày thanh toán kỳ gần nhất |
| `original_final_payment_date` | Ngày dự kiến thanh toán kỳ cuối cùng |
| `recurring_schedule_frequency` | Tần suất thanh toán định kỳ |
| `dishonored_payment_fee` | Phí phạt khi thanh toán thất bại (dishonored = bị từ chối) |
| `ddstop` | Direct Debit Stop — cờ dừng thu tiền tự động |
| `external_account_reference_no` | Mã tham chiếu tài khoản từ hệ thống thanh toán bên ngoài |
| `account_reference_no` | Mã tham chiếu nội bộ của layby account |
| `batch_number` | Số batch của lần xử lý thanh toán |
| `current_payment` | Kỳ thanh toán hiện tại (số thứ tự) |
| `payment_type` | Loại thanh toán: `initial` (đặt cọc), `recurring` (định kỳ), `manual` (thủ công) |
| `suspended` | Trạng thái đơn layby bị tạm dừng sau khi thanh toán thất bại lần 2 |

### Business rules quan trọng
- Lần thanh toán thất bại đầu tiên: gửi email cảnh báo, **không** suspend order
- Lần thanh toán thất bại thứ hai liên tiếp: gửi email + suspend order
- Thanh toán thành công reset bộ đếm thất bại về 0

---

## Shopify Integration Domain (Laybyland_ShopifyIntegration / SellerShopify)

| Thuật ngữ | Định nghĩa |
|---|---|
| `seller` | Người bán hàng trên nền tảng, có thể sync sản phẩm từ Shopify |
| `shopify_product` | Sản phẩm được sync từ Shopify store của seller |
| `shopify_variant` | Biến thể sản phẩm Shopify (tương đương `child product` trong Magento) |
| `shopify_integration` | Kết nối giữa seller account và Shopify store |

---

## Shipping Domain (Laybyland_ShippingPerProduct / ShippitShipping)

| Thuật ngữ | Định nghĩa |
|---|---|
| `shipping_per_product` | Product attribute lưu giá ship riêng của từng sản phẩm (decimal) |
| `shippit` | Dịch vụ vận chuyển bên thứ ba tích hợp qua `Laybyland_ShippitShipping` |
| `shipping_subset` | Tập sản phẩm áp dụng shipping method theo product (xác định theo category) |

---

## Catalog / Integration import (middleware — đang thiết kế)

> Thuật ngữ pipeline import sản phẩm (Node + Magento + Magmi). **Định nghĩa đầy đủ + flow:** xem [`integration-import-middleware.md`](./integration-import-middleware.md) và tech design ở repo root.

| Thuật ngữ | Định nghĩa ngắn |
|-----------|----------------|
| `integration_import_job` | Bảng staging 1 dòng / file feed — trạng thái vòng đời job (`RECEIVED` … `COMPLETED`). |
| `integration_import_item` | Bảng staging 1 dòng / SKU (hoặc disable row) — `action`, `payload_json`, `status`, `line_no`. |
| `integration_product_snapshot` | Hash `hash_data` + `hash_image` theo `store_code` + `sku` để diff (skip Magmi khi không đổi). |
| **Claim** | `UPDATE job … WHERE status='STAGED'` atomic — một worker giữ job, tránh chạy đè. |
| `last_heartbeat_at` | Magento worker cập nhật định kỳ khi `APPLYING` — reclaim dùng để phát hiện worker chết (không dùng `started_at` cho job dài). |
| `hash_data` / `hash_image` | SHA-256 tập field phi-ảnh / ảnh+`image_updated` — so với snapshot để quyết `SKIP_NO_CHANGE` vs `UPSERT_REQUIRED`. |
| `image_updated` | Chuỗi datetime supplier trên feed — so với `mtime` file local trong B5. |
| `use_middleware` | Toggle admin: tắt thì không chạy pipeline mới (`DispatchCommand` + Node ingest phải cùng đọc một nguồn). |
