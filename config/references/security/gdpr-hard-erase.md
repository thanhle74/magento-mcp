# Tham khảo: GDPR Hard Erase — DB + media cleanup, audit retention non-PII, idempotent deletion

Áp dụng cho mọi flow "xóa vĩnh viễn dữ liệu người dùng" (right to erasure / Art. 17): xóa entity
kèm file media, dọn PII qua nhiều module, nhưng vẫn giữ audit trail tối thiểu cho traceability.

Đây là **chiều ngược** của pattern [Transaction + Side-effect Cleanup](../core/transaction-side-effect-cleanup.md)
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
4. **Idempotent = hội tụ (converging), không chỉ no-op.** Phân biệt 2 trường hợp khi entity row
   đã không còn:
   - **Không có audit `hard_erase` marker** → entity chưa từng được erase ở đây (row bị xóa bởi
     con đường khác) → no-op im lặng, không exception, không audit trùng.
   - **Có audit `hard_erase` marker** (được ghi **cùng transaction** với DELETE ⟹ tồn tại của nó
     chứng minh DB erase đã commit) → lần gọi lại phải **chạy lại CHỈ phần post-commit** (dọn
     media partition + dispatch event) cho tới khi mọi thứ hội tụ: row + relations vắng, PII các
     module phụ đã purged, media partition vắng, vẫn đúng 1 audit row.
   Nếu chỉ "no-op khi row vắng" thì một lần filesystem cleanup fail ngay sau commit sẽ để media
   GDPR mồ côi **vĩnh viễn** (retry không bao giờ tới được code dọn file). Marker nên là cột
   numeric (`reference_id` kiểu FK id của entity module phụ) — không PII — để retry tái thông báo
   module phụ mà không cần entity row đã xóa. Không bao giờ restore entity row chỉ để retry cleanup.
5. **Audit retention tối thiểu — non-PII.** Sau erase phải còn trail chứng minh "đã xóa đúng
   yêu cầu": entity id + action + timestamp + actor dạng **actor-type/non-PII identifier**
   (`Customer:<id>`, `Admin: <username>`, `System: <context>`). KHÔNG bao giờ copy email/name/
   social/avatar vào deletion evidence — chính evidence sẽ trở thành chỗ tồn lưu PII.
6. **Mỗi module tự dọn PII table của nó — event ids-only + reconciliation addon-side.** Module
   Core xóa entity chính rồi dispatch event sau commit; module sở hữu bảng phụ (queue, submission,
   stats...) observe event tự DELETE rows của mình. Không cho module này truy cập trực tiếp bảng
   module kia. Hai bổ sung bắt buộc:
   - **Payload chỉ chứa primitive non-PII ids** (`entity_id`, FK id dạng int/null). Entity object
     đã xóa KHÔNG bao giờ đi qua event — nó mang nguyên PII của chủ sở hữu vào mọi observer
     (kể cả observer của module thứ ba tương lai).
   - **Observer purge là best-effort** (đúng nghĩa: lỗi chỉ log, không rollback được cái đã
     commit) ⟹ mô hình event-only MỘT MÌNH KHÔNG ĐỦ — một lần observer fail là PII tồn tại
     vĩnh viễn. Module sở hữu bảng phụ cần thêm **reconciliation job riêng** (cron, idempotent):
     LEFT JOIN từ bảng phụ sang bảng chính (chiều addon-đọc-core), row tồn tại mà entity chính
     không còn ⟺ orphan của failed purge (tiên đề: row phụ chỉ được tạo cùng entity chính trong
     1 transaction) → DELETE theo chunk bounded. Core vẫn không bao giờ query bảng phụ.
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
        // Row không còn: CHƯA đủ kết luận "đã erase xong" — tra audit marker
        // (nguyên tắc 4): có hard_erase ⟹ DB đã commit, chỉ còn thiếu post-commit.
        $this->retryPostCommitCleanup($entityId);
        return;
    }

    $relatedId = $entity->getData('related_id'); // FK sang bảng module khác (nếu có)
    $connection = $this->resourceConnection->getConnection();
    $connection->beginTransaction();

    try {
        // DELETE row chính — FK ON DELETE CASCADE dọn mọi bảng con cùng schema.
        $this->entityRepository->delete($entity);

        // Audit non-PII: id + action + actor identifier + timestamp, trong cùng transaction.
        // reference_id = FK id numeric của module phụ — RETRY MARKER: cùng transaction với
        // DELETE nên tồn tại của nó chứng minh erase đã commit; cho phép tái thông báo
        // module phụ khi entity row đã biến mất. Numeric id only, không PII.
        $audit = $this->auditFactory->create();
        $audit->setEntityId($entityId)
            ->setAction('hard_erase')
            ->setPerformedBy($performedBy)           // 'Customer:7' / 'Admin: x' / 'System: ctx'
            ->setReferenceId($relatedId)
            ->setDetails('Hard erase: row + relations deleted; media purged; PII erased.');
        $this->auditRepository->save($audit);

        $connection->commit();
    } catch (\Exception $exception) {
        $connection->rollBack();
        throw new LocalizedException(__('Could not confirm removal'), $exception);
    }

    $this->finishHardErase($entityId, $relatedId);
}

