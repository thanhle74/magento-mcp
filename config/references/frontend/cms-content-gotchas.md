# Tham khảo: CMS Content Gotchas (WYSIWYG, directive, PCRE)

> Từ khóa tra cứu: cms content rỗng, WYSIWYG html_entity_decode, directive {{media url=}} không parse, &quot; trong DB, preg_replace NULL backtrack, SeoAutolink, FilterProvider filter, template filter block.

---

## 1. Directive `{{media url=...}}` không parse — entity `&quot;` trong DB

Nội dung WYSIWYG lưu trong DB thường mang dấu nháy dạng HTML entity:
`{{media url=&quot;wysiwyg/banner.jpg&quot;}}`. Khi lấy bằng `getData()` (raw value) rồi
đưa thẳng qua filter, regex của
`Magento\Cms\Model\TemplateFilter` (`FilterProvider::getPageFilter()->filter()`) chỉ match
dấu `"` thật → directive **không được thay thế**, chuỗi `{{media ...}}` in nguyên văn ra FE.

**Fix:** decode trước khi filter:

```php
$html = $this->filterProvider->getPageFilter()->filter(
    html_entity_decode($content, ENT_QUOTES, 'UTF-8')
);
```

### Ràng buộc discipline khi hotfix

- Hotfix prod hay dùng `ObjectManager` inline trong Block để tránh chạy
  `setup:di:compile` (thêm constructor arg đòi compile lại interceptor) — chấp nhận được
  lúc nóng, nhưng **bản commit lên git PHẢI là constructor injection**.
- Đổi constructor của block nào đó → lần deploy kế tiếp bắt buộc chạy
  `setup:di:compile`, không chỉ flush cache.

---

## 2. Content biến mất âm thầm — PCRE backtrack (tóm tắt)

Content lớn (tens of KB) render **rỗng hoàn toàn**, không 500, không exception — thủ phạm
kinh điển: plugin third-party chạy `preg_replace_callback`/`preg_replace` với pattern
quá rộng (vd `#<a(.+)((\s)+(.+))+\/a>#iU` khớp cả `<article`) → **backtrack limit nổ** →
hàm preg trả **NULL** → content rỗng im lặng.

Diagnostic: check `preg_last_error()` (`PREG_BACKTRACK_LIMIT_ERROR`) ngay sau hàm preg;
fix: thu hẹp pattern (`<a\s`, giảm nested group) hoặc bọc content bằng tag khác.

Case đầy đủ (SeoAutolink + PageBuilder): xem
[../core/debugging-troubleshooting.md](../core/debugging-troubleshooting.md) §15.

---

## Liên kết

- PCRE backtrack chi tiết: xem [../core/debugging-troubleshooting.md](../core/debugging-troubleshooting.md)
- PageBuilder content type: xem [pagebuilder-content-type.md](./pagebuilder-content-type.md)
