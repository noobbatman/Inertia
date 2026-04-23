from app.storage.store import record_attempt


def test_puzzle_returns_fallback_when_api_unavailable(client):
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
    record_attempt("student_y", success=False, fc_score=20, solve_time=5)
    resp = client.post(
        "/puzzle",
        json={
            "diff": "+x = 1",
            "fc_score": 20,
            "difficulty": "EASY",
            "student_id": "student_y",
        },
    )
    assert resp.status_code == 423
