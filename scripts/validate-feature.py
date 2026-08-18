#!/usr/bin/env python3
"""
Validate feature — lean: chỉ bắt buộc spec.md đủ section.

Usage:
    python scripts/validate-feature.py features/<feature-name>/
"""

import sys
from pathlib import Path


def _has_section(content: str, *markers: str) -> bool:
    lower = content.lower()
    return any(m.lower() in lower for m in markers)


def validate_feature(feature_path: Path) -> list[str]:
    errors: list[str] = []
    warnings: list[str] = []

    spec_path = feature_path / "spec.md"
    if not spec_path.exists():
        errors.append("❌ Missing required file: spec.md")
        return errors

    spec_content = spec_path.read_text(encoding="utf-8")

    if not _has_section(spec_content, "## Acceptance criteria", "## Acceptance Criteria"):
        errors.append("❌ spec.md missing: Acceptance criteria")

    if not _has_section(spec_content, "## Test cases", "## Test Cases", "## Testcase"):
        errors.append("❌ spec.md missing: Test cases")

    if not _has_section(spec_content, "## Context", "## Business"):
        warnings.append("⚠️  spec.md should have ## Context (or scope section)")

    if "Đã kiểm tra code hiện tại" not in spec_content:
        warnings.append("⚠️  spec.md should have 'Đã kiểm tra code hiện tại'")

    if not _has_section(spec_content, "## Tasks"):
        warnings.append("⚠️  spec.md should have ## Tasks (checkbox) before implement")

    # Legacy files — optional
    for legacy in ("plan.md", "tasks.md", "status.md"):
        if (feature_path / legacy).exists():
            warnings.append(f"ℹ️  Legacy file present (optional): {legacy}")

    return errors + warnings


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/validate-feature.py <feature-path>")
        sys.exit(1)

    feature_path = Path(sys.argv[1])
    if not feature_path.is_dir():
        print(f"❌ Not a directory: {feature_path}")
        sys.exit(1)

    print(f"🔍 Validating: {feature_path}\n")
    issues = validate_feature(feature_path)
    errors = [i for i in issues if i.startswith("❌")]
    warnings = [i for i in issues if not i.startswith("❌")]

    for w in warnings:
        print(f"  {w}")

    if errors:
        print()
        for e in errors:
            print(f"  {e}")
        print("\n💡 See QUICKSTART.md")
        sys.exit(1)

    print("✅ spec.md OK (lean workflow)")
    if warnings:
        print(f"   ({len(warnings)} note(s) above)")
    sys.exit(0)


if __name__ == "__main__":
    main()
