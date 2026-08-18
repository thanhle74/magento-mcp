# Magento 2 Object System Series (Alan Storm)

Tài liệu này gom tắt bộ 8 bài về Object Manager/DI để dùng làm reference khi thiết kế kiến trúc module và debug dependency graph trong Magento 2.

Nguồn:

- [Magento 2 Object Manager](https://alanastorm.com/magento_2_object_manager/)
- [Magento 2's Automatic Dependency Injection](https://alanastorm.com/magento2_dependency_injection_2015/)
- [Magento 2 Object Manager Preferences](https://alanastorm.com/magento_2_object_manager_preferences/)
- [Magento 2 Object Manager Argument Replacement](https://alanastorm.com/magento_2_object_manager_argument_replacement/)
- [Magento 2 Object Manager Virtual Types](https://alanastorm.com/magento_2_object_manager_virtual_types/)
- [Magento 2 Object Manager: Proxy Objects](https://alanastorm.com/magento_2_object_manager_proxy_objects/)
- [Magento 2 Object Manager: Instance Objects](https://alanastorm.com/magento_2_object_manager_instance_objects/)
- [Magento 2 Object Manager Plugin System](https://alanastorm.com/magento_2_object_manager_plugin_system/)

---

## 1) Lộ trình đọc đề xuất

1. `Object Manager` -> hiểu `create` vs `get`, shared lifecycle.
2. `Automatic DI` -> constructor injection + type-hint contract.
3. `Preferences` -> mapping interface/class implementation.
4. `Argument Replacement` -> thay dependency theo ngữ cảnh class.
5. `Virtual Types` -> cấu hình "class ảo" để tinh chỉnh injection.
6. `Proxy Objects` -> lazy loading để giảm cost khởi tạo.
7. `Instance Objects` -> shared vs unshared, factory cho non-injectables.
8. `Plugin System` -> before/after/around interception (thay thế class rewrite cũ).

---

## 2) Tóm tắt nhanh từng chủ đề

### 2.1 Object Manager nền tảng

- Object Manager là điểm vào tạo object của framework.
- `create` tạo instance mới; `get` trả shared/singleton-ish instance.
- Code nghiệp vụ thông thường không nên gọi Object Manager trực tiếp.

### 2.2 Automatic Dependency Injection

- Constructor type-hints giúp framework auto-instantiate dependencies.
- DI là mặc định cho phần lớn object trong runtime Magento.
- Mục tiêu: giảm coupling trực tiếp và tăng khả năng thay thế implementation.

### 2.3 Preferences

- `<preference for="X" type="Y"/>` để thay implementation class/interface.
- Rất mạnh nhưng dễ "winner-take-all"; cần dùng thận trọng.
- Đặc biệt hợp cho design-by-contract khi inject interface.

### 2.4 Argument Replacement

- `<type name="..."><arguments>...` thay constructor arg theo target class.
- Có thể thay scalar/object/array/const (theo `xsi:type`).
- Array args có tính chất merge giữa nhiều module.

### 2.5 Virtual Types

- `<virtualType/>` là "configuration-only type", không cần file PHP mới.
- Dùng để tinh chỉnh dependency của một class trong context cụ thể.
- Tăng độ linh hoạt nhưng dễ làm dependency graph khó đọc nếu lạm dụng.

### 2.6 Proxy Objects

- Proxy defer khởi tạo object nặng đến lúc method thực sự được gọi.
- Thường dùng để tối ưu performance và phá vòng phụ thuộc.
- Liên quan code generation; cần chú ý regenerate khi đổi public API.

### 2.7 Instance Objects + Factories

- Mặc định injected object là shared; đặt `shared="false"` để unshared.
- Với đối tượng dữ liệu/non-injectable, ưu tiên dùng `*Factory`.
- Factory classes thường được generated tự động.

### 2.8 Plugin System

- `before`, `after`, `around` cho phép interception method theo `di.xml`.
- Là cách mở rộng hành vi core an toàn hơn so với rewrite toàn class.
- `around` mạnh nhất nhưng rủi ro cao nhất nếu không gọi proceed đúng.

---

## 3) Mapping sang `.spec` hiện có

| Chủ đề | File nên đọc trong `.spec` |
|---|---|
| DI, Factory, Proxy, shared lifecycle | `core/di-codegen.md` |
| Plugin interception | `core/plugins.md` |
| Service contracts và interface-driven design | `core/service-contracts.md` |
| Pattern kiến trúc bổ trợ | `core/architectural-patterns.md` |

---

## 4) Quy tắc áp dụng cho project

- Ưu tiên constructor DI + interface contracts.
- Tránh Object Manager trực tiếp trong business code (trừ trường hợp đặc biệt).
- Ưu tiên plugin/argument replacement trước preference toàn cục.
- Dùng virtual type/proxy khi có lý do rõ về performance hoặc context isolation.
- Khi đổi constructor hoặc public methods ở class có generated artifacts, luôn verify compile/regeneration.

---

## 5) Prompt mẫu sử dụng

```text
Đọc `.spec/config/references/core/object-manager-series.md`
và các file mapping liên quan (`di-codegen.md`, `plugins.md`, `service-contracts.md`).
Áp dụng đúng nguyên tắc DI của project để implement task.
Nêu rõ bạn đang dùng plugin, preference, argument replacement hay virtual type và vì sao.
```
