# Tham khảo: Payment Gateway (Tích hợp thanh toán)

Nguồn: https://developer.adobe.com/commerce/php/development/payments-integrations/payment-gateway/

---

> Từ khóa tra cứu: payment gateway, redirect payment, return URL, callback, webhook, idempotent, signature verify, cron expiry, refund poll, m_refund_id, return_code sub_return_code, STATE_OPEN, validateForRefund.

## 0. Khởi tạo Module (module.xml)

Module thanh toán bắt buộc phải khai báo phụ thuộc (`sequence`) để đảm bảo hệ thống load đúng thứ tự.

```xml
<module name="Vendor_MyPayment" setup_version="1.0.0">
    <sequence>
        <module name="Magento_Sales"/>
        <module name="Magento_Payment"/>
        <module name="Magento_Checkout"/>
    </sequence>
</module>
```

---

## 1. Cấu trúc Facade & Command Pool (di.xml)

Mọi phương thức thanh toán hiện đại đều sử dụng Class Facade (`Magento\Payment\Model\Method\Adapter`) làm giao diện chính.

### 1a. Khai báo Facade (Method Adapter)
```xml
<virtualType name="MyPaymentFacade" type="Magento\Payment\Model\Method\Adapter">
    <arguments>
        <argument name="code" xsi:type="string">my_payment_code</argument>
        <argument name="formBlockType" xsi:type="string">Magento\Payment\Block\Form</argument>
        <argument name="infoBlockType" xsi:type="string">Vendor\Module\Block\Info</argument>
        <argument name="valueHandlerPool" xsi:type="object">MyPaymentValueHandlerPool</argument>
        <argument name="commandPool" xsi:type="object">MyPaymentCommandPool</argument>
        <argument name="validatorPool" xsi:type="object">MyPaymentValidatorPool</argument>
    </arguments>
</virtualType>
```

### 1b. Value Handler Pool (Xử lý logic cấu hình)
Dùng để ghi đè các tham số trong `config.xml` bằng logic PHP (ví dụ: `can_void` tùy theo trạng thái giao dịch).
```xml
<virtualType name="MyPaymentValueHandlerPool" type="Magento\Payment\Gateway\Config\ValueHandlerPool">
    <arguments>
        <argument name="handlers" xsi:type="array">
            <item name="default" xsi:type="string">MyPaymentConfigValueHandler</item>
            <item name="can_void" xsi:type="string">Vendor\Module\Gateway\Config\CanVoidHandler</item>
        </argument>
    </arguments>
</virtualType>
```

### 1c. Validator Pool (Kiểm tra điều kiện)
Dùng để kiểm tra Country, Currency, hoặc rủi ro trước khi đặt hàng.
```xml
<virtualType name="MyPaymentValidatorPool" type="Magento\Payment\Gateway\Validator\ValidatorPool">
    <arguments>
        <argument name="validators" xsi:type="array">
            <item name="country" xsi:type="string">Vendor\Module\Gateway\Validator\CountryValidator</item>
        </argument>
    </arguments>
</virtualType>
```

### 1d. Khai báo Command Pool
Ánh xạ các hành động của Đơn hàng vào các class xử lý tương ứng.
```xml
<virtualType name="MyPaymentCommandPool" type="Magento\Payment\Gateway\Command\CommandPool">
    <arguments>
        <argument name="commands" xsi:type="array">
            <item name="authorize" xsi:type="string">MyPaymentAuthorizeCommand</item>
            <item name="capture" xsi:type="string">MyPaymentCaptureCommand</item>
            <item name="void" xsi:type="string">MyPaymentVoidCommand</item>
            <item name="refund" xsi:type="string">MyPaymentRefundCommand</item>
        </argument>
    </arguments>
</virtualType>
```

---

## 2. Chi tiết một Gateway Command

Mỗi lệnh thường là một `virtualType` của `Magento\Payment\Gateway\Command\GatewayCommand` với các tham số sau:

| Tham số | Vai trò |
|---------|---------|
| **RequestBuilder** | Chuyển dữ liệu Order/Payment thành mảng (Array) cho API. |
| **TransferFactory**| Tạo đối tượng request HTTP (URL, Method, Headers). |
| **Client** | Thực hiện gọi API (Sử dụng Curl hoặc SDK). |
| **Validator** | Kiểm tra mã lỗi trả về từ API để quyết định thành công/thất bại. |
| **Handler** | Lưu thông tin giao dịch (Transaction ID) vào Payment object. |

