from app.storage.store import record_attempt


def test_puzzle_returns_fallback_when_api_unavailable(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    diff = "\n".join(
        f"+{line}"
        for line in [
            "def fib(n):",
            "    if n <= 1:",
            "        return n",
            "    return fib(n - 1) + fib(n - 2)",
        ]
    )
    resp = client.post(
        "/puzzle",
        json={
            "diff": diff,
            "fc_score": 17,
            "difficulty": "EASY",
            "student_id": "student_x",
            "project_id": project["project_id"],
            "commit_hash": "abc123",
            "commit_message": "add fib",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_id"]
    assert data["question"]
    assert data["setup"]
    assert data["function_name"]
    assert data["timer_seconds"] == 90


def test_locked_out_student_cannot_request_puzzle(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    record_attempt(
        "student_y",
        success=False,
        fc_score=20,
        solve_time=5,
        project_id=project["project_id"],
    )
    resp = client.post(
        "/puzzle",
        json={
            "diff": "+x = 1",
            "fc_score": 20,
            "difficulty": "EASY",
            "student_id": "student_y",
            "project_id": project["project_id"],
            "commit_hash": "def456",
            "commit_message": "test lockout",
        },
    )
    assert resp.status_code == 423
