def test_trivial_commit(client):
    resp = client.post("/audit", json={"diff": "+x = 1\n+y = 2", "student_id": "s1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["difficulty"] == "TRIVIAL"
    assert data["requires_puzzle"] is False


def test_recursive_commit(client):
    diff = "\n".join(
        f"+{line}"
        for line in [
            "def fib(n):",
            "    if n < 0:",
            "        raise ValueError('n must be non-negative')",
            "    if n <= 1:",
            "        return n",
            "    left = fib(n - 1)",
            "    right = fib(n - 2)",
            "    return left + right",
        ]
    )
    resp = client.post("/audit", json={"diff": diff, "student_id": "s2"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["recursive_calls"] >= 1
    assert data["requires_puzzle"] is True


def test_empty_diff(client):
    resp = client.post("/audit", json={"diff": "", "student_id": "s3"})
    assert resp.status_code == 400
