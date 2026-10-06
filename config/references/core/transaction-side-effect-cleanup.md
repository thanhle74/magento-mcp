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

## 5. Side-effect HTTP gateway bên trong TX — connection độc lập cho evidence

`CreditmemoService::refund()` mở DB transaction trên connection `sales` và chạy gateway refund
command **bên trong nó** — mọi ghi cùng connection sẽ bị rollback nuốt mất đúng lúc cần
evidence nhất (refund FAILED/UNKNOWN biến mất khi reconciliation). Pattern:

- Ghi refund record/evidence qua **connection DB độc lập** (PDO adapter tự build qua
  `ConnectionFactory`, xử lý table prefix thủ công) — sống sót qua sales-TX rollback.
- Backfill linkage (`creditmemo_id`) bằng plugin sau khi TX commit (entity id chưa assign khi
  gateway command return).

Chi tiết đầy đủ: [../security/payment-gateway.md](../security/payment-gateway.md) §21.

---

## 6. Finalization = một flattened TX, không HTTP trong transaction

Magento transaction lồng nhau chỉ là **transaction levels** (không có savepoints thật) —
không coi nesting là rollback một phần. Finalization payment phải là MỘT flattened TX với
thứ tự cố định:

```
attempt-row SELECT ... FOR UPDATE → placeOrder → markFinalized → capture (NullCommand)
```

- Capture trong TX là `NullCommand` (không HTTP) — HTTP call trong TX giữ lock + treo
  connection; order được xác thực tiền TRƯỚC khi vào TX.
- Idempotency "exactly one order" đến từ **row-lock + UNIQUE constraint** (`order_ref`/
  `request_id`/`order_id`) + single-use grant — KHÔNG từ check-then-insert (race giữa 2 node).

---

## 7. Anti-pattern: shared collection + double-open record

1. Repository **không inject shared Collection instance** (state dùng chung giữa các request
   gây kết quả nhiễm bẩn) — inject `CollectionFactory`.
2. Guard "chỉ 1 record mở cùng lúc" (vd 1 refund đang chạy cho 1 payment): **NULL-trick
   UNIQUE** — cột `open_flag` default giá trị, set NULL khi đóng; `UNIQUE(open_flag)` cho phép
   vô số row đã đóng nhưng chặn row thứ 2 còn mở.

---

## 8. CAS trạng thái DB — WHERE phải kèm state của snapshot

Conditional UPDATE kiểu `terminate()` chỉ với `WHERE entity_id = ? AND active_claim = 1` cho
phép **cron giữ snapshot stale** ghi đè trạng thái mới hơn: cron thấy `initiating`, owner đã
chuyển `provider_request_started`, UPDATE vẫn thành công → `confirmed_fail` + nhả claim trong
khi provider có thể vẫn hoàn tiền thật.

- WHERE bắt buộc kèm `state = <state caller nhìn thấy>` — biến UPDATE thành conditional state
  transition thật: `affected = 0` → log/skip, **không nhả claim, không reload-retry** (owner
  mới đã thắng, reload lại là lặp lại đúng race vừa thua).
- Bằng chứng incident: test `STALE_INITIATING_CANNOT_KILL_PROVIDER_STARTED` — provider refund
  tiền thật trong khi DB ghi `confirmed_fail`.

---

## Liên kết

- Chuẩn hóa `$_FILES` trước khi vào service: [upload-files-normalization.md](./upload-files-normalization.md)
- Gateway refund trong TX của `CreditmemoService`: [../security/payment-gateway.md](../security/payment-gateway.md) §21, §25
- Payment-first finalizer + recovery claim: [../business/payment-first-checkout.md](../business/payment-first-checkout.md)
- Quy tắc chung: [../../constitution.md](../../constitution.md)
