# Tham khảo: Flash Sale / Daily Sale Engine (giá + quota có thời hạn)

> Từ khóa tra cứu: flash sale, daily sale, custom price, getFinalPrice, catalog_product_get_final_price, price_range GraphQL không áp giá, oversell, quota ledger, UPDATE affected rows, sale window boundary, TTL cache giá, quote item snapshot giá, plugin afterGetFinalPrice, secomm flash sale

Đây là bài học đắt nhất (spike nhiều ngày) về việc làm giá khuyến mãi runtime có giới hạn số lượng. Sai lầm số 1 của mọi lần làm lại: **tưởng custom price chỉ cần thêm vào Pricing framework là xong.**

---

## 1. 2-seam pricing — bẫy quan trọng nhất

Magento có **HAI luồng tính giá độc lập**, và flash sale price phải chạm **cả hai** nếu muốn PDP/GraphQL hiển thị đúng VÀ quote tính đúng:

| Seam | Luồng | Framework |
|------|-------|-----------|
| Display (PDP, GraphQL `price_range`, listing) | Pricing framework: `PricingObject` / `FinalPrice` pool | `Magento\Framework\Pricing` |
| Quote/cart/order | `Product::getFinalPrice()` → legacy `Magento\Catalog\Model\Product\Type\Price::getFinalPrice()` — event `catalog_product_get_final_price` | Legacy `Type\Price` |

Các sự thật đã verify:

- **Quote KHÔNG đi qua Pricing framework.** `addProduct`/`collectTotals` gọi `Product::getFinalPrice` (legacy), không ai trong chuỗi đó consult `FinalPrice` pool.
- **PDP/GraphQL `price_range` KHÔNG gọi `Type\Price::getFinalPrice`.** GraphQL đi qua Pricing pool, nên plugin legacy không thấy.
- **`catalog_product_price` indexer chỉ nhận special_price + catalogrule.** Giá flash sale tính runtime-fresh (còn quota, còn window) KHÔNG được indexer đụng tới — trông cậy indexer là thiết kế sai ngay từ đầu.

### Muốn giá custom áp cả PDP lẫn quote: làm 2 seam

**(a) Display seam** — thêm price object vào catalog Pricing pool (di.xml đăng ký vào `Magento\Catalog\Model\Product\Price\Factory` / wiring `priceInfo`), để `price_range` và PDP render cùng giá. Tham khảo cấu trúc pool price chuẩn: [catalog-price-rules.md](catalog-price-rules.md).

**(b) Quote seam** — plugin `afterGetFinalPrice` trên `Magento\Catalog\Model\Product`, guard **KHÔNG BAO GIỜ tăng giá**:

```php
public function afterGetFinalPrice(
    \Magento\Catalog\Model\Product $subject,
    $result,
    $qty = null
) {
    $flashPrice = $this->quotaEngine->getActivePrice($subject);
    if ($flashPrice === null) {
        return $result; // hết quota / ngoài window → nguyên giá
    }
    return min((float) $result, (float) $flashPrice);
}
```

> Quy tắc sống còn: `min($result, $flashPrice)`. Nếu flash price lệch config (0, null, sai đơn vị), `min` đảm bảo khách không bao giờ bị tính GIÁ CAO hơn giá chuẩn — lỗi giá tăng luôn tệ hơn lỗi giá không áp.

---

## 2. Consume/release events — điểm bám đúng

| Hành động | Event đúng | Vì sao |
|-----------|-----------|--------|
| Consume quota khi đặt hàng | `sales_model_service_quote_submit_success` | Fire **SAU khi order được save**, và là **single funnel** cho mọi đường đặt hàng (storefront, API, admin) |
| Release quota khi cancel | `order_cancel_after` | State cancel đã chốt |
| Release quota khi refund | `sales_order_creditmemo_save_after` | Refund hoàn lại quota theo item |

**KHÔNG dùng `sales_order_place_after`** — event này fire **TRƯỚC khi order được save**: nếu save thất bại (payment fail, deadlock) bạn đã trừ quota cho order không tồn tại; và các đường đặt không qua `place()` (một số flow admin/API) bị bỏ sót.

---

## 3. Quota ledger atomic — chống oversell race

Quota không phải một cột đếm đơn thuần — dùng **bảng ledger** với ràng buộc DB làm nguồn chân lý:

- Ledger row có **`UNIQUE(order_item_id)`** — 1 order item chỉ claim đúng 1 lần, replay event không nhân đôi trừ.

Claim theo **2 lớp chống race**:

