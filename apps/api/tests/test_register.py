from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID = {
    "first_name": "Marie",
    "last_name": "Dupont",
    "email": "Marie.Dupont@Example.com",
    "password": "Secret123",
}


def fake_user(**kwargs):
    return {
        "id_user": 1,
        "first_name": kwargs["first_name"],
        "last_name": kwargs["last_name"],
        "email": kwargs["email"],
        "role": kwargs["role"],
        "phone": None,
        "creat_at": datetime.now(timezone.utc),
        "desactive_at": None,
    }


def test_register_creates_employee():
    with patch(
            "app.routers.register.create_user",
            side_effect=lambda **kw: fake_user(**kw),
    ) as mocked:
        response = client.post("/api/auth/register", json={**VALID, "role": "rh"})

    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "employe"
    assert "password" not in body
    assert "password_hash" not in body
    kwargs = mocked.call_args.kwargs
    assert kwargs["role"] == "employe"
    assert kwargs["email"] == "marie.dupont@example.com"


def test_register_duplicate_email_returns_409():
    with patch("app.routers.register.create_user", side_effect=ValueError("dup")):
        response = client.post("/api/auth/register", json=VALID)
    assert response.status_code == 409


@pytest.mark.parametrize("password", ["court1", "uniquementlettres", "12345678"])
def test_register_rejects_weak_password(password):
    with patch("app.routers.register.create_user") as mocked:
        response = client.post("/api/auth/register", json={**VALID, "password": password})
    assert response.status_code == 422
    mocked.assert_not_called()


def test_register_rejects_invalid_email():
    response = client.post("/api/auth/register", json={**VALID, "email": "pas-un-email"})
    assert response.status_code == 422