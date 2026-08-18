# Tham khảo: Báo cáo nâng cao (Advanced Reporting)

Nguồn: https://developer.adobe.com/commerce/php/development/advanced-reporting/

---

## 1. Cơ chế hoạt động

Hệ thống sử dụng module `Magento_Analytics` để thu thập dữ liệu (Orders, Customers, Products) và gửi tới dịch vụ Adobe Reporting. Nhà phát triển có thể mở rộng dữ liệu thu thập thông qua cấu hình XML.

---

## 2. Định nghĩa báo cáo (reports.xml)

Dùng để mô tả câu lệnh SQL truy vấn dữ liệu dưới dạng Declarative XML.

**`etc/reports.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Analytics:etc/reports.xsd">
    <report name="custom_order_report" connection="default">
        <source name="sales_order" alias="main_table">
            <attribute name="entity_id" alias="order_id" />
            <attribute name="base_grand_total" function="sum" alias="total_revenue" />
            
            <!-- JOIN bảng khác -->
            <link-source name="sales_order_address" alias="billing" link-type="LEFT">
                <using left="entity_id" right="parent_id" />
                <attribute name="city" />
            </link-source>

            <!-- Lọc dữ liệu (WHERE) -->
            <filter glue="and">
                <condition attribute="status" operator="eq">complete</condition>
            </filter>
        </source>
    </report>
</config>
```

---

## 3. Cấu hình thu thập (analytics.xml)

Chỉ định báo cáo nào sẽ được xuất ra file để đồng bộ.

**`etc/analytics.xml`**:
```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Analytics:etc/analytics.xsd">
    <file name="custom_sales_data">
        <providers>
            <reportProvider name="custom_report_provider" class="Magento\Analytics\ReportXml\ReportProvider">
                <parameters>
                    <name>custom_order_report</name> <!-- Tên report trong reports.xml -->
                </parameters>
            </reportProvider>
        </providers>
    </file>
</config>
```

---

## 4. Lệnh CLI hỗ trợ
- `bin/magento analytics:subscribe`: Đăng ký và lấy Token để kích hoạt đồng bộ.
- `bin/magento analytics:report:generate`: Chạy thủ công việc tạo báo cáo.

---

## Liên kết
- Web API: xem [web-api.md](./web-api.md)
- Cron Jobs: (Sẽ bổ sung nếu cần)
- Quy tắc chung: xem [../constitution.md](../constitution.md)
