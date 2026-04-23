import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage.store import clear_all_state


@pytest.fixture(autouse=True)
def reset_state():
    clear_all_state()
    yield
    clear_all_state()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
