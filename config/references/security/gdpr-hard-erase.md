# Tham khảo: GDPR Hard Erase — DB + media cleanup, audit retention non-PII, idempotent deletion

Áp dụng cho mọi flow "xóa vĩnh viễn dữ liệu người dùng" (right to erasure / Art. 17): xóa entity
kèm file media, dọn PII qua nhiều module, nhưng vẫn giữ audit trail tối thiểu cho traceability.

Đây là **chiều ngược** của pattern [Transaction + Side-effect Cleanup](./core/transaction-side-effect-cleanup.md)
(write: file tạo trong transaction, dọn khi rollback) — erase: DB commit trước, file dọn sau.

---

## 1. Nguyên tắc

1. **Hard erase nghĩa là xóa thật** — DELETE row (không status flag "deleted" giả tên xóa),
   file media xóa khỏi filesystem. Không âm thầm để lại file/PII "phòng khi cần". Nếu business
   cần soft-delete (moderation trash, restorable) thì đó là flow KHÁC, đặt tên khác (`moveToTrash`)
   và không trộn lẫn với erasure.
2. **Đặt hàng DB-then-filesystem.** Transaction không rollback được file đã xóa:
   - Xóa file trước mà DB commit fail → entity render gãy + PII row vẫn còn (tệ nhất).
   - DB commit trước, dọn file sau → nếu dọn file fail chỉ còn **file mồ côi** (không còn row nào
     tham chiếu) — vô hại với user, retry được.
   Vì vậy: commit erase DB trước, cleanup filesystem best-effort sau commit.
3. **Media partition theo entity id** là tiền đề để xóa sạch + idempotent: mọi file của entity
   sống dưới 1 thư mục `media/<module>/<entity_type>/{id}/` → cleanup = xóa cả thư mục
   (dir không tồn tại = no-op thành công, đồng thời dọn cả file mồ côi của lần erase fail trước).
   KHÔNG rải file của 1 entity qua nhiều thư mục nếu muốn xóa sạch được.
4. **Idempotent toàn phần.** Erase lần 2 (entity không còn) = no-op im lặng, không exception,
   không audit trùng. Caller (admin bấm 2 lần, retry job, observer account-deletion) không cần
   biết lần trước thành công chưa.
5. **Audit retention tối thiểu — non-PII.** Sau erase phải còn trail chứng minh "đã xóa đúng
   yêu cầu": entity id + action + timestamp + actor dạng **actor-type/non-PII identifier**
   (`Customer:<id>`, `Admin: <username>`, `System: <context>`). KHÔNG bao giờ copy email/name/
   social/avatar vào deletion evidence — chính evidence sẽ trở thành chỗ tồn lưu PII.
6. **Mỗi module tự dọn PII table của nó.** Module Core xóa entity chính rồi dispatch event
   (payload kèm FK id) sau commit; module sở hữu bảng phụ (queue, submission, stats...) observe
   event tự DELETE rows của mình. Không cho module này truy cập trực tiếp bảng module kia.
7. **Consent evidence là triple, không phải boolean.** Nếu module lưu consent: cần
   `consent_accepted_at` + `consent_policy_version` + `consent_source` (form/context nào);
   default FALSE — không bao giờ default-true cho UGC. Nội dung từ nguồn nội bộ tin cậy (admin
   tạo theo hợp đồng nội bộ) dùng marker riêng (`consent_source = 'admin_trusted'`, flag FALSE)
   thay vì fabricate acceptance. IP chỉ lưu ở nơi privacy model của hệ thống đã justify
   (anti-abuse), không duplicate.

---

## 2. Khung chuẩn

