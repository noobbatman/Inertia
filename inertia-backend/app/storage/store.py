import json
import time
from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.services.lockout import lockout_seconds_for_failures, suspicious_solve

CONCEPTS = ["RECURSION", "DYNAMIC_PROGRAMMING", "SORTING", "GRAPHS", "TREES", "LOOPS", "OTHER"]

try:
    import redis
except ImportError:
    redis = None  # type: ignore[assignment]

_puzzles: dict[str, dict[str, Any]] = {}
_attempts: dict[str, dict[str, Any]] = {}
_solve_times: dict[str, dict[str, Any]] = {}
_projects: dict[str, dict[str, Any]] = {}
_join_codes: dict[str, str] = {}
_project_students: dict[tuple[str, str], dict[str, Any]] = {}
_redis_client = None


def _now() -> float:
    return time.time()


def _empty_attempt_entry() -> dict[str, Any]:
    return {"count": 0, "failed": 0, "locked_until": 0.0, "log": []}


def _use_redis() -> bool:
    return settings.USE_REDIS and redis is not None


def _get_redis():
    global _redis_client

    if not settings.USE_REDIS:
        return None
    if redis is None:
        raise RuntimeError("USE_REDIS is enabled but the redis package is not installed.")
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _attempt_key(project_id: str, student_id: str) -> str:
    return f"attempts:{project_id}:{student_id}"


def _solve_key(project_id: str, student_id: str) -> str:
    return f"solve:{project_id}:{student_id}"


def _puzzle_key(token_id: str) -> str:
    return f"puzzle:{token_id}"


def save_puzzle(token_id: str, puzzle: dict[str, Any], ttl_seconds: int | None = None) -> None:
    ttl = ttl_seconds or settings.PUZZLE_TTL_SECONDS
    payload = {**puzzle, "issued_at": _now()}

    if _use_redis():
        client = _get_redis()
        client.setex(_puzzle_key(token_id), ttl, json.dumps(payload))
        return

    _puzzles[token_id] = {**payload, "expires_at": _now() + ttl}


def load_puzzle(token_id: str) -> dict[str, Any] | None:
    if _use_redis():
        client = _get_redis()
        raw = client.get(_puzzle_key(token_id))
        return json.loads(raw) if raw else None

    puzzle = _puzzles.get(token_id)
    if not puzzle:
        return None
    if _now() > float(puzzle["expires_at"]):
        del _puzzles[token_id]
        return None
    return dict(puzzle)


def delete_puzzle(token_id: str) -> None:
    if _use_redis():
        client = _get_redis()
        client.delete(_puzzle_key(token_id))
        return

    _puzzles.pop(token_id, None)


def _token_status_key(token_id: str) -> str:
    return f"verified_token:{token_id}"


def save_verified_token(token_id: str, jwt_token: str, ttl_seconds: int = 60) -> None:
    if _use_redis():
        client = _get_redis()
        client.setex(_token_status_key(token_id), ttl_seconds, jwt_token)
        return

    _puzzles[f"jwt_{token_id}"] = {"jwt": jwt_token, "expires_at": _now() + ttl_seconds}


def load_verified_token(token_id: str) -> str | None:
    if _use_redis():
        client = _get_redis()
        return client.get(_token_status_key(token_id))

    record = _puzzles.get(f"jwt_{token_id}")
    if not record:
        return None
    if _now() > float(record["expires_at"]):
        del _puzzles[f"jwt_{token_id}"]
        return None
    return str(record["jwt"])


def _load_attempt_entry(project_id: str, student_id: str) -> dict[str, Any]:
    if _use_redis():
        client = _get_redis()
        raw = client.get(_attempt_key(project_id, student_id))
        return json.loads(raw) if raw else _empty_attempt_entry()
    return dict(_attempts.get(f"{project_id}:{student_id}", _empty_attempt_entry()))


