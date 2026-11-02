"""Authentification des routes utilisateurs et du profil /me."""

from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from core.security import create_access_token

client = TestClient(app)

NOW = datetime(2026, 9, 1, tzinfo=timezone.utc)


def make_user(id_user: int, role: str, **overrides):
    return {
        "id_user": id_user,
        "first_name": "Prénom",
        "last_name": f"Nom{id_user}",
        "email": f"user{id_user}@example.com",
        "role": role,
        "phone": None,
        "creat_at": NOW,
        "desactive_at": None,
        **overrides,
    }


USERS = {
    1: make_user(1, "admin"),
    2: make_user(2, "manager"),
    3: make_user(3, "employe"),
    4: make_user(4, "employe", desactive_at=NOW),
}


def lookup(*, user_id):
    return USERS.get(user_id)


def auth(user_id: int) -> dict[str, str]:
    token = create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def users_in_db():
    with patch("app.dependencies.get_user_by_id", side_effect=lookup), patch(
        "app.routers.users_routers.get_user_by_id", side_effect=lookup
    ):
        yield


NEW_USER = {
    "first_name": "Marie",
    "last_name": "Dupont",
    "email": "marie.dupont@example.com",
    "password": "Secret123",
    "role": "employe",
}


# --- Authentification -------------------------------------------------------


@pytest.mark.parametrize(
    "method, path",
    [
        ("get", "/me"),
        ("get", "/api/getAllUsers"),
        ("get", "/api/getUsers/1"),
        ("get", "/api/userByEmail?email=a@b.c"),
        ("post", "/api/addUsers"),
        ("put", "/api/updateUser/3"),
        ("delete", "/api/deactivateUser/3"),
    ],
)
def test_routes_require_a_token(method, path):
    response = getattr(client, method)(path)
    assert response.status_code == 401


def test_invalid_token_is_rejected():
    response = client.get(
        "/api/getAllUsers", headers={"Authorization": "Bearer pas-un-jwt"}
    )
    assert response.status_code == 401


def test_token_of_unknown_user_is_rejected():
    assert client.get("/me", headers=auth(999)).status_code == 401


def test_token_of_deactivated_user_is_rejected():
    assert client.get("/me", headers=auth(4)).status_code == 401


# --- /me --------------------------------------------------------------------


def test_me_returns_the_profile_without_password():
    response = client.get("/me", headers=auth(2))

    assert response.status_code == 200
    body = response.json()
    assert body["id_user"] == 2
    assert body["role"] == "manager"
    assert body["email"] == "user2@example.com"
    assert "password_hash" not in body


# --- Lecture : tout utilisateur connecté ------------------------------------


def test_employee_can_list_users():
    with patch(
        "app.routers.users_routers.get_all_users",
        return_value=list(USERS.values()),
    ):
        response = client.get("/api/getAllUsers", headers=auth(3))
    assert response.status_code == 200


# --- Modifications : managers et administrateurs ----------------------------


def test_employee_cannot_create_user():
    with patch("app.routers.users_routers.create_user") as create:
        response = client.post("/api/addUsers", json=NEW_USER, headers=auth(3))
    assert response.status_code == 403
    create.assert_not_called()


def test_manager_can_create_employee():
    with patch(
        "app.routers.users_routers.create_user",
        side_effect=lambda **kw: make_user(10, kw["role"]),
    ):
        response = client.post("/api/addUsers", json=NEW_USER, headers=auth(2))
    assert response.status_code == 201


def test_manager_cannot_create_admin():
    with patch("app.routers.users_routers.create_user") as create:
        response = client.post(
            "/api/addUsers", json={**NEW_USER, "role": "admin"}, headers=auth(2)
        )
    assert response.status_code == 403
    create.assert_not_called()


def test_admin_can_create_admin():
    with patch(
        "app.routers.users_routers.create_user",
        side_effect=lambda **kw: make_user(10, kw["role"]),
    ):
        response = client.post(
            "/api/addUsers", json={**NEW_USER, "role": "admin"}, headers=auth(1)
        )
    assert response.status_code == 201


def test_employee_cannot_deactivate_user():
    with patch("app.routers.users_routers.deactivate_user") as deactivate:
        response = client.delete("/api/deactivateUser/2", headers=auth(3))
    assert response.status_code == 403
    deactivate.assert_not_called()


def test_manager_can_deactivate_employee():
    with patch("app.routers.users_routers.deactivate_user") as deactivate:
        response = client.delete("/api/deactivateUser/3", headers=auth(2))
    assert response.status_code == 204
    deactivate.assert_called_once_with(user_id=3)


def test_manager_cannot_deactivate_admin():
    with patch("app.routers.users_routers.deactivate_user") as deactivate:
        response = client.delete("/api/deactivateUser/1", headers=auth(2))
    assert response.status_code == 403
    deactivate.assert_not_called()


def test_user_cannot_deactivate_own_account():
    with patch("app.routers.users_routers.deactivate_user") as deactivate:
        response = client.delete("/api/deactivateUser/2", headers=auth(2))
    assert response.status_code == 400
    deactivate.assert_not_called()


def test_deactivating_unknown_user_returns_404():
    with patch("app.routers.users_routers.deactivate_user") as deactivate:
        response = client.delete("/api/deactivateUser/999", headers=auth(2))
    assert response.status_code == 404
    deactivate.assert_not_called()


def test_manager_cannot_promote_to_admin():
    with patch("app.routers.users_routers.update_user") as update:
        response = client.put(
            "/api/updateUser/3", json={**NEW_USER, "role": "admin"}, headers=auth(2)
        )
    assert response.status_code == 403
    update.assert_not_called()