```php
public function confirmRemoval(int $entityId, string $performedBy): void
{
    try {
        $entity = $this->entityRepository->getById($entityId);
    } catch (NoSuchEntityException $e) {
        return; // idempotent: erased lần trước → no-op im lặng
    }

    $relatedId = $entity->getData('related_id'); // FK sang bảng module khác (nếu có)
    $connection = $this->resourceConnection->getConnection();
    $connection->beginTransaction();

    try {
        // DELETE row chính — FK ON DELETE CASCADE dọn mọi bảng con cùng schema.
        $this->entityRepository->delete($entity);

        // Audit non-PII: id + action + actor identifier + timestamp, trong cùng transaction.
        $audit = $this->auditFactory->create();
        $audit->setEntityId($entityId)
            ->setAction('hard_erase')
            ->setPerformedBy($performedBy)           // 'Customer:7' / 'Admin: x' / 'System: ctx'
            ->setDetails('Hard erase: row + relations deleted; media purged; PII erased.');
        $this->auditRepository->save($audit);

        $connection->commit();
    } catch (\Exception $exception) {
        $connection->rollBack();
        throw new LocalizedException(__('Could not confirm removal'), $exception);
    }

    // ---- SAU commit: filesystem cleanup best-effort (không bao giờ trong transaction)
    $this->deleteMediaPartition($entityId);

    // ---- SAU commit: cho module khác tự dọn PII của chúng (boundary invariant)
    $this->eventManager->dispatch('<module>_entity_hard_erased', [
        'entity_id'  => $entityId,
        'related_id' => $relatedId,
    ]);
}

/**
 * Partition-dir delete = idempotent (dir gone = no-op) và dọn luôn file mồ côi
 * của những lần erase fail trước. Lỗi chỉ log — không rethrow, không phơi PII.
 */
private function deleteMediaPartition(int $entityId): void
{
    try {
        $media = $this->filesystem->getDirectoryWrite(DirectoryList::MEDIA);
        $partition = self::MEDIA_BASE_DIR . '/' . $entityId;
        if ($media->isExist($partition)) {
            $media->delete($partition);
        }
    } catch (\Exception $e) {
        $this->logger->error(
            'Media cleanup failed after hard erase (orphaned files may remain for the next retry): {message}',
            ['entity_id' => $entityId, 'message' => $e->getMessage()]
        );
    }
}
```

Xóa tài khoản người dùng (`customer_delete_after`): **tái dùng đúng service trên** cho từng
entity của khách (actor `System: customer_delete`), per-entity continue-on-failure (1 entity
fail không hủy account deletion, log và đi tiếp) — không viết SQL UPDATE riêng,

```php
// Observer customer_delete_after
$collection = $this->collectionFactory->create()
    ->addFieldToFilter('customer_id', $customer->getId());
foreach ($collection as $entity) {
    try {
        $this->removalService->confirmRemoval(
            (int) $entity->getEntityId(),
            RemovalService::ACTOR_SYSTEM_CUSTOMER_DELETE
        );
    } catch (\Exception $e) {
        $this->logger->error(...); // continue với entity kế tiếp
    }
}
```

Module sở hữu bảng PII riêng observes cả 2 events (`<module>_entity_hard_erased` với related_id
và `customer_delete_after`) — DELETE rows của mình trong try/catch, lỗi chỉ log.

---

## 3. Contract kiểm thử (cả 2 nhánh mỗi điều kiện)

| Nhóm | Test bắt buộc |
|---|---|
| Request lifecycle | request → status transition + audit non-PII; request lần 2 (đã request) = no-op |
| Hard erase | DELETE row + CASCADE relations được gọi; audit `hard_erase` trong transaction; event dispatch SAU commit với đủ payload |
| Media | partition đúng path bị xóa sau commit; dir không tồn tại → skip im lặng; fs throw → KHÔNG throw ra ngoài, log KHÔNG chứa PII |
| Idempotency | erase entity đã xóa = no-op, không audit trùng |
| Rollback | repository delete throw → rollBack + KHÔNG đụng filesystem + KHÔNG dispatch |
| Audit non-PII | helper assert mọi `details`/`performed_by` không chứa email/domain/ tên thật của khách |
| Account deletion | observer gọi service (không raw UPDATE) với actor hệ thống; 1 entity fail → entity kế vẫn được xóa |
| Consent | thiếu consent tường minh → reject trước khi mở transaction; evidence triple persist đủ; nguồn tin cậy → flag FALSE + marker, KHÔNG bao giờ acceptance default-true |

Lưu ý mock (PHPUnit 10): interface data object không có magic accessor (`getData`) — mock
concrete model; event/observer dùng giá trị thật (`new Observer(['event' => new Event([...])])`)
vì magic `getX()` không cấu hình được trên mock.

---

## 4. Triển khai khai báo (declarative schema)

- Audit table: `performed_by` comment ghi rõ actor contract ngay trong DDL — schema là chỗ
  reviewer nhìn đầu tiên.
- Consent columns: nullable + default FALSE cho boolean; version varchar tham chiếu config path
  (có fallback code), không hard-code phiên bản vào nhiều bảng một cách ngầm hiểu.
- Migration trên data sẵn có: KHÔNG backfill evidence giả (timestamps NULL = "không biết",
  đúng sự thật hơn là bịa `accepted_at`).

---

## Liên kết

- [Transaction + Side-effect Cleanup](./core/transaction-side-effect-cleanup.md) — chiều ghi
  (file tạo trong transaction, dọn khi rollback): cùng bài toán "DB không rollback được file",
  đặt hàng thao tác ngược nhau.
- [Declarative Schema](./core/declarative-schema.md) — FK CASCADE + schema ownership giữa module.
- [Observer (Event)](./core/events-observers.md) — dispatch sau commit, module boundary qua event.