def _save_attempt_entry(project_id: str, student_id: str, entry: dict[str, Any]) -> None:
    if _use_redis():
        client = _get_redis()
        client.set(_attempt_key(project_id, student_id), json.dumps(entry))
        return
    _attempts[f"{project_id}:{student_id}"] = entry


def _save_solve(project_id: str, student_id: str, data: dict[str, Any]) -> None:
    if _use_redis():
        client = _get_redis()
        client.set(_solve_key(project_id, student_id), json.dumps(data))
        return
    _solve_times[f"{project_id}:{student_id}"] = data


def _load_solve(project_id: str, student_id: str) -> dict[str, Any]:
    if _use_redis():
        client = _get_redis()
        raw = client.get(_solve_key(project_id, student_id))
        return json.loads(raw) if raw else {}
    return dict(_solve_times.get(f"{project_id}:{student_id}", {}))


def record_attempt(
    student_id: str,
    success: bool,
    fc_score: int = 0,
    solve_time: float = 0,
    concept: str = "OTHER",
    project_id: str = "global",
) -> dict[str, Any]:
    entry = _load_attempt_entry(project_id, student_id)
    entry["count"] += 1
    entry.setdefault("log", [])
    entry["log"].append(
        {
            "timestamp": _now(),
            "success": success,
            "fc_score": fc_score,
            "solve_time": round(solve_time, 3),
            "concept": concept,
        }
    )
    entry["log"] = entry["log"][-20:]

    if not success:
        entry["failed"] += 1
        duration = lockout_seconds_for_failures(entry["failed"])
        entry["locked_until"] = _now() + duration
        if fc_score > 0:
            _save_solve(
                project_id,
                student_id,
                {
                    "fc_score": fc_score,
                    "solve_time": round(solve_time, 3),
                    "timestamp": _now(),
                    "was_correct": False,
                },
            )
    else:
        entry["locked_until"] = 0.0
        entry["failed"] = 0
        _save_solve(
            project_id,
            student_id,
            {
                "fc_score": fc_score,
                "solve_time": round(solve_time, 3),
                "timestamp": _now(),
                "was_correct": True,
            },
        )

    _save_attempt_entry(project_id, student_id, entry)
    return entry


def is_locked_out(student_id: str, project_id: str = "global") -> tuple[bool, int]:
    entry = _load_attempt_entry(project_id, student_id)
    remaining = int(float(entry.get("locked_until", 0)) - _now())
    return remaining > 0, max(0, remaining)


def clear_lockout(student_id: str, project_id: str = "global") -> None:
    entry = _load_attempt_entry(project_id, student_id)
    entry["locked_until"] = 0.0
    _save_attempt_entry(project_id, student_id, entry)


def _format_locked_until(timestamp: float | int) -> str | None:
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def _redis_scan_keys(pattern: str) -> list[str]:
    client = _get_redis()
    keys = []
    cursor = 0
    while True:
        cursor, batch = client.scan(cursor, match=pattern, count=100)
        keys.extend(batch)
        if cursor == 0:
            break
    return keys


def _get_attempt_student_ids(project_id: str = "global") -> list[str]:
    if _use_redis():
        prefix = f"attempts:{project_id}:"
        return [key.removeprefix(prefix) for key in _redis_scan_keys(f"{prefix}*")]
    prefix = f"{project_id}:"
    return [key.removeprefix(prefix) for key in _attempts if key.startswith(prefix)]


def _get_solve_student_ids(project_id: str = "global") -> list[str]:
    if _use_redis():
        prefix = f"solve:{project_id}:"
        return [key.removeprefix(prefix) for key in _redis_scan_keys(f"{prefix}*")]
    prefix = f"{project_id}:"
    return [key.removeprefix(prefix) for key in _solve_times if key.startswith(prefix)]