---

## 3. Request Builder (Dữ liệu gửi đi)

Build từ `PaymentDataObject`. Tránh sử dụng trực tiếp Model Order để đảm bảo tính Stateless.

### 3a. Builder đơn lẻ
Class thực thi `Magento\Payment\Gateway\Request\BuilderInterface`.

```php
public function build(array $buildSubject)
{
    $paymentDO = SubjectReader::readPayment($buildSubject);
    return ['AMOUNT' => $paymentDO->getOrder()->getGrandTotalAmount()];
}
```

### 3b. Builder Composite (Khuyên dùng)
Dùng `di.xml` để gom nhiều builder nhỏ lại.

```xml
<virtualType name="MyPaymentAuthorizeRequest" type="Magento\Payment\Gateway\Request\BuilderComposite">
    <arguments>
        <argument name="builders" xsi:type="array">
            <item name="customer" xsi:type="string">Vendor\Module\Gateway\Request\CustomerBuilder</item>
            <item name="address" xsi:type="string">Vendor\Module\Gateway\Request\AddressBuilder</item>
            <item name="amount" xsi:type="string">Vendor\Module\Gateway\Request\AmountBuilder</item>
        </argument>
    </arguments>
</virtualType>
```

---

## 4. Các file cấu hình & UI

- **`etc/payment.xml`**: Khai báo phương thức thanh toán.
- **`etc/config.xml`**: Cấu hình mặc định.
- **`Block/Info.php`**: Hiển thị thông tin thanh toán trong trang Order (Admin/Frontend).
- **`Block/Form.php`**: Template nhập liệu (thường dùng trong Admin khi tạo đơn hàng thủ công).

---

## 5. Lưu ý quan trọng

1. **Security:** Không bao giờ lưu số thẻ (PAN) hoặc CVV vào database của Magento.
2. **Stateless:** Các lớp trong Gateway nên luôn là Stateless để tương thích với App Server.
3. **Logging:** Luôn dùng `Magento\Payment\Model\Method\Logger` để ghi log debug các giao dịch (nhớ ẩn các thông tin nhạy cảm).

---

## 6. Gateway Client & Transfer Factory

Đây là lớp thực hiện kết nối HTTP thực tế.

- **Transfer Factory:** Chuẩn bị "gói hàng" (URL, Method, Headers, Body).
- **Client:** "Gửi hàng" đi (Sử dụng `Magento\Payment\Gateway\Http\Client\Zend` mặc định hoặc Custom Curl).

```php
// Ví dụ trong TransferFactory — body HTTP phải qua Serializer\Json (constitution §2)
public function create(array $request): \Magento\Payment\Gateway\Http\TransferInterface
{
    return $this->transferBuilder
        ->setMethod(Curl::POST)
        ->setHeaders(['Content-Type' => 'application/json'])
        ->setBody($this->serializer->serialize($request))
        ->setUri($this->getApiUrl())
        ->build();
}
```
> Inject `Magento\Framework\Serialize\Serializer\Json` qua constructor — không dùng `json_encode()` PHP trực tiếp cho request body nghiệp vụ.

---

## 7. Response Validator (Kiểm tra phản hồi)

Quyết định xem phản hồi từ ngân hàng là Thành công hay Thất bại.

```php
public function validate(array $validationSubject) {
    $response = SubjectReader::readResponse($validationSubject);
    $isValid = isset($response['RESULT']) && $response['RESULT'] == 'SUCCESS';
    
    return $this->createResult($isValid, $isValid ? [] : [__('Giao dịch bị từ chối.')]);
}
```

---

## 8. Response Handler (Lưu dữ liệu)

Lưu các thông tin quan trọng (Transaction ID, Card Type...) vào đối tượng Payment của Magento.

```php
public function handle(array $handlingSubject, array $response) {
    $paymentDO = $this->subjectReader->readPayment($handlingSubject);
    $payment = $paymentDO->getPayment();
    
    // Đánh dấu giao dịch và lưu ID từ ngân hàng
    $payment->setTransactionId($response['TXN_ID']);
    $payment->setIsTransactionClosed(false); // Giữ transaction mở để có thể Void/Refund sau này
}
```

---

## 9. Error Code Mapper

Giúp ánh xạ mã lỗi kỹ thuật sang ngôn ngữ con người. Khai báo trong `di.xml` thông qua `errorMessageMapper`.

- **Mã kỹ thuật:** `1001` -> **Thông báo:** "Thẻ của quý khách đã hết hạn."
- **Mã kỹ thuật:** `2005` -> **Thông báo:** "Số dư không đủ để thực hiện giao dịch."

---

## 10. Cấu hình Flags (config.xml)

Nơi định nghĩa các tính năng mà cổng thanh toán của bạn hỗ trợ.

> **⚠️ Bắt buộc:** `<is_gateway>1</is_gateway>` phải có nếu dùng `Magento\Payment\Model\Method\Adapter`.
> `Adapter::isAvailable()` kiểm tra `isGateway()` — thiếu flag này → method không xuất hiện trong payment list dù `active=1`.

```xml
<default>
    <payment>
        <my_payment_code>
            <active>1</active>
            <model>MyPaymentFacade</model> <!-- Trỏ tới virtualType Facade trong di.xml -->
            <title>Thanh toán qua Ngân hàng</title>
            <is_gateway>1</is_gateway>     <!-- BẮT BUỘC cho Adapter-based payment -->
            <can_authorize>1</can_authorize>
            <can_capture>1</can_capture>
            <can_void>1</can_void>
            <can_refund>1</can_refund>
            <can_use_checkout>1</can_use_checkout>
            <can_use_internal>1</can_use_internal> <!-- Cho phép dùng trong Admin -->
            <payment_action>authorize_capture</payment_action>
            <order_status>processing</order_status>
        </my_payment_code>
    </payment>
</default>
```

---

## 11. Nhận dữ liệu từ Frontend (Data Assign Observer)

Khi khách hàng nhấn "Place Order", dữ liệu từ JS Checkout được gửi về. Bạn cần một Observer để lưu dữ liệu này vào `additional_information`.

**Events.xml:**
```xml
<event name="payment_method_assign_data_my_payment_code">
    <observer name="my_payment_data_assign" instance="Vendor\Module\Observer\DataAssignObserver" />
</event>
```

**Observer Class:**
Kế thừa `Magento\Payment\Observer\AbstractDataAssignObserver`.

```php
public function execute(Observer $observer) {
    $data = $this->readDataArgument($observer);
    $additionalData = $data->getData(PaymentInterface::KEY_ADDITIONAL_DATA);
    $paymentInfo = $this->readPaymentModelArgument($observer);

    if (isset($additionalData['payment_token'])) {
        $paymentInfo->setAdditionalInformation('payment_token', $additionalData['payment_token']);
    }
}
```

---

## 12. Phân vùng cấu hình (Areas)

- **`etc/frontend/di.xml`**: Chứa cấu hình riêng cho Checkout (ví dụ: cần 3D Secure).
- **`etc/adminhtml/di.xml`**: Chứa cấu hình cho Admin (ví dụ: bỏ qua 3D Secure khi nhân viên tạo đơn hàng).

> **⚠️ Quan trọng:** `CompositeConfigProvider` (inject `configProviders`) và `Magento\Checkout\Block\Cart\Sidebar` plugin **phải** đăng ký trong `etc/frontend/di.xml`, không phải `etc/di.xml` (global scope).
> Magento chỉ load `CompositeConfigProvider` trong frontend context — đăng ký global sẽ không inject config vào `window.checkoutConfig`.

```xml
<!-- ✅ ĐÚNG: etc/frontend/di.xml -->
<type name="Magento\Checkout\Model\CompositeConfigProvider">
    <arguments>
        <argument name="configProviders" xsi:type="array">
            <item name="my_payment_config_provider" xsi:type="object">Vendor\Module\Model\Ui\ConfigProvider</item>
        </argument>
    </arguments>
</type>

<!-- ❌ SAI: etc/di.xml (global) — config sẽ không xuất hiện trong window.checkoutConfig -->
```

---

## 13. Xác thực 3D Secure (CardinalCommerce)

3D Secure là lớp bảo mật bắt buộc để xác thực chủ thẻ qua ngân hàng phát hành.

### Luồng xử lý:
1. **JS Checkout:** Nhận mã `cardinalJWT` sau khi khách xác thực OTP.
2. **Observer:** Lưu `cardinalJWT` vào `additional_information`.
3. **Request Builder:** Giải mã JWT để lấy dữ liệu xác thực gửi cho Gateway API.

```php
/**
 * Trích xuất thông tin 3DS từ JWT để gửi đi
 */
public function build(array $buildSubject): array {
    $paymentDO = $this->subjectReader->readPayment($buildSubject);
    $payment = $paymentDO->getPayment();
    
    $cardinalJwt = (string)$payment->getAdditionalInformation('cardinalJWT');
    $jwtPayload = $this->jwtParser->execute($cardinalJwt); // Trả về array Payload
    
    $eciFlag = $jwtPayload['Payload']['Payment']['ExtendedData']['ECIFlag'] ?? '';
    $cavv = $jwtPayload['Payload']['Payment']['ExtendedData']['CAVV'] ?? '';

    return [
        'transactionRequest' => [
            'cardholderAuthentication' => [
                'authenticationIndicator' => $eciFlag,
                'cardholderAuthenticationValue' => $cavv
            ],
        ]
    ];
}
```

---

## 14. Offline Payment Method (Adapter Pattern)

Dùng `Magento\Payment\Model\Method\Adapter` qua `virtualType` — không extend `AbstractMethod` (deprecated).

**`etc/config.xml`** — các flag quan trọng cho offline:
```xml
<vendor_offline>
    <model>VendorOfflinePaymentFacade</model><!-- virtualType name trong di.xml -->
    <group>offline</group>
    <is_offline>1</is_offline>
    <can_use_checkout>1</can_use_checkout>
    <can_use_internal>1</can_use_internal>
    <order_status>pending</order_status>
</vendor_offline>
```

**`etc/di.xml`** — Facade tối giản cho offline (không cần commandPool):
```xml
<virtualType name="VendorOfflinePaymentFacade" type="Magento\Payment\Model\Method\Adapter">
    <arguments>
        <argument name="code" xsi:type="const">Vendor\Module\Model\Ui\ConfigProvider::CODE</argument>
        <argument name="formBlockType" xsi:type="string">Magento\Payment\Block\Form</argument>
        <argument name="infoBlockType" xsi:type="string">Magento\Payment\Block\Info</argument>
        <argument name="valueHandlerPool" xsi:type="object">VendorOfflinePaymentValueHandlerPool</argument>
        <!-- commandPool KHÔNG cần cho offline — không có authorize/capture/void -->
    </arguments>
</virtualType>
```

> Blueprint đầy đủ: xem [examples/integration/custom-payment-offline-blueprint.md](../../../examples/integration/custom-payment-offline-blueprint.md)

---

## Liên kết

- Architectural Patterns: xem [architectural-patterns.md](../core/architectural-patterns.md)
- Service Contracts: xem [service-contracts.md](../core/service-contracts.md)
- CLI & Maintenance: xem [maintenance-cli.md](../ops/maintenance-cli.md)

---

## 15. Checkout Renderer — jsLayout (checkout_index_index.xml)

Khi đăng ký payment renderer vào checkout, node `billing-step` **bắt buộc** phải có `component` declaration:

```xml
<!-- ✅ ĐÚNG -->
<item name="billing-step" xsi:type="array">
    <item name="component" xsi:type="string">uiComponent</item>
    <item name="children" xsi:type="array">
        <item name="payment" xsi:type="array">
            <item name="children" xsi:type="array">
                <item name="renders" xsi:type="array">
                    <item name="children" xsi:type="array">
                        <item name="my-payment" xsi:type="array">
                            <item name="component" xsi:type="string">Vendor_Module/js/view/payment/method-renderer</item>
                            <item name="methods" xsi:type="array">
                                <item name="my_payment_code" xsi:type="array">
                                    <item name="isBillingAddressRequired" xsi:type="boolean">true</item>
                                </item>
                            </item>
                        </item>
                    </item>
                </item>
            </item>
        </item>
    </item>
</item>

<!-- ❌ SAI: thiếu component → jsLayout không merge đúng → renderer không được đăng ký -->
<item name="billing-step" xsi:type="array">
    <item name="children" xsi:type="array">
        ...
    </item>
</item>
```

