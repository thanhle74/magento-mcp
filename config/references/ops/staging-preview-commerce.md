# Staging & Preview (Adobe Commerce)

## 1) Scope và mục tiêu

- Chỉ áp dụng cho **Adobe Commerce** (không có trong Magento Open Source).
- Dùng để lên lịch thay đổi nội dung/catalog qua campaign và preview trước khi publish.

## 2) Khái niệm cốt lõi

- **Campaign**: tập hợp một hoặc nhiều scheduled updates.
- **Scheduled update**: thay đổi có thời điểm bắt đầu/kết thúc.
- **Baseline**: trạng thái mặc định khi không có campaign active; khi campaign hết hạn, dữ liệu quay về baseline.

Nguồn gốc:
- https://experienceleague.adobe.com/en/docs/commerce-admin/content-design/staging/content-staging
- https://developer.adobe.com/commerce/php/module-reference/module-staging/

## 3) Timeline, version và rule vận hành

- Một entity không thể có nhiều update chồng lấn trong cùng khoảng thời gian.
- Campaign được lập lịch theo timezone của Admin cấu hình mặc định; multi-website cần quy đổi thời gian cẩn thận.
- Preview campaign yêu cầu storefront và admin dùng cùng protocol (http/https) để tránh mixed-content.

Nguồn gốc:
- https://experienceleague.adobe.com/en/docs/commerce-admin/content-design/staging/content-staging
- https://developer.adobe.com/commerce/php/module-reference/module-staging/

## 4) Những gì stage được / không stage được (catalog)

Theo module `Magento_CatalogStaging`:
- Stage được nhiều thuộc tính product/category (name, price, description, design...).
- Không stage được một số field nhạy cảm như SKU, URL key, quantity.
- Các field thời gian đặc thù (special price from/to, design schedule...) được chuyển về workflow staging.

Nguồn gốc:
- https://developer.adobe.com/commerce/php/module-reference/module-catalog-staging/

## 5) Quy trình khuyến nghị cho team

1. Tạo campaign theo business event (sale, landing page, seasonal content).
2. Cấu hình start/end rõ ràng; tránh campaign mở vô hạn nếu cần rollback theo lịch.
3. Preview theo đúng scope store view trước khi publish.
4. Sau khi go-live, kiểm tra FPC/Fastly nếu storefront chưa phản ánh thay đổi.

Nguồn gốc:
- https://experienceleague.adobe.com/en/docs/commerce-admin/content-design/staging/content-staging
- https://www.appseconnect.com/content-staging-in-magento-2-commerce/

## 6) Trade-off và rủi ro

Ưu điểm:
- Giảm thao tác thủ công bật/tắt khuyến mãi theo giờ.
- Dễ kiểm soát timeline thay đổi theo campaign.

Nhược điểm:
- Dễ conflict khi nhiều team cùng lập lịch trên cùng entity.
- Dễ sai lệch giờ khi vận hành multi-timezone.

Mitigation:
- Có naming convention cho campaign (`<team>-<event>-<yyyyMMdd>`).
- Review lịch trên dashboard trước khi publish.
- Checklist sau publish: cache/FPC, price/index consistency, storefront preview.

## 7) Lưu ý implementation theo constitution

- Không dùng `ObjectManager::getInstance()` trong custom code thao tác staging.
- Nếu cần custom service cho validation campaign, inject dependencies qua constructor.
- Tránh `print_r/var_dump` trong flow debug production.

Nguồn gốc: các guideline code ví dụ từ nguồn cộng đồng đã được chuẩn hóa lại theo `config/constitution.md`.

