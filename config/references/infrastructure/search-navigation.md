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

---

## 5. ElasticSuite (Smile) gotchas — verify từ session thực tế

### `addFieldToFilter` bị keyed overwrite

Trên Smile fulltext collection, gọi `addFieldToFilter` 2 lần **cùng 1 field** là overwrite theo key — filter thứ hai XÓA filter đầu, không phải AND:

```php
$collection->addFieldToFilter('color', 'red');
$collection->addFieldToFilter('color', 'blue'); // mất filter 'red' — chỉ còn 'blue'
```

Cần nhiều giá trị cùng field: gộp vào 1 lần gọi với array (điều kiện IN). Với **khoảng giá**
cùng field thì gộp thành 1 Range condition thay vì 2 lần gọi — 2 lần gọi `price` riêng
(`gteq` rồi `lteq`) làm **mất bound đầu tiên**:

```php
// ✅ 1 lần gọi, 1 condition range
$collection->addFieldToFilter('price', ['gteq' => $min, 'lteq' => $max]);
```

### Sort theo price — bắt buộc `addPriceData` trước

```php
$collection->addPriceData(
    \Magento\Customer\Model\Group::NOT_LOGGED_IN_ID,
    (int) $store->getWebsiteId()
);
$collection->setOrder('min_price', 'asc');
```

- Sort key là `min_price` của **catalog price INDEX** (theo customer group truyền vào — guest khi dùng `NOT_LOGGED_IN_ID`), có thể **khác giá attribute hiển thị** (special price/tier price chưa reindex, hoặc nhóm khác).
- `prepareSortOrders` bare-reads `_productLimitationFilters['customer_group_id']` **không có fallback** — thiếu `addPriceData` trước đó thì sort price sinh PHP notice/undefined index thay vì lỗi rõ ràng.

### `addCategoriesFilter` bị silently ignore

`addCategoriesFilter` là SQL-oriented (join category bảng phẳng) và **bị bỏ qua im lặng** trên Smile fulltext collection — filter category không xuất hiện trong query, không có lỗi. Fix bằng API catalog chuẩn:

```php
$category = $this->categoryRepository->get($categoryId, $storeId);
$collection->addCategoryFilter($category);
```

Lưu ý: `CategoryRepositoryInterface::get()` với id không tồn tại ném `NoSuchEntityException`
— **không** phải `LocalizedException` con ở mọi version, catch đúng type trước khi tin rằng
"invalid id đã được xử lý".

### Page > last page → collection tự reset về page 1

Request `page=99` khi chỉ có 3 page: Smile **reset collection window về page 1** và trả items của page 1 (HTTP 200, có data) — khác contract "200 + `items: []`" mà nhiều API client kỳ vọng. Muốn giữ contract rỗng thì phải tự guard số page trước khi set:

```php
$lastPage = (int) ceil($collection->getSize() / $pageSize);
if ($page > 1 && $page > $lastPage) {
    return []; // tự trả rỗng, đừng để Smile reset window
}
```

### Name sort gộp tên giống nhau — ICU primary collation

Sort theo name dùng **ICU primary collation** (bỏ qua dấu/ký tự phụ) nên các tên chỉ khác dấu/ký tự nhẹ có thể đứng cạnh theo trật tự "gộp nhóm" khó hiểu. Đây là **verification artifact của collation, không phải bug** — không "sửa" bằng cách đổi comparator, chỉ cần ghi chú trong kết quả test.

---

## Liên kết
- Maintenance CLI: xem [maintenance-cli.md](../ops/maintenance-cli.md)
- Multi-site (Index Prefix): xem [multi-site-management.md](../ops/multi-site-management.md)
- Quy tắc chung: xem [../constitution.md](../../constitution.md)
