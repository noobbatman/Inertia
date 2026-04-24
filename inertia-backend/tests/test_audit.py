def test_trivial_commit(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    resp = client.post(
        "/audit",
        json={
            "diff": "+x = 1\n+y = 2",
            "student_id": "s1",
            "project_id": project["project_id"],
            "commit_hash": "abc123",
            "commit_message": "initial",
        },
    )
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
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    resp = client.post(
        "/audit",
        json={
            "diff": diff,
            "student_id": "s2",
            "project_id": project["project_id"],
            "commit_hash": "abc456",
            "commit_message": "recursive",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["recursive_calls"] >= 1
    assert data["requires_puzzle"] is True


def test_empty_diff(client):
    project = client.post(
        "/projects",
        json={"name": "Algorithms 2026", "teacher_id": "teacher@uni.edu"},
    ).json()
    resp = client.post(
        "/audit",
        json={
            "diff": "",
            "student_id": "s3",
            "project_id": project["project_id"],
            "commit_hash": "abc789",
            "commit_message": "empty",
        },
    )
    assert resp.status_code == 400
