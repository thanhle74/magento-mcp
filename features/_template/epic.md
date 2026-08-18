# Epic - <tên-epic>

> File này mô tả boundary tổng thể và danh sách sub-features.
> Không chứa task implement. Mỗi sub-feature có folder riêng với spec/plan/tasks/status của nó.

## Mục tiêu tổng thể
`<1-2 câu mô tả business goal của toàn epic>`

## Boundary

### In-scope
- `<bounded domain / module 1>`
- `<bounded domain / module 2>`

### Out-of-scope
- `<những gì không thuộc epic này>`

## Sub-features

| Sub-feature | Folder | Phụ thuộc vào | Stage |
|---|---|---|---|
| `<tên>` | `<tên-epic>/<tên-sub>/` | — | `draft` |
| `<tên>` | `<tên-epic>/<tên-sub>/` | `<sub trên>` | `draft` |
| `<tên>` | `<tên-epic>/<tên-sub>/` | `<sub trên>` | `draft` |

> Stage values: `draft` / `spec-approved` / `implementing` / `review` / `done`

## Dependency order

```
<sub-feature-1>
    └── <sub-feature-2>
            └── <sub-feature-3>
    └── <sub-feature-4> (có thể làm song song với sub-feature-2)
```

## Acceptance criteria tổng (Epic-level)

- AC-E01: `<...>`
- AC-E02: `<...>`

## Risks tổng

- `<risk liên quan đến integration giữa các sub-features>`
- `<risk liên quan đến thứ tự deploy>`

## Progress

- [ ] `<sub-feature-1>`
- [ ] `<sub-feature-2>`
- [ ] `<sub-feature-3>`
- [ ] `<sub-feature-4>`