```sql
-- Lớp 1: claim-first, INSERT ledger (vi phạm UNIQUE → item đã claim)
INSERT INTO flash_sale_quota_ledger (campaign_id, order_item_id, qty)
VALUES (:campaign_id, :order_item_id, :qty);

-- Lớp 2: trừ sold trong 1 statement có điều kiện, KHÔNG SELECT-then-UPDATE
UPDATE flash_sale_quota
SET sold_qty = sold_qty + :qty
WHERE campaign_id = :campaign_id
  AND sale_qty - sold_qty >= :qty;
-- check affected-rows: 0 → hết quota
```

`UPDATE ... WHERE sale_qty - sold_qty >= :qty` + **check affected-rows** là lớp duy nhất an toàn chống oversell khi nhiều request song song — pattern SELECT-then-UPDATE luôn thua race.

**Hết quota → giá tự fallback về giá chuẩn** (plugin ở mục 1 trả `null` → `min` giữ giá gốc). KHÔNG ném lỗi cho khách khi hết quota — hết quota là trạng thái kinh doanh, không phải exception.

---

## 4. Cache TTL-to-boundary

Giá flash sale là dữ liệu thời gian thực nhưng không được đánh đổi bằng cache sai:

- **TTL = min(300s, số giây tới boundary window gần nhất)** — window kết thúc 14:00:00, bây giờ 13:58:30 → TTL 90s, không phải 300s. Cache dài hơn boundary = bán sai giá sau khi sale tắt.
- **KHÔNG đụng `catalog_product_price` indexer** cho giá flash sale (xem mục 1 — indexer không hiểu runtime quota; invalidate indexer mỗi phút là tự sát hiệu năng).
- **FPC purge khi CRUD campaign** — tạo/sửa/tắt campaign phải purge các page chịu ảnh hưởng (PDP, PLP, block đếm ngược). Xem [../infrastructure/varnish-fpc.md](../infrastructure/varnish-fpc.md).
- **Giá snapshot vào quote item options khi add-to-cart** — lưu giá flash áp dụng vào `info_buyRequest`/option của quote item, để chống đổi giá giữa chừng: cart của khách không "nhảy" giá khi campaign tắt giữa phiên, và order in được bằng chứng đã bán giá nào.

---

## 5. Window & comparator chi tiết

Những chỗ dễ ra kết quả không tái lập được — chốt chuẩn ngay từ đầu:

- **Window end là EXCLUSIVE** — `[start, end)`: giây 13:59:59.999 còn sale, 14:00:00 hết. So sánh dùng `now < end` (không dùng `<=`); với cron/queue chạy lệch vài giây, kết quả nhất quán với client-side countdown.
- **Comparator chọn campaign khi nhiều campaign chồng nhau trên 1 sản phẩm:**
  1. `priority ASC` — số nhỏ ưu tiên trước
  2. `store_id DESC` — campaign scoped store (khác default) thắng campaign default
  3. `campaign_id ASC` — deterministic tie-break, tránh 2 môi trường chọn khác nhau
- **GraphQL display consistency:** `price_range` phải phản ánh **cùng seam** với quote — nếu chỉ plugin legacy mà không làm display seam, PDP/GraphQL hiển thị giá chuẩn trong khi add-to-cart về giá flash (và ngược lại). Test bắt buộc: so `price_range.minimum_price.final_price` với giá cart sau `addProductsToCart`.

---

## 6. Kiểm tra nhanh (checklist spike)

1. PDP + GraphQL `price_range` = giá flash khi còn quota.
2. Add-to-cart → quote item price = giá flash; quote item option có snapshot.
3. Race test: 2 request song song mua nốt item cuối → đúng 1 request thắng, 1 fallback giá gốc.
4. Hết quota → PDP + cart đều về giá chuẩn, không exception trong log.
5. Cancel + creditmemo → ledger row được release đúng qty.
6. Boundary: mua tại `end - 1s` được giá flash, tại `end` bị từ chối giá flash.
7. CRUD campaign → FPC purge; TTL không vượt boundary.

---

## Liên kết

- Pool price chuẩn (display seam): xem [catalog-price-rules.md](catalog-price-rules.md)
- Tổng custom quote: xem [quote-totals.md](quote-totals.md)
- Varnish/FPC purge: xem [../infrastructure/varnish-fpc.md](../infrastructure/varnish-fpc.md)
- Event-observer pattern: xem [../core/event-observer-patterns.md](../core/event-observer-patterns.md)
- Schema patch cho bảng ledger: xem [../core/data-schema-patch.md](../core/data-schema-patch.md)
- Troubleshooting sau deploy module: xem [../ops/deploy-troubleshooting.md](../ops/deploy-troubleshooting.md)
