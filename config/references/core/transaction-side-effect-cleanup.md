# Tham khảo: DB Transaction + dọn side-effect ngoài DB (media/filesystem)

Áp dụng cho mọi flow "ghi DB + tạo file/external resource" (upload ảnh, export, tích hợp ngoài).

---

## 1. Nguyên tắc

1. **Transaction chỉ bảo vệ DB.** File media, call API, message queue... KHÔNG rollback được.
   Mọi side-effect ngoài DB phát sinh **trong khi transaction đang mở** phải được track để dọn tay
   khi rollback.
2. **Track-while-you-go:** mỗi lần tạo 1 resource ngoài DB, append path/identifier vào mảng
   `$createdFiles` (pass-by-reference hoặc trả về) — không "đoán lại sau" bằng scan thư mục.
3. **Đặt hàng stmt hợp lệ:** INSERT row cha trước khi viết file vào partition của nó (cần id);
   row có cột NOT NULL tổng hợp (vd json paths) phải INSERT **sau** khi paths thật đã biết —
   tuyệt đối không weaken constraint (bỏ NOT NULL) chỉ để flow chạy qua.
4. **Raw upload là dữ liệu nhạy cảm** (EXIF/GPS) — sau khi sinh bản re-encode, xóa file raw tmp
   ngay; vẫn phải track trong `$createdFiles` cho đến lúc xóa xong (trường hợp step sau fail).

---

## 2. Khung chuẩn

```php
public function submit(array $postData, array $files): void
{
    // ... validate business (consent, ownership...) TRƯỚC khi mở transaction

    $connection = $this->resourceConnection->getConnection();
    $connection->beginTransaction();
    $createdFiles = []; // media-relative paths created inside the transaction

    try {
        $entity = $this->entityFactory->create();
        $entity->setData([...]);
        $this->entityRepository->save($entity);          // parent row first (need its ID)
        $id = (int) $entity->getId();

        $paths = $this->processUploads($files, $id, $createdFiles); // track every created file
        $this->persistChildren($id, $paths);

        // Aggregates (json of paths) written LAST — NOT NULL column always satisfied
        $record = $this->recordFactory->create();
        $record->setData(['paths_json' => $this->json->serialize($paths), ...]);
        $this->recordRepository->save($record);

        $connection->commit();
    } catch (\Exception $exception) {
        $connection->rollBack();
        $this->deleteCreatedFiles($createdFiles);        // best-effort, never rethrow from cleanup
        throw $exception;                                // rethrow nguyên bản cho tầng trên hiển thị
    }
}

/**
 * Best-effort cleanup — một file fail không chặn các file còn lại.
 */
private function deleteCreatedFiles(array $createdFiles): void
{
    if ($createdFiles === []) {
        return;
    }
    $media = $this->filesystem->getDirectoryWrite(DirectoryList::MEDIA);
    foreach (array_unique($createdFiles) as $relativePath) {
        try {
            $media->delete($relativePath);
        } catch (\Exception $e) {
            continue; // DB đã rollback; file mồ côi chấp nhận được — log nếu cần
        }
    }
}
```

---

## 3. Exception contract dọc theo call chain

- Service sâu (image processor, adapter) nên ném **`LocalizedException`** cho input xấu —
  framework adapter (vd `Gd2::open()`) ném `\Exception` thuần cho file không decode được;
  nếu để tuột lên controller (chỉ catch `LocalizedException`) khách nhận **500** thay vì message.
  Wrap tại biên giới của service mình.
- Controller: catch `LocalizedException` → message thân thiện; **không** catch `\Exception` rộng
  rồi im lặng.

---

## 4. Test chuẩn (TDD cả 2 nhánh)

1. **Happy path:** assert đúng THỨ TỰ — beginTransaction → từng save (row tổng hợp có đủ dữ liệu
   trước save duy nhất) → commit; file raw tmp bị delete sau khi renditions tồn tại.
2. **Failure/rollback:** dependency giữa chừng throw → assert `rollBack` + mỗi path đã track
   bị delete + **rethrow** + không có row tổng hợp nào được save.
3. **Smoke thật:** POST form với file hợp lệ (đủ rows + files trên disk), file sai loại /
   file rác giả danh đúng extension → không partial state (đếm rows trước/sau + scan thư mục).

---

## Liên kết

- Chuẩn hóa `$_FILES` trước khi vào service: [upload-files-normalization.md](./upload-files-normalization.md)
- Quy tắc chung: [../../constitution.md](../../constitution.md)