/**
 * Post-commit tail dùng chung cho first-erase và retry — payload event ids-only,
 * hai đường gọi ra cùng một hình dạng payload.
 */
private function finishHardErase(int $entityId, ?int $relatedId): void
{
    // ---- SAU commit: filesystem cleanup best-effort (không bao giờ trong transaction)
    $this->deleteMediaPartition($entityId);

    // ---- SAU commit: module khác tự dọn PII (boundary; payload PRIMITIVE IDS ONLY —
    // entity object đã xóa chứa PII không bao giờ đi qua event)
    $this->eventManager->dispatch('<module>_entity_hard_erased', [
        'entity_id'  => $entityId,
        'related_id' => $relatedId,
    ]);
}

/**
 * Row vắng: chỉ retry khi audit marker chứng minh erase đã commit ở đây.
 * Không marker → chưa từng erase → no-op im lặng (không audit trùng).
 */
private function retryPostCommitCleanup(int $entityId): void
{
    $row = $this->resourceConnection->getConnection()->fetchRow(
        $this->resourceConnection->getConnection()->select()
            ->from($this->resourceConnection->getTableName('<module>_audit'), ['reference_id'])
            ->where('entity_id = ?', $entityId)
            ->where('action = ?', 'hard_erase')
            ->limit(1)
    );
    if ($row === false) {
        return;
    }
    $this->finishHardErase(
        $entityId,
        isset($row['reference_id']) && $row['reference_id'] !== null ? (int) $row['reference_id'] : null
    );
}
```

Module sở hữu bảng PII observes cả 2 events và **bổ sung reconciliation cron riêng** (event-only
không đủ — observer fail một lần là PII tồn tại vĩnh viễn):

```php
// Cron của module phụ (addon-owned), ví dụ chạy mỗi 6 giờ
$connection = $this->resourceConnection->getConnection();
$select = $connection->select()
    ->from(['s' => $this->resourceConnection->getTableName('<module>_submission')], ['s.submission_id'])
    ->joinLeft(
        ['e' => $this->resourceConnection->getTableName('<core_module>_entity')],
        'e.related_id = s.submission_id',   // chiều addon đọc core
        []
    )
    ->where('e.entity_id IS NULL');          // orphan ⟺ failed purge (tiên đề tạo-cùng-transaction)

foreach (array_chunk(array_map('intval', $connection->fetchCol($select)), 500) as $chunk) {
    try {
        $connection->delete($tableName, ['submission_id IN (?)' => $chunk]);
    } catch (\Exception $e) {
        $this->logger->error('... failed: {message}', ['chunk_size' => count($chunk), 'message' => $e->getMessage()]);
    }
}
```

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
và `customer_delete_after`) — DELETE rows của mình trong try/catch, lỗi chỉ log; reconciliation
cron phía trên là đường hộ tụ thứ hai khi observer đó fail.

---

## 3. Contract kiểm thử (cả 2 nhánh mỗi điều kiện)

| Nhóm | Test bắt buộc |
|---|---|
| Request lifecycle | request → status transition + audit non-PII; request lần 2 (đã request) = no-op |
| Hard erase | DELETE row + CASCADE relations được gọi; audit `hard_erase` (kèm `reference_id`) trong transaction; event dispatch SAU commit với đủ payload |
| Media | partition đúng path bị xóa sau commit; dir không tồn tại → skip im lặng; fs throw → KHÔNG throw ra ngoài, log KHÔNG chứa PII |
| Idempotency / retry | erase entity đã xóa + **KHÔNG có audit marker** = no-op, không audit trùng; call 1 DB erase commit nhưng media delete throw → call 2 (row đã vắng, marker có) gọi lại media cleanup thành công + tái dispatch event, vẫn đúng 1 audit row, đúng 1 DELETE |
| Event payload | payload chỉ primitive ids (int/null) — KHÔNG có entity object, KHÔNG PII (assert từng value) |
| Addon reconciliation | cron xóa orphan rows (LEFT JOIN, entity chính vắng); row còn link được GIỮ NGUYÊN; chunk bounded; lỗi 1 chunk không chặn các chunk sau; rỗng → không delete |
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
  reviewer nhìn đầu tiên. Cột `reference_id` (int unsigned NULL) — comment ghi rõ "numeric id
  only, never PII" + vai trò retry marker.
- Consent columns: nullable + default FALSE cho boolean; version varchar tham chiếu config path
  (có fallback code), không hard-code phiên bản vào nhiều bảng một cách ngầm hiểu.
- Migration trên data sẵn có: KHÔNG backfill evidence giả (timestamps NULL = "không biết",
  đúng sự thật hơn là bịa `accepted_at`).

---

## Liên kết

- [Transaction + Side-effect Cleanup](../core/transaction-side-effect-cleanup.md) — chiều ghi
  (file tạo trong transaction, dọn khi rollback): cùng bài toán "DB không rollback được file",
  đặt hàng thao tác ngược nhau.
- [Declarative Schema](../core/declarative-schema.md) — FK CASCADE + schema ownership giữa module.
- [Observer (Event)](../core/event-observer-patterns.md) — dispatch sau commit, module boundary qua event.
