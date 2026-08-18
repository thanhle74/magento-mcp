# Luma Figma Delivery Workflow
> Quy trình chuẩn để đi từ design sang code, dùng cho mọi page frontend.

## Step 1: Design freeze

- Chốt version Figma desktop + mobile.
- Chốt states và case dữ liệu dài/ngắn.

## Step 2: Token mapping

- Trích token cần dùng.
- Map sang LESS variables theo semantic naming.

## Step 3: Component contract review

- Chốt XML/PHTML/LESS mapping.
- Chốt BEM naming + state matrix.

## Step 4: Implementation

- Build mobile-first theo component.
- Nâng desktop theo breakpoint strategy.

## Step 5: QA gates

- Visual QA vs Figma.
- Responsive QA tại breakpoint và breakpoint trung gian.
- Accessibility và performance sanity check.

## Step 6: Merge

- Chỉ merge khi pass QA gate.
- Ghi rõ known limitations nếu có.
