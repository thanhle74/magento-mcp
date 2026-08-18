# Tham khảo: Tìm kiếm & Điều hướng (Search Navigation)

Nguồn: https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/search/overview-search

---

## 1. Công cụ tìm kiếm (Search Engines)

Từ bản **2.4.8**, Magento chỉ hỗ trợ **OpenSearch** — Elasticsearch không còn được hỗ trợ:
- **OpenSearch (1.x, 2.x, 3.x):** Engine duy nhất được hỗ trợ từ 2.4.8
- **Elasticsearch:** Đã bị loại bỏ hoàn toàn từ 2.4.8

> **Lưu ý migration:** Nếu đang dùng Elasticsearch, phải migrate sang OpenSearch trước khi upgrade lên 2.4.8. Xem: `bin/magento elasticsearch:check-compatibility`

---

## 2. Cấu hình cơ bản

Để thiết lập Search Engine qua CLI, sử dụng lệnh sau:

```bash
bin/magento setup:config:set \
  --search-engine=opensearch \
  --opensearch-host=localhost \
  --opensearch-port=9200 \
  --opensearch-index-prefix=magento2 \
  --opensearch-timeout=15
```

Nếu dùng Auth (Bảo mật):
- `--opensearch-enable-auth=1`
- `--opensearch-username=admin`
- `--opensearch-password=password`

---

## 3. Tối ưu hóa tìm kiếm

### Stopwords (Từ dừng)
Loại bỏ các từ common (a, an, the, và, các...) để tăng độ chính xác.
- Tạo file: `app/code/Vendor/Module/etc/search_stopwords.xml`.
- Magento tự động gộp các file này để gửi tới Search Engine khi Reindex.

### Từ khóa đồng nghĩa (Synonyms)
Cấu hình trong Admin tại: `Marketing > SEO & Search > Search Synonyms`.
- Ví dụ: "Điện thoại" đồng nghĩa với "Smartphone".

---

## 4. Quản lý Index (CLI)

Sau khi thay đổi cấu hình hoặc dữ liệu sản phẩm lớn, cần reindex:
- `bin/magento indexer:reindex catalogsearch_fulltext`: Reindex toàn bộ tìm kiếm.
- `bin/magento indexer:status`: Kiểm tra trạng thái index.

---

## Liên kết
- Maintenance CLI: xem [maintenance-cli.md](./maintenance-cli.md)
- Multi-site (Index Prefix): xem [multi-site-management.md](./multi-site-management.md)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
