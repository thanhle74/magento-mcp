# Luma Figma Component Contract
> Template chuẩn để chốt contract component trước khi triển khai.

## Template

### [Component Name]

- Purpose:
- Figma refs:
  - Mobile frame:
  - Desktop frame:
- Magento mapping:
  - Layout handle:
  - XML file:
  - PHTML file:
  - LESS file:
- BEM contract:
  - Block:
  - Elements:
  - Modifiers:
  - States (`is-*`):
- States bắt buộc:
  - default
  - hover (nếu có)
  - active (nếu có)
  - disabled (nếu có)
  - loading/empty (nếu có)
- Responsive behavior:
  - Mobile:
  - Desktop:
- Acceptance:
  - visual match
  - responsive pass
  - không css leak
- Risks/Dependencies:

## Rule

- Không code khi contract chưa đủ mobile + desktop.
- Không đưa page-specific fix vào core component nếu chưa đánh giá impact.
