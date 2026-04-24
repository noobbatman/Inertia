import re
from collections import Counter

CATEGORIES = [
    "BACKEND",
    "TESTING",
    "UI",
    "DATABASE",
    "INFRA",
    "SYSTEM_DESIGN",
    "OTHER",
]


def summarize_diff(diff: str) -> dict[str, object]:
    files_changed = _extract_files_changed(diff)
    lines_added = sum(
        1
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    )
    lines_removed = sum(
        1
        for line in diff.splitlines()
        if line.startswith("-") and not line.startswith("---")
    )
    categories = classify_categories(files_changed)

    return {
        "lines_added": lines_added,
        "lines_removed": lines_removed,
        "files_changed": files_changed,
        "categories": categories,
    }


def _extract_files_changed(diff: str) -> list[str]:
    paths: list[str] = []
    seen: set[str] = set()

    for line in diff.splitlines():
        if not line.startswith("+++ b/"):
            continue
        path = line.removeprefix("+++ b/").strip()
        if path and path != "/dev/null" and path not in seen:
            seen.add(path)
            paths.append(path)

    return paths


def classify_categories(files_changed: list[str]) -> dict[str, int]:
    if not files_changed:
        return {category: 0 for category in CATEGORIES}

    counter: Counter[str] = Counter(_category_for_path(path) for path in files_changed)
    total = sum(counter.values())

    raw = {
        category: (counter.get(category, 0) * 100.0) / total for category in CATEGORIES
    }
    floored = {category: int(value) for category, value in raw.items()}
    remainder = 100 - sum(floored.values())

    ranked = sorted(
        CATEGORIES,
        key=lambda category: (raw[category] - floored[category], counter.get(category, 0)),
        reverse=True,
    )

    for i in range(remainder):
        floored[ranked[i % len(ranked)]] += 1

    return floored


def _category_for_path(path: str) -> str:
    normalized = path.lower()

    if _matches(normalized, [r"(^|/)db(/|$)", r"(^|/)models(/|$)", r"\.sql$", r"(^|/)migrations(/|$)", r"schema"]):
        return "DATABASE"

    if _matches(normalized, [r"(^|/)components(/|$)", r"(^|/)pages(/|$)", r"\.css$", r"\.tsx$", r"\.html$", r"(^|/)ui(/|$)"]):
        return "UI"

    if _matches(normalized, [r"(^|/)api(/|$)", r"(^|/)routes(/|$)", r"(^|/)controllers(/|$)", r"(^|/)services(/|$)", r"\.py$", r"\.go$"]):
        return "BACKEND"

    if _matches(normalized, [r"docker", r"(^|/)k8s(/|$)", r"(^|/)infra(/|$)", r"\.ya?ml$", r"nginx", r"dockerfile$"]):
        return "INFRA"

    if _matches(normalized, [r"(^|/)tests(/|$)", r"(^|/)spec(/|$)", r"\.test\.", r"_test\."]):
        return "TESTING"

    if _matches(normalized, [r"\.md$", r"(^|/)docs(/|$)", r"(^|/)architecture(/|$)", r"(^|/)design(/|$)", r"(^|/)diagrams(/|$)"]):
        return "SYSTEM_DESIGN"

    return "OTHER"


def _matches(value: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, value) for pattern in patterns)