> Nếu dùng Mageplaza OSC, cần tạo thêm `view/frontend/layout/onestepcheckout_index_index.xml` với cùng nội dung.

---

## 16. Cảnh báo: `strpos` với payment method code chứa prefix của module khác

Nếu codebase có observer filter payment methods dựa trên `strpos($code, 'some_prefix')`, hãy cẩn thận với method code bắt đầu bằng prefix đó.

**Ví dụ nguy hiểm:**
```php
// strpos('laybyland_paysquad', 'layby') === 0 (truthy, không phải false!)
if (strpos($methodCode, 'layby') !== false) {
    // PaySquad bị nhận nhầm là layby method
}
```

**Fix:** Dùng whitelist cho các method không thuộc group nhưng có prefix trùng:
```php
private const NON_GROUP_METHODS = ['laybyland_paysquad'];

if (strpos($methodCode, 'layby') !== false
    && !in_array($methodCode, self::NON_GROUP_METHODS, true)
) {
    // filter
}
```

---

## 17. Review rules — Redirect payment flow (redirect về trang kết quả ≠ đã thanh toán)

Quy tắc review chung cho payment method dạng redirect (khách rời site sang trang provider
rồi quay về). Áp dụng lifecycle Magento, KHÔNG cụ thể cho provider nào (mọi claim về
VNPAY/MoMo/ZaloPay phải verify riêng trước khi viết vào spec).

1. **Browser return ≠ payment proof**: trang success/error khách quay về chỉ là UI —
   trạng thái thanh toán CHỈ được xác nhận qua callback/webhook đã verify, hoặc API query.
   Không đổi order state dựa trên việc khách "đã về success page".
2. **Callback phải idempotent**: provider retry / khách reload return URL / IPN trễ có
   thể cùng 1 giao dịch đến nhiều lần — xử lý lần thứ N phải an toàn (đã processed →
   no-op thành công, không double-invoice/double-capture).
3. **Verify chữ ký + amount + currency** của callback theo tài liệu provider trước khi
   tin payload; reject nếu sai. Verify TRƯỚC mọi state change.
4. **State transition qua Magento service** (`OrderService`/`InvoiceService`/payment
   command), KHÔNG `UPDATE sales_order SET state=...` / set status trực tiếp bằng raw SQL —
   mất reservation (MSI), mất totals, lệch state machine.
5. **Provider URL có expiry**: link thanh toán hết hạn → khách không thanh toán được nữa;
   đơn "chờ thanh toán" cần cron expiry có chủ đích (cancel order + giải phóng reservation
   qua Magento cancellation flow).
6. **Cron-expiry vs late-callback race**: callback hợp lệ đến SAU khi cron đã cancel đơn
   (đã giải phóng reservation) — phải xử lý tường minh: refund/void qua provider, hoặc
   re-order; đừng revive đơn đã cancel bằng setState.
7. **Paid/captured thì KHÔNG auto-cancel**: trước khi cancel bất kỳ đơn pending nào, kiểm
   tra invoice/transaction — nếu tiền đã capture mà cancel → mất đồng bộ tồn kho/tiền.
8. **Multi-attempt state model tường minh**: khách có thể retry payment nhiều lần cho 1
   quote/order — mỗi attempt là 1 transaction record riêng; state cuối = theo transaction
   thành công mới nhất, không theo attempt cuối cùng bất kể kết quả.

---

## 18. Global plugin trên `QuoteManagement` — DI isolation (gotcha đắt giá)

Plugin đăng ký **global** trên `Magento\Quote\Model\QuoteManagement::placeOrder` (để guard
theo payment method) chạy cho **mọi** payment method. Hai bẫy đã gây incident production thật:

