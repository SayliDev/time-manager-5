"""Shared API test fixtures."""
import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "test-only-secret-key")

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)