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
        json={"student_id": "alice@uni.edu"},
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["student_id"] == "alice@uni.edu"


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
