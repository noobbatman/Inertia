import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional, Tuple

from app.config import settings


def _parse_github_repo(repo_url: str) -> Optional[Tuple[str, str]]:
    value = (repo_url or "").strip()
    if not value:
        return None

    if value.startswith("git@github.com:"):
        path = value.split(":", 1)[1]
    elif value.startswith("https://github.com/") or value.startswith("http://github.com/"):
        parsed = urllib.parse.urlparse(value)
        path = parsed.path.lstrip("/")
    else:
        return None

    if path.endswith(".git"):
        path = path[:-4]

    parts = [part for part in path.split("/") if part]
    if len(parts) < 2:
        return None

    return parts[0], parts[1]


def fetch_student_github_commits(repo_url: str, student_id: str, per_page: int = 100) -> list[dict[str, Any]]:
    parsed = _parse_github_repo(repo_url)
    if not parsed:
        raise ValueError("Invalid GitHub repository URL.")

    owner, repo = parsed
    endpoint = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page={max(1, min(per_page, 100))}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "inertia-edu-commit-reconciliation",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    request = urllib.request.Request(endpoint, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(request, timeout=max(settings.API_TIMEOUT_SECONDS, 10)) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"GitHub API error ({exc.code}): {detail[:200]}") from exc
    except urllib.error.URLError as exc:
        raise ValueError(f"GitHub API unreachable: {exc.reason}") from exc

    data = json.loads(payload)
    if not isinstance(data, list):
        raise ValueError("Unexpected GitHub API response shape.")

    target_student = (student_id or "").strip().lower()
    commits: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue

        commit_obj = item.get("commit") or {}
        author_obj = commit_obj.get("author") or {}
        author_email = str(author_obj.get("email") or "").strip().lower()

        if target_student and author_email and author_email != target_student:
            continue

        sha = str(item.get("sha") or "").strip()
        if not sha:
            continue

        message = str(commit_obj.get("message") or "").splitlines()[0].strip()
        iso_timestamp = str(author_obj.get("date") or "")
        timestamp = 0.0
        if iso_timestamp:
            try:
                from datetime import datetime

                timestamp = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00")).timestamp()
            except Exception:
                timestamp = 0.0

        commits.append(
            {
                "commit_hash": sha,
                "short_hash": sha[:7],
                "commit_message": message,
                "timestamp": timestamp,
                "html_url": str(item.get("html_url") or "") or None,
            }
        )

    return commits


def reconcile_commits(
    inertia_commits: list[dict[str, Any]],
    github_commits: list[dict[str, Any]],
) -> dict[str, Any]:
    inertia_hashes = {
        str(commit.get("commit_hash", "")).strip().lower()
        for commit in inertia_commits
        if str(commit.get("commit_hash", "")).strip()
    }

    def _is_verified(sha: str) -> bool:
        normalized = sha.strip().lower()
        if not normalized:
            return False
        for known in inertia_hashes:
            if known and (normalized.startswith(known) or known.startswith(normalized)):
                return True
        return False

    merged: list[dict[str, Any]] = []

    for commit in inertia_commits:
        merged.append(
            {
                "commit_hash": str(commit.get("commit_hash", "")).strip(),
                "commit_message": str(commit.get("commit_message", "")).strip(),
                "timestamp": float(commit.get("timestamp", 0.0) or 0.0),
                "source": "INERTIA_VERIFIED",
                "verified_by_inertia": True,
                "html_url": None,
            }
        )

    for commit in github_commits:
        sha = str(commit.get("commit_hash", "")).strip()
        if not sha:
            continue
        if _is_verified(sha):
            continue

        merged.append(
            {
                "commit_hash": sha[:7],
                "commit_message": str(commit.get("commit_message", "")).strip(),
                "timestamp": float(commit.get("timestamp", 0.0) or 0.0),
                "source": "GITHUB_ONLY",
                "verified_by_inertia": False,
                "html_url": commit.get("html_url"),
            }
        )

    merged.sort(key=lambda value: float(value.get("timestamp", 0.0)), reverse=True)

    return {
        "commits": merged,
        "inertia_commit_count": len(inertia_commits),
        "github_commit_count": len(github_commits),
        "missing_inertia_count": sum(1 for commit in merged if commit["source"] == "GITHUB_ONLY"),
    }