1. **DI chéo giữa các gateway**: constructor plugin inject `MethodInterface` chỉ để gọi
   `getCode()` → cả Facade (Adapter + commandPool + HTTP client) của gateway A bị construct
   khi gateway B đặt hàng — phí tài nguyên và nổ DI chéo nếu dependency của A chưa sẵn sàng.
   **Quy tắc:** so sánh method code → inject **scalar `methodCode`** qua virtualType per
   gateway; dependency nặng → `Proxy`. KHÔNG inject `MethodInterface` chỉ để đọc code.

   ```xml
   <!-- ✅ virtualType per gateway — scalar code, không construct Facade -->
   <type name="Vendor\Momo\Plugin\PlaceOrderGuard">
       <arguments>
           <argument name="methodCode" xsi:type="const">Vendor\Momo\Model\Ui\ConfigProvider::CODE</argument>
       </arguments>
   </type>
   ```

2. **Thiếu `<preference>` → runtime fatal mà `setup:di:compile` KHÔNG bắt được**: interface
   resolution chỉ chạy lúc runtime (lần interception đầu). Plugin + mọi service nó kéo theo
   inject interface mới mà thiếu binding → "Cannot instantiate interface" giữa luồng đặt hàng.
   **Quy tắc:** mọi class bị plugin global kéo vào phải có DI binding test (`Test/Unit/Di/`)
   + runtime smoke trên môi trường thật; KHÔNG thêm preference suy đoán (runtime chứng minh
   interface không bao giờ resolve thì đừng thêm binding chết).

> Kiến trúc payment-first đầy đủ (attempt state machine, finalizer, IPN): xem
> [payment-first-checkout.md](../business/payment-first-checkout.md)

---

## 19. Provider response không có signature — echo-of-exact-request

Một số provider (vd MoMo query/refund v2) **không trả signature** trong response. Đừng assume
signature tồn tại — verify tài liệu trước. Khi không có signature, identity = **echo của đúng
request vừa gửi**:

1. **Bind response với EXACT request vừa ký/gửi TRƯỚC khi đọc evidence fields** (`refundTrans`,
   `transId`...): đối chiếu `partnerCode` + echo `orderId`/`requestId` + `amount` với chính
   request vừa gửi — chống cross-request evidence confusion (response của attempt khác).
2. **`requestId` query minted mới mỗi lần gọi** (vd `<order_ref>-Q<16 hex random>`), ký request
   với chính giá trị đó; request_id create-time của attempt không bị đọc hay ghi đè.
3. `partnerCode`: strict khi conflict, tolerant khi vắng mặt trong response.

---

## 20. Result-code classifier — fail-safe

Quy tắc phân loại resultCode từ provider (Return path, Recovery cron, Refund):

1. **Unknown / missing / unmapped code KHÔNG BAO GIỜ default FAILED** — chỉ explicit allowlist
   mới được kết luận fail. Missing resultCode phải rơi vào nhánh "unknown" (retry/query lại),
   không phải recordAuthoritativeFailure.
2. **Pending vs paid là 2 allowlist riêng** theo contract từng API (vd MoMo: `0` = paid,
   `7000/7002` = non-terminal pending — zero mutation, có regression test cho cả hai).
3. **KHÔNG tái sử dụng classifier refund cho purchase** (cùng mã `9000` khác nghĩa giữa 2 API)
   — extract shared classifier (vd `PurchaseQueryClassifier`) dùng chung Return + Recovery
   paths để hết drift, và classifier riêng cho refund.
4. **Provider trả resultCode dạng `int`** → so sánh với `?string` param gây TypeError ngầm.
   Cast tường minh ngay đầu (`(string)$response['resultCode']`) — bug production thật đã bắt
   được qua unit test.

---

## 21. Refund: gateway command chạy BÊN TRONG TX của `CreditmemoService`

`CreditmemoService::refund()` mở DB transaction trên connection **`sales`** và chạy gateway
refund command bên trong nó. **Rollback khi exception nuốt mất mọi ghi cùng connection** —
bằng chứng refund FAILED/UNKNOWN biến mất đúng lúc cần nó nhất (reconciliation).

1. **Ghi refund record qua connection độc lập** (`ConnectionFactory`-built PDO adapter, table
   prefix xử lý thủ công) — evidence tồn tại xuyên suốt rollback.
2. **Creditmemo entity id chưa được assign đến sau khi gateway command return** — không tham
   chiếu `getEntityId()` trước đó (null).
