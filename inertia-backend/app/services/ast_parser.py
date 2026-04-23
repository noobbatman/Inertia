import ast
import re
import textwrap

from app.models import DifficultyLevel


def extract_added_code(diff: str) -> str:
    lines = []
    for line in diff.splitlines():
        if line.startswith("+") and not line.startswith("+++"):
            lines.append(line[1:])
    return "\n".join(lines)


def count_line_delta(diff: str) -> int:
    return sum(
        1
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    )


def get_function_names(tree: ast.AST) -> set[str]:
    return {node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}


def count_recursive_calls(tree: ast.AST, func_names: set[str]) -> int:
    count = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in func_names:
                count += 1
    return count


def max_nesting_depth(tree: ast.AST) -> int:
    def depth(node: ast.AST, current: int = 0) -> int:
        if isinstance(node, (ast.For, ast.While, ast.If, ast.AsyncFor, ast.Try)):
            current += 1
        return max(
            (depth(child, current) for child in ast.iter_child_nodes(node)),
            default=current,
        )

    return depth(tree)


def _parse_added_code(code: str) -> ast.AST:
    candidates = [code, textwrap.dedent(code)]
    last_error: SyntaxError | None = None

    for candidate in candidates:
        try:
            return ast.parse(candidate)
        except SyntaxError as exc:
            last_error = exc

    assert last_error is not None
    raise last_error


def _heuristic_recursive_calls(code: str) -> int:
    return len(re.findall(r"\breturn\b.*\b[a-zA-Z_][a-zA-Z0-9_]*\(", code))


def _heuristic_nesting_depth(code: str) -> int:
    counts = [
        len(re.findall(r"\bif\b", code)),
        len(re.findall(r"\bfor\b", code)),
        len(re.findall(r"\bwhile\b", code)),
        len(re.findall(r"\btry\b", code)),
    ]
    return max(counts, default=0)


def compute_complexity(diff: str) -> dict[str, int]:
    code = extract_added_code(diff)
    line_delta = count_line_delta(diff)
    capped_line_delta = min(line_delta, 50)

    try:
        tree = _parse_added_code(code)
        func_names = get_function_names(tree)
        recursive_calls = min(count_recursive_calls(tree, func_names), 10)
        nesting_depth = min(max_nesting_depth(tree), 8)
    except SyntaxError:
        recursive_calls = min(_heuristic_recursive_calls(code), 10)
        nesting_depth = min(_heuristic_nesting_depth(code), 8)

    fc = capped_line_delta + (2 * recursive_calls) + nesting_depth
    return {
        "L": line_delta,
        "R": recursive_calls,
        "N": nesting_depth,
        "fc": fc,
    }


def get_difficulty(fc: int) -> DifficultyLevel:
    if fc <= 10:
        return DifficultyLevel.TRIVIAL
    if fc <= 25:
        return DifficultyLevel.EASY
    if fc <= 45:
        return DifficultyLevel.MEDIUM
    return DifficultyLevel.HARD


def get_timer_seconds(difficulty: DifficultyLevel) -> int:
    return {
        DifficultyLevel.TRIVIAL: 0,
        DifficultyLevel.EASY: 90,
        DifficultyLevel.MEDIUM: 120,
        DifficultyLevel.HARD: 180,
    }[difficulty]
