from app.storage.store import save_puzzle


def test_correct_answer(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    save_puzzle(
        "test-token-1",
        {
            "function_name": "fib",
            "question": "What is fib(1)?",
            "setup": "Given fib(1)",
            "answer": "1",
            "explanation": "Base case.",
            "student_id": "student_x",
            "project_id": project["project_id"],
            "fc_score": 17,
        },
    )
    resp = client.post(
        "/verify",
        json={
            "token_id": "test-token-1",
            "student_id": "student_x",
            "project_id": project["project_id"],
            "answer": "1",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["jwt_token"] is not None


def test_wrong_answer_triggers_lockout(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    save_puzzle(
        "test-token-2",
        {
            "function_name": "sort",
            "question": "arr[0] after swap?",
            "setup": "Given sort([2, 1])",
            "answer": "2",
            "explanation": "Swap.",
            "student_id": "student_y",
            "project_id": project["project_id"],
            "fc_score": 34,
        },
    )
    resp = client.post(
        "/verify",
        json={
            "token_id": "test-token-2",
            "student_id": "student_y",
            "project_id": project["project_id"],
            "answer": "99",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False
    assert data["lockout_seconds"] > 0


def test_expired_or_missing_token(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    resp = client.post(
        "/verify",
        json={
            "token_id": "nonexistent-token",
            "student_id": "student_z",
            "project_id": project["project_id"],
            "answer": "1",
        },
    )
    assert resp.status_code == 404