def get_all_statuses(project_id: str = "global") -> list[dict[str, Any]]:
    student_ids = sorted(
        set(_get_attempt_student_ids(project_id)) | set(_get_solve_student_ids(project_id))
    )
    results: list[dict[str, Any]] = []

    for student_id in student_ids:
        entry = _load_attempt_entry(project_id, student_id)
        solve_info = _load_solve(project_id, student_id)
        remaining = max(0, int(float(entry.get("locked_until", 0)) - _now()))
        fc_score = int(solve_info.get("fc_score", 0)) if solve_info else None
        solve_time = float(solve_info.get("solve_time", 0)) if solve_info else 0.0
        was_correct = solve_info.get("was_correct") if solve_info else None

        results.append(
            {
                "student_id": student_id,
                "locked_until": _format_locked_until(float(entry.get("locked_until", 0))),
                "attempt_count": int(entry.get("count", 0)),
                "failed_count": int(entry.get("failed", 0)),
                "lockout_seconds": remaining,
                "last_fc_score": fc_score,
                "is_suspicious": suspicious_solve(fc_score or 0, solve_time),
                "was_correct": was_correct,
                "recent_attempts": entry.get("log", [])[-5:],
            }
        )

    return results


def get_active_lockouts(project_id: str = "global") -> list[dict[str, Any]]:
    return [
        status for status in get_all_statuses(project_id) if status["lockout_seconds"] > 0
    ]


def get_authenticity_records(project_id: str = "global") -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for student_id in sorted(_get_solve_student_ids(project_id)):
        solve_info = _load_solve(project_id, student_id)
        fc_score = int(solve_info.get("fc_score", 0))
        solve_time = float(solve_info.get("solve_time", 0))
        was_correct = solve_info.get("was_correct")
        records.append(
            {
                "student_id": student_id,
                "fc_score": fc_score,
                "solve_time_seconds": solve_time,
                "was_correct": was_correct,
                "flag": suspicious_solve(fc_score, solve_time),
            }
        )
    return records


def get_heatmap(project_id: str = "global") -> dict[str, dict[str, dict[str, int]]]:
    result: dict[str, dict[str, dict[str, int]]] = {}
    for student_id in sorted(_get_attempt_student_ids(project_id)):
        entry = _load_attempt_entry(project_id, student_id)
        result[student_id] = {}
        for concept in CONCEPTS:
            attempts = [e for e in entry.get("log", []) if e.get("concept") == concept]
            result[student_id][concept] = {
                "attempts": len(attempts),
                "failures": sum(1 for e in attempts if not e["success"]),
            }
    return result


def _empty_student_profile(project_id: str, student_id: str) -> dict[str, Any]:
    return {
        "student_id": student_id,
        "project_id": project_id,
        "joined_at": _now(),
        "repo_url": None,
        "total_commits": 0,
        "total_lines_added": 0,
        "category_breakdown": {
            "BACKEND": 0,
            "UI": 0,
            "DATABASE": 0,
            "TESTING": 0,
            "INFRA": 0,
            "SYSTEM_DESIGN": 0,
            "OTHER": 0,
        },
        "puzzle_stats": {"total": 0, "passed": 0, "failed": 0, "avg_solve_time": 0.0},
        "ever_flagged": False,
        "lockout_count": 0,
        "concept_heatmap": {concept: {"attempts": 0, "failures": 0} for concept in CONCEPTS},
    }


def _project_key(project_id: str) -> str:
    return f"project:{project_id}"


def _join_code_key(join_code: str) -> str:
    return f"join_code:{join_code}"


def _project_students_key(project_id: str) -> str:
    return f"project:{project_id}:students"


def _project_commits_key(project_id: str) -> str:
    return f"project:{project_id}:commits"


def _project_student_key(project_id: str, student_id: str) -> str:
    return f"project:{project_id}:student:{student_id}"


def _generate_join_code() -> str:
    import random
    import string

    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choice(alphabet) for _ in range(6))
        if load_project_by_join_code(code) is None:
            return code


