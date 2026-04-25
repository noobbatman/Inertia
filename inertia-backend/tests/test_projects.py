from app.storage.store import save_puzzle


def test_create_lookup_and_join_project(client):
    create_resp = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    )
    assert create_resp.status_code == 200
    project = create_resp.json()

    lookup_resp = client.get(f"/projects/{project['join_code']}")
    assert lookup_resp.status_code == 200
    assert lookup_resp.json()["project_id"] == project["project_id"]

    join_resp = client.post(
        f"/projects/{project['join_code']}/join",
        json={"student_id": "alice@uni.edu", "repo_url": "https://github.com/acme/course-repo.git"},
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["student_id"] == "alice@uni.edu"

    detail_resp = client.get(f"/projects/{project['project_id']}/students/alice%40uni.edu")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["repo_url"] == "https://github.com/acme/course-repo.git"


def test_verify_records_commit_in_project_dashboard(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()

    save_puzzle(
        "project-token-1",
        {
            "function_name": "fib",
            "question": "What is fib(1)?",
            "setup": "Given fib(1)",
            "answer": "1",
            "explanation": "Base case.",
            "student_id": "alice@uni.edu",
            "project_id": project["project_id"],
            "fc_score": 17,
            "difficulty": "EASY",
            "commit_hash": "abc123def",
            "commit_message": "add fib",
            "diff_summary": {
                "lines_added": 10,
                "lines_removed": 1,
                "files_changed": ["src/fib.py"],
            },
            "categories": {
                "BACKEND": 100,
                "TESTING": 0,
                "UI": 0,
                "DATABASE": 0,
                "INFRA": 0,
                "SYSTEM_DESIGN": 0,
                "OTHER": 0,
            },
        },
    )

    verify_resp = client.post(
        "/verify",
        json={
            "token_id": "project-token-1",
            "student_id": "alice@uni.edu",
            "project_id": project["project_id"],
            "answer": "1",
        },
    )
    assert verify_resp.status_code == 200

    dashboard_resp = client.get(f"/projects/{project['project_id']}/dashboard")
    assert dashboard_resp.status_code == 200
    payload = dashboard_resp.json()
    assert payload["project"]["commit_count"] == 1
    assert payload["students"][0]["student_id"] == "alice@uni.edu"
    assert payload["commits"][0]["commit_hash"] == "abc123def"


def test_student_commit_reconciliation_marks_missing_github_commits(client, monkeypatch):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()

    join_resp = client.post(
        f"/projects/{project['join_code']}/join",
        json={"student_id": "alice@uni.edu", "repo_url": "https://github.com/acme/course-repo"},
    )
    assert join_resp.status_code == 200

    save_puzzle(
        "project-token-2",
        {
            "function_name": "fib",
            "question": "What is fib(1)?",
            "setup": "Given fib(1)",
            "answer": "1",
            "explanation": "Base case.",
            "student_id": "alice@uni.edu",
            "project_id": project["project_id"],
            "fc_score": 17,
            "difficulty": "EASY",
            "commit_hash": "abc123d",
            "commit_message": "add fib",
            "diff_summary": {"lines_added": 10, "lines_removed": 1, "files_changed": ["src/fib.py"]},
            "categories": {
                "BACKEND": 100,
                "TESTING": 0,
                "UI": 0,
                "DATABASE": 0,
                "INFRA": 0,
                "SYSTEM_DESIGN": 0,
                "OTHER": 0,
            },
        },
    )

    verify_resp = client.post(
        "/verify",
        json={
            "token_id": "project-token-2",
            "student_id": "alice@uni.edu",
            "project_id": project["project_id"],
            "answer": "1",
        },
    )
    assert verify_resp.status_code == 200

    def fake_fetch(repo_url: str, student_id: str, per_page: int = 100):
        assert repo_url == "https://github.com/acme/course-repo"
        assert student_id == "alice@uni.edu"
        return [
            {
                "commit_hash": "abc123def999",
                "short_hash": "abc123d",
                "commit_message": "add fib",
                "timestamp": 100.0,
                "html_url": "https://github.com/acme/course-repo/commit/abc123def999",
            },
            {
                "commit_hash": "ff00112233",
                "short_hash": "ff00112",
                "commit_message": "manual github edit",
                "timestamp": 110.0,
                "html_url": "https://github.com/acme/course-repo/commit/ff00112233",
            },
        ]

    monkeypatch.setattr("app.routers.projects.fetch_student_github_commits", fake_fetch)

    resp = client.get(
        f"/projects/{project['project_id']}/students/alice%40uni.edu/commit-reconciliation"
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["inertia_commit_count"] == 1
    assert payload["github_commit_count"] == 2
    assert payload["missing_inertia_count"] == 1
    assert any(commit["source"] == "GITHUB_ONLY" for commit in payload["commits"])
