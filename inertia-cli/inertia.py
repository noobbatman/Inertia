#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_API_BASE = "https://inertia-production-e090.up.railway.app"
ROOT_CONFIG_DIR = ".inertia"
ROOT_CONFIG_FILE = ".inertia/config"


def _run_git(args: list[str]) -> str:
    return subprocess.check_output(["git", *args], stderr=subprocess.STDOUT).decode("utf-8").strip()


def _repo_root() -> Path:
    try:
        root = _run_git(["rev-parse", "--show-toplevel"])
        return Path(root)
    except Exception:
        print("❌ Not inside a git repository.")
        sys.exit(1)


def _repo_commit_count() -> int:
    try:
        count = _run_git(["rev-list", "--count", "HEAD"])
        return int(count)
    except Exception:
        return 0


def _student_id_from_git() -> str:
    try:
        return _run_git(["config", "user.email"])
    except Exception:
        return ""


def _http_json(url: str, method: str = "GET", body: dict | None = None) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        payload = response.read().decode("utf-8")
        return json.loads(payload) if payload else {}


def _write_repo_config(repo_root: Path, project_id: str, student_id: str, api_base: str) -> None:
    config_dir = repo_root / ROOT_CONFIG_DIR
    config_dir.mkdir(parents=True, exist_ok=True)

    content = "\n".join(
        [
            f"PROJECT_ID={project_id}",
            f"STUDENT_ID={student_id}",
            f"API_BASE={api_base}",
            "PYTHON_BIN=python",
        ]
    )
    (repo_root / ROOT_CONFIG_FILE).write_text(content + "\n", encoding="utf-8")


def _install_hook(repo_root: Path) -> None:
    source_hook = repo_root / "inertia-cli" / "pre-push"
    target_hook = repo_root / ".git" / "hooks" / "pre-push"

    if not source_hook.exists():
        print(f"❌ Hook template missing at {source_hook}")
        sys.exit(1)

    target_hook.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_hook, target_hook)


def cmd_init(args: argparse.Namespace) -> None:
    repo_root = _repo_root()
    join_code = input("Enter join code: ").strip().upper()
    if not join_code:
        print("❌ Join code is required.")
        sys.exit(1)

    api_base = args.api_base.rstrip("/")

    try:
        project = _http_json(f"{api_base}/projects/{join_code}")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            print("❌ Invalid join code.")
            sys.exit(1)
        print(f"❌ Failed to validate join code: HTTP {exc.code}")
        sys.exit(1)
    except Exception as exc:
        print(f"❌ Failed to validate join code: {exc}")
        sys.exit(1)

    commit_count = _repo_commit_count()
    if commit_count > 0:
        print("❌ BLOCKED: Repo must have zero commits to join Inertia.")
        sys.exit(1)

    git_email = _student_id_from_git()
    student_id = input(f"Student ID [{git_email or 'required'}]: ").strip() or git_email
    if not student_id:
        print("❌ Student ID is required (set git user.email or type one).")
        sys.exit(1)

    try:
        joined = _http_json(
            f"{api_base}/projects/{join_code}/join",
            method="POST",
            body={"student_id": student_id},
        )
    except Exception as exc:
        print(f"❌ Failed to join project: {exc}")
        sys.exit(1)

    _write_repo_config(repo_root, joined["project_id"], student_id, api_base)
    _install_hook(repo_root)

    print(f"✓ Joined project: {project['name']} ({join_code})")
    print("✓ Inertia initialized. Every push now requires Proof-of-Thought.")


def cmd_status(args: argparse.Namespace) -> None:
    repo_root = _repo_root()
    config_path = repo_root / ROOT_CONFIG_FILE
    if not config_path.exists():
        print("Inertia is not initialized in this repository. Run: inertia init")
        return

    print(config_path.read_text(encoding="utf-8").strip())


def cmd_doctor(args: argparse.Namespace) -> None:
    repo_root = _repo_root()
    hook_path = repo_root / ".git" / "hooks" / "pre-push"
    config_path = repo_root / ROOT_CONFIG_FILE

    if config_path.exists():
        print(f"✅ Config exists: {config_path}")
    else:
        print(f"❌ Missing config: {config_path}")

    if hook_path.exists():
        print(f"✅ Hook installed: {hook_path}")
    else:
        print(f"❌ Missing hook: {hook_path}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="inertia", description="Inertia CLI")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE, help="Inertia backend base URL")
    subparsers = parser.add_subparsers(dest="command", required=False)

    subparsers.add_parser("init", help="Join a project and install pre-push hook")
    subparsers.add_parser("status", help="Print current repo Inertia config")
    subparsers.add_parser("doctor", help="Check local repo Inertia setup")

    args = parser.parse_args()

    if args.command == "init":
        cmd_init(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "doctor":
        cmd_doctor(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