def create_project(name: str, teacher_id: str) -> dict[str, Any]:
    import uuid

    project_id = str(uuid.uuid4())
    join_code = _generate_join_code()
    project = {
        "project_id": project_id,
        "name": name,
        "join_code": join_code,
        "teacher_id": teacher_id,
        "created_at": _now(),
        "students": [],
        "commit_log": [],
    }

    if _use_redis():
        client = _get_redis()
        client.set(_project_key(project_id), json.dumps(project))
        client.set(_join_code_key(join_code), project_id)
    else:
        _projects[project_id] = project
        _join_codes[join_code] = project_id

    return project


def load_project(project_id: str) -> dict[str, Any] | None:
    if _use_redis():
        client = _get_redis()
        raw = client.get(_project_key(project_id))
        return json.loads(raw) if raw else None
    project = _projects.get(project_id)
    return dict(project) if project else None


def save_project(project: dict[str, Any]) -> None:
    if _use_redis():
        client = _get_redis()
        client.set(_project_key(project["project_id"]), json.dumps(project))
        client.set(_join_code_key(project["join_code"]), project["project_id"])
        return

    _projects[project["project_id"]] = project
    _join_codes[project["join_code"]] = project["project_id"]


def load_project_by_join_code(join_code: str) -> dict[str, Any] | None:
    if _use_redis():
        client = _get_redis()
        project_id = client.get(_join_code_key(join_code.upper()))
        if not project_id:
            return None
        return load_project(project_id)

    project_id = _join_codes.get(join_code.upper())
    if not project_id:
        return None
    return load_project(project_id)


def list_projects_by_teacher(teacher_id: str) -> list[dict[str, Any]]:
    if _use_redis():
        projects = []
        for key in _redis_scan_keys("project:*"):
            if key.endswith(":students") or key.endswith(":commits"):
                continue
            raw = _get_redis().get(key)
            if not raw:
                continue
            project = json.loads(raw)
            if project.get("teacher_id") == teacher_id:
                projects.append(project)
        return sorted(projects, key=lambda value: value.get("created_at", 0), reverse=True)

    projects = [project for project in _projects.values() if project.get("teacher_id") == teacher_id]
    return sorted(projects, key=lambda value: value.get("created_at", 0), reverse=True)


def add_student_to_project(project_id: str, student_id: str) -> dict[str, Any]:
    project = load_project(project_id)
    if not project:
        raise KeyError("Project not found")

    if student_id not in project["students"]:
        project["students"].append(student_id)
        save_project(project)

    if _use_redis():
        client = _get_redis()
        raw = client.get(_project_student_key(project_id, student_id))
        if raw:
            return json.loads(raw)

        profile = _empty_student_profile(project_id, student_id)
        client.set(_project_student_key(project_id, student_id), json.dumps(profile))
        return profile

    profile_key = (project_id, student_id)
    if profile_key not in _project_students:
        _project_students[profile_key] = _empty_student_profile(project_id, student_id)
    return dict(_project_students[profile_key])


def load_student_profile(project_id: str, student_id: str) -> dict[str, Any] | None:
    if _use_redis():
        raw = _get_redis().get(_project_student_key(project_id, student_id))
        return json.loads(raw) if raw else None
    profile = _project_students.get((project_id, student_id))
    return dict(profile) if profile else None


def save_student_profile(project_id: str, student_id: str, profile: dict[str, Any]) -> None:
    if _use_redis():
        _get_redis().set(_project_student_key(project_id, student_id), json.dumps(profile))
        return
    _project_students[(project_id, student_id)] = profile


def update_student_repo_url(project_id: str, student_id: str, repo_url: str | None) -> dict[str, Any]:
    profile = load_student_profile(project_id, student_id) or add_student_to_project(project_id, student_id)
    normalized = (repo_url or "").strip() or None
    profile["repo_url"] = normalized
    save_student_profile(project_id, student_id, profile)
    return profile