3. Online refund chỉ fire khi `canRefund() && getDoTransaction() && getInvoice()` — kiểm cả 3.
4. **Budget guard chống double-refund sau TX rollback**: `sum(SUCCESS records) >
   payment->getAmountRefunded()` → block submission mới (đóng hole khách nhận 2 lần tiền khi
   lần 1 đã ghi entrance rồi bị rollback ởMagento nhưng provider vẫn hoàn).

---

## 22. `payment_action` config key — contract với core

`payment/<code>/payment_action` là **contract key** — core đọc qua facade
`getConfigPaymentAction()` → `Magento\Sales\Model\Order\Payment::place()`. Field admin viết
key khác (vd `payment/<code>/<code>_action`) → **silently no-op**: không reader nào đọc,
auto-capture không bao giờ chạy, không lỗi gì để thấy.

1. Một constant duy nhất cho key config (`Model\Config::KEY_PAYMENT_ACTION = 'payment_action'`)
   dùng chung cho `system.xml` + `config.xml` + reader.
2. QC bắt buộc: save Payment Action trong Admin → verify giá trị land vào `core_config_data`
   đúng path → verify behavior (authorize-only vs authorize_capture) qua log/command.

---

## 23. Logging & masking payment

1. **Dùng core `Magento\Payment\Model\Method\Logger::debug()`** — tự gate theo
   `payment/<code>/debug` + mask đệ quy qua `debugReplaceKeys`/`maskKeys`. KHÔNG viết logger
   cạnh tranh; KHÔNG gate theo config tự chế.
2. Credentials (public/secret key): log dạng **present/missing**, không bao giờ in giá trị.
3. Provider response in qua **whitelist field** (`return_code`, `zp_trans_id`, `refund_id`,
   `return_message`...) — MAC/signature trong response không bao giờ lọt ra log.
4. Mask thêm PII (`app_user`, email, phone) và `key1`/secret tại mọi diagnostic CLI.

---

## 24. Refund không có IPN — poll query API, decision/message cùng một cột contract

Một số provider (vd ZaloPay `/v2/refund`) **không có callback_url/IPN cho refund** → merchant
tự chịu trách nhiệm biết kết quả hoàn tiền: cron poll query API (vd `POST /v2/query_refund`
theo `m_refund_id`, schedule `*/15`) cho đến khi return_code final.

Quy tắc đọc response:

1. **Decision và message phải đọc CÙNG MỘT cột contract.** Bug thật: `RefundCommand` quyết
   định từ `return_code` nhưng message hiển thị lấy từ `sub_return_code` → T+2s thấy
   sub=2 ("đang xử lý") hiển thị "Refund failed." dù refund thực tế đang chạy rồi thành công
   (probe T+8 phút `return_code=1`). Admin thấy fail giả → thao tác trùng gây double-refund.
2. **Nghi fail thì luôn query lại provider trước khi kết luận** — một response chưa final
   không đủ căn cứ recordAuthoritativeFailure (xem §20 classifier fail-safe).
3. Schedule poll + query CLI phải đi qua đúng đường reconciliation chuẩn (re-sign qua
   `Authorization::getMac`, decode `additional_information`) — không viết logic query thứ hai
   song song dễ drift.

---

## 25. Creditmemo lifecycle: `STATE_OPEN` trước khi refund qua core

Ràng buộc core 2.4.8-p5: `CreditmemoService::validateForRefund()` ném *"We cannot register an
existing credit memo"* cho mọi creditmemo đã persist (`getId()`) mà `state != STATE_OPEN`.
Flow **bind-then-refund** (persist creditmemo → gọi provider → mới `$proceed()` để core
finalise) phải:

1. Set `state = Creditmemo::STATE_OPEN` **ngay lúc persist đầu tiên** — để `state=NULL` là
   mọi refund sync sau đó bị core chặn.
2. KHÔNG set `STATE_REFUNDED` trước provider success; KHÔNG mutate `total_refunded`/
   `qty_refunded` sớm — chỉ core `$proceed()` được làm điều đó sau khi gateway command thành
   công (nếu không, rollback TX mà số liệu đã lệch — xem §21).
3. Chứng minh bằng **real core stack** — gọi `CreditmemoService` thật trên môi trường có DB,
   không chấp nhận mock `$proceed()` làm bằng chứng chính.

