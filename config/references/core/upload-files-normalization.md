# Tham khảo: Chuẩn hóa $_FILES multi-file upload (Uploaded Files Normalization)

Nguồn: PHP manual — POST method uploads; thực chiến Magento 2.4.8 (PHP 8.3).

---

## 1. Vấn đề: 2 hình dạng của `$_FILES`

Form multi-file `<input name="images[]" multiple>` (hoặc nhiều input cùng tên `images[]`) sinh ra
hình dạng **transposed** — mảng theo FIELD, không theo FILE:

```php
// Transposed (PHP tự sinh cho name="images[]")
[
    'name'     => ['a.jpg', 'b.jpg'],
    'type'     => ['image/jpeg', 'image/jpeg'],
    'tmp_name' => ['/tmp/phpA', '/tmp/phpB'],
    'error'    => [0, 0],
    'size'     => [1024, 2048],
]
```

Trong khi consumer (Uploader `['fileId' => $fileData]`, vòng lặp validate từng file) cần
**per-file descriptor list**:

```php
[
    ['name' => 'a.jpg', 'type' => 'image/jpeg', 'tmp_name' => '/tmp/phpA', 'error' => 0, 'size' => 1024],
    ['name' => 'b.jpg', 'type' => 'image/jpeg', 'tmp_name' => '/tmp/phpB', 'error' => 0, 'size' => 2048],
]
```

**Lỗi điển hình khi không normalize:** lặp `foreach ($files as $file)` nhận `'a.jpg'` (string) thay vì
descriptor → mọi upload "thành công 0 file" hoặc validate rác; lỗi chỉ lộ ở runtime với form thật,
unit test mock đúng shape sẽ không bắt được.

---

## 2. Pattern: Service normalizer dùng chung

Tạo 1 service stateless duy nhất, inject vào mọi controller/action nhận upload multi-file
(không viết private method từng controller — dễ lệch shape giữa admin/customer path):

```php
declare(strict_types=1);

namespace Vendor\Module\Service;

class UploadedFilesNormalizer
{
    private const FILE_KEYS = ['name', 'type', 'tmp_name', 'error', 'size'];

    /**
     * @param array<int|string, mixed> $raw Raw value of RequestInterface::getFiles(<field>)
     * @return array<int, array<string, mixed>> Per-file descriptors
     */
    public function normalize(array $raw): array
    {
        // Already a per-file list -> pass through
        if (isset($raw[0]) && is_array($raw[0])) {
            return array_values($raw);
        }
        // Not a $_FILES structure at all
        if (!array_intersect(self::FILE_KEYS, array_keys($raw))) {
            return [];
        }
        // Transposed -> pivot. Non-array keys (single-file scalar shape) yield 0 files
        $count = isset($raw['name']) && is_array($raw['name']) ? count($raw['name']) : 0;
        $normalized = [];
        for ($i = 0; $i < $count; $i++) {
            $entry = [];
            foreach (self::FILE_KEYS as $key) {
                $entry[$key] = $raw[$key][$i] ?? null; // missing key degrades to null, no notice
            }
            $normalized[] = $entry;
        }
        return $normalized;
    }
}
```

Controller:

```php
$files = $this->filesNormalizer->normalize((array) $this->request->getFiles('images'));
$this->uploadService->process($postData, $files);
```

---

## 3. Quy tắc

- **Consumer luôn nhận per-file list** — mọi vòng lặp/validate chỉ biết một shape. Transposed shape
  bị từ chối ở biên giới (normalizer), không len lỏi vào business logic.
- Mỗi descriptor phải chịu được key thiếu (`?? null`) — browser/PHP không guarantee đủ 5 key.
- Buộc validate `error === UPLOAD_ERR_OK` + `tmp_name` non-empty ở consumer trước khi đụng file.
- **Test:** unit test normalizer với (a) transposed, (b) đã normalize, (c) rỗng, (d) payload không
  phải file, (e) thiếu key; cộng integration/smoke với form thật + `curl -F "images[]=@f1" -F "images[]=@f2"`
  vì mock không phát hiện shape lệch (bài học thực chiến: unit test pass nhưng runtime BLOCKER).

---

## Liên kết

- Transaction + dọn file khi fail: [transaction-side-effect-cleanup.md](./transaction-side-effect-cleanup.md)
- Quy tắc chung: [../../constitution.md](../../constitution.md)