def record_project_commit(project_id: str, student_id: str, commit: dict[str, Any]) -> dict[str, Any]:
    project = load_project(project_id)
    if not project:
        raise KeyError("Project not found")

    profile = load_student_profile(project_id, student_id) or add_student_to_project(project_id, student_id)
    profile["total_commits"] = int(profile.get("total_commits", 0)) + 1
    profile["total_lines_added"] = int(profile.get("total_lines_added", 0)) + int(
        commit.get("diff_summary", {}).get("lines_added", 0)
    )

    category_breakdown = profile.get("category_breakdown", {})
    commit_categories = commit.get("categories", {})
    for category, value in commit_categories.items():
        category_breakdown[category] = int(category_breakdown.get(category, 0)) + int(value)
    profile["category_breakdown"] = category_breakdown

    stats = profile.get("puzzle_stats", {"total": 0, "passed": 0, "failed": 0, "avg_solve_time": 0.0})
    if commit.get("puzzle_result") != "SKIPPED":
        stats["total"] = int(stats.get("total", 0)) + 1
        if commit.get("puzzle_result") == "PASSED":
            stats["passed"] = int(stats.get("passed", 0)) + 1
        else:
            stats["failed"] = int(stats.get("failed", 0)) + 1

        prev_total = max(0, int(stats.get("total", 1)) - 1)
        previous_avg = float(stats.get("avg_solve_time", 0.0))
        solve_time = float(commit.get("solve_time_seconds", 0.0))
        stats["avg_solve_time"] = (
            ((previous_avg * prev_total) + solve_time) / max(1, int(stats["total"]))
        )

    if commit.get("flagged"):
        profile["ever_flagged"] = True

    concept = str(commit.get("concept", "OTHER"))
    heatmap = profile.get("concept_heatmap", {})
    heatmap.setdefault(concept, {"attempts": 0, "failures": 0})
    heatmap[concept]["attempts"] += 1
    if commit.get("puzzle_result") == "FAILED":
        heatmap[concept]["failures"] += 1
        profile["lockout_count"] = int(profile.get("lockout_count", 0)) + 1
    profile["concept_heatmap"] = heatmap
    profile["puzzle_stats"] = stats

    save_student_profile(project_id, student_id, profile)

    if _use_redis():
        client = _get_redis()
        client.rpush(_project_commits_key(project_id), json.dumps(commit))
    else:
        project.setdefault("commit_log", []).append(commit)
        save_project(project)

    return commit


def get_project_commits(project_id: str) -> list[dict[str, Any]]:
    project = load_project(project_id)
    if not project:
        return []

    if _use_redis():
        raw_commits = _get_redis().lrange(_project_commits_key(project_id), 0, -1)
        return [json.loads(value) for value in raw_commits]

    return list(project.get("commit_log", []))


def get_project_students(project_id: str) -> list[dict[str, Any]]:
    project = load_project(project_id)
    if not project:
        return []

    students = []
    for student_id in project.get("students", []):
        profile = load_student_profile(project_id, student_id)
        if profile:
            students.append(profile)
    return students


def get_project_dashboard(project_id: str) -> dict[str, Any] | None:
    project = load_project(project_id)
    if not project:
        return None
    return {
        "project": {
            "project_id": project["project_id"],
            "name": project["name"],
            "join_code": project["join_code"],
            "teacher_id": project["teacher_id"],
            "created_at": project["created_at"],
            "student_count": len(project.get("students", [])),
            "commit_count": len(get_project_commits(project_id)),
        },
        "students": get_project_students(project_id),
        "commits": get_project_commits(project_id),
    }


def clear_all_state() -> None:
    if _use_redis():
        client = _get_redis()
        keys = (
            _redis_scan_keys("puzzle:*")
            + _redis_scan_keys("attempts:*")
            + _redis_scan_keys("solve:*")
            + _redis_scan_keys("project:*")
            + _redis_scan_keys("join_code:*")
        )
        if keys:
            client.delete(*keys)
        return

    _puzzles.clear()
    _attempts.clear()
    _solve_times.clear()
    _projects.clear()
    _join_codes.clear()
    _project_students.clear()
