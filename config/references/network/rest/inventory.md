# REST Inventory Management (MSI)

Nguon chinh:

- [Inventory Management](https://developer.adobe.com/commerce/webapi/rest/inventory/)
- [Manage sources](https://developer.adobe.com/commerce/webapi/rest/inventory/manage-sources/)
- [Manage stocks](https://developer.adobe.com/commerce/webapi/rest/inventory/manage-stocks/)
- [Link and unlink stocks and sources](https://developer.adobe.com/commerce/webapi/rest/inventory/link-stocks-sources/)
- [Manage source items](https://developer.adobe.com/commerce/webapi/rest/inventory/manage-source-items/)
- [Inventory mass actions](https://developer.adobe.com/commerce/webapi/rest/inventory/bulk-inventory/)
- [Manage low-quantity notifications](https://developer.adobe.com/commerce/webapi/rest/inventory/manage-low-quantity/)
- [Check salable quantities](https://developer.adobe.com/commerce/webapi/rest/inventory/check-salable-quantity/)
- [Manage source selection algorithms](https://developer.adobe.com/commerce/webapi/rest/inventory/manage-source-selection/)
- [In-Store Pickup](https://developer.adobe.com/commerce/webapi/rest/inventory/in-store-pickup/)

---

## 1. Tong quan MSI

Inventory Management (MSI) tach ro 2 lop du lieu:

- `SourceItem` (write-side): cap nhat ton kho theo tung source.
- `StockItem` / salable view (read-side): ton kho kha dung theo sales channel.

Core concept:

- `Source`: dia diem vat ly (warehouse/store/drop-shipper).
- `Stock`: map sales channel (website) -> tap source.
- `Salable Quantity`: so luong ban duoc sau khi tinh aggregate + reservation + threshold.
- `Reservation`: giu ton trong checkout, clear khi shipment.

---

## 2. Manage sources

Service: `inventoryApiSourceRepositoryV1`

Endpoints:

- `POST /V1/inventory/sources`
- `GET /V1/inventory/sources/:sourceCode`
- `PUT /V1/inventory/sources/:sourceCode`
- `GET /V1/inventory/sources`

Notes:

- Default source khong duoc rename/delete/disable.
- Custom source co the enable/disable; disable se loai khoi shipment recommendation.
- In-Store Pickup them extension attributes cho source:
  - `is_pickup_location_active`
  - `frontend_name`
  - `frontend_description`

---

## 3. Manage stocks

Service: `inventoryApiStockRepositoryV1`

Endpoints:

- `POST /V1/inventory/stocks`
- `PUT /V1/inventory/stocks/:stockId`
- `GET /V1/inventory/stocks/:stockId`
- `DELETE /V1/inventory/stocks/:stockId`
- `GET /V1/inventory/stocks`

Notes:

- Default stock co `stock_id = 1`, khong delete duoc.
- Moi sales channel chi map duoc voi 1 stock tai mot thoi diem.
- Cap nhat stock co the overwrite toan bo danh sach sales channels.

---

## 4. Link stocks va sources

Services:

- `inventoryApiStockSourceLinksSaveV1`
- `inventoryApiStockSourceLinksDeleteV1`

Endpoints:

- `POST /V1/inventory/stock-source-links`
- `POST /V1/inventory/stock-source-links-delete`
- `GET /V1/inventory/stock-source-links`
- `GET /V1/inventory/get-sources-assigned-to-stock-ordered-by-priority/:stockId`

Notes:

- Link can `stock_id`, `source_code`, `priority`.
- Priority duoc SSA su dung khi chay algorithm `priority`.
- Xoa link khong tu dong reindex lai thu tu priority cua link con lai.

---

## 5. Manage source items

Services:

- `inventoryApiSourceItemsSaveV1`
- `inventoryApiSourceItemsDeleteV1`
- `inventoryApiSourceItemRepositoryV1`

Endpoints:

- `POST /V1/inventory/source-items`
- `POST /V1/inventory/source-items-delete`
- `GET /V1/inventory/source-items`

Model:

- `sku`
- `source_code`
- `quantity`
- `status` (`0` out of stock, `1` in stock)

Notes:

- Day la endpoint quan trong de cap nhat ton kho theo source (ERP/PIM sync).
- Unassign source item se xoa quantity data tai source do; can can nhac reservation/order dang mo.

---

## 6. Inventory mass actions

Services:

- `inventoryCatalogApiBulkInventoryTransferV1`
- `inventoryCatalogApiBulkPartialInventoryTransferV1`
- `inventoryCatalogApiBulkSourceAssignV1`
- `inventoryCatalogApiBulkSourceUnassignV1`

Endpoints:

- `POST /V1/inventory/bulk-product-source-transfer`
- `POST /V1/inventory/bulk-partial-source-transfer`
- `POST /V1/inventory/bulk-product-source-assign`
- `POST /V1/inventory/bulk-product-source-unassign`

Use cases:

- Transfer toan bo ton tu source A sang B.
- Transfer 1 phan qty cho danh sach SKU.
- Assign/unassign source cho nhieu SKU trong 1 call.

Risk note:

- Unassign source co the anh huong reservations va don hang chua hoan tat shipment.

---

## 7. Low-quantity notifications

Services:

- `inventoryLowQuantityNotificationApiSourceItemConfigurationsSaveV1`
- `inventoryLowQuantityNotificationApiGetSourceItemConfigurationV1`
- `inventoryLowQuantityNotificationApiDeleteSourceItemsConfigurationV1`

Endpoints:

- `POST /V1/inventory/low-quantity-notification`
- `GET /V1/inventory/low-quantity-notification/:sourceCode/:sku`
- `POST /V1/inventory/low-quantity-notifications-delete`

Scope:

- Quan ly nguong alert theo tung cap `source_code + sku`.
- Ghi de cac default threshold o level cao hon (neu duoc config).

---

## 8. Check salable quantities

Services:

- `inventorySalesApiGetProductSalabilityV1`
- `inventorySalesApiIsProductSalableV1`
- `inventorySalesApiAreProductsSalableV1`
- `inventorySalesApiIsProductSalableForRequestedQtyV1`
- `inventorySalesApiStockResolverV1`

Endpoints:

- `GET /V1/inventory/get-product-salable-quantity/:sku/:stockId`
- `GET /V1/inventory/is-product-salable/:sku/:stockId`
- `GET /V1/inventory/are-products-salable/:skus[]/:stockId`
- `GET /V1/inventory/is-product-salable-for-requested-qty/:sku/:stockId/:requestedQty`
- `GET /V1/inventory/stock-resolver/:type/:code`

Use cases:

- PDP/cart validation truoc add-to-cart.
- Batch check salability cho cart lines.
- Resolve stock theo website code truoc khi check salable qty.

---

## 9. Source Selection Algorithms (SSA)

Services chinh:

- `inventorySourceSelectionApiGetSourceSelectionAlgorithmListV1`
- `inventorySourceSelectionApiSourceSelectionServiceV1`

Endpoints:

- `GET /V1/inventory/source-selection-algorithm-list`
- `POST /V1/inventory/source-selection-algorithm-result`

Algorithms:

- `priority` (dua tren stock-source priority)
- `distance` (dua tren destination address + distance provider)

Distance helper endpoints:

- `GET /V1/inventory/get-distance-provider-code`
- `GET /V1/inventory/get-distance`
- `GET /V1/inventory/get-latlng-from-address`

---

## 10. In-Store Pickup

Services:

- `inventoryInStorePickupApiGetPickupLocationsV1`
- `inventoryInStorePickupSalesApiNotifyOrdersAreReadyForPickupV1`

Endpoints:

- `GET /V1/inventory/in-store-pickup/pickup-locations`
- `POST /V1/order/notify-orders-are-ready-for-pickup`

Notes:

- Pickup locations search dung `searchRequest[...]` (khac pattern `searchCriteria` thong thuong).
- `scopeCode` bat buoc.
- Endpoint notify can permission ACL phu hop.
- ACCS khong ho tro REST pickup-locations endpoint; Adobe huong dan dung GraphQL `pickupLocations`.

---

## 11. Trien khai goi y

1. Tao source(s) + stock(s).
2. Link stock-source voi priority.
3. Assign source items va quantity.
4. Dung salable quantity endpoints de validate storefront.
5. Chay SSA khi fulfill shipment.
6. Dung bulk APIs cho migration/warehouse rebalancing.
7. Bat low-quantity thresholds cho SKU critical.

---

## 12. Lien ket trong `.spec`

- REST Overview: [`./overview.md`](./overview.md)
- REST B2B: [`./b2b.md`](./b2b.md)
- Web API get-started: [`../web-api.md`](../web-api.md)
