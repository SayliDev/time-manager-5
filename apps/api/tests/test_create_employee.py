from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services import users_service as service
from core.security import create_access_token

client = TestClient(app)
SVC = "app.services.users_service"
MANAGER = {"id_user": 2, "role": "manager", "desactive_at": None}
CREATED = {"id_user": 10, "first_name": "Marie", "email": "m@d.fr"}
PAYLOAD = {"first_name": "Marie", "last_name": "Dupont", "email": "m@d.fr"}


def _create(send_result=True, send_error=None):
    with patch(f"{SVC}.create_user", return_value=CREATED) as create, patch(
        f"{SVC}.create_reset_token", return_value="tok"
    ) as token, patch(
        f"{SVC}.build_reset_url", return_value="http://front/reset-password?token=tok"
    ), patch(
        f"{SVC}.send_account_created_email",
        return_value=send_result,
        side_effect=send_error,
    ) as send:
        result = service.create_employee(
            first_name="Marie", last_name="Dupont", email="m@d.fr"
        )
    return result, create, token, send


def test_create_employee_uses_random_password_and_sends_link():
    (user, sent), create, token, send = _create()

    assert user == CREATED and sent is True
    password = create.call_args.kwargs["password"]
    assert len(password) == 12
    token.assert_called_once_with(user_id=10)
    send.assert_called_once_with(
        to_email="m@d.fr",
        first_name="Marie",
        reset_url="http://front/reset-password?token=tok",
    )


def test_create_employee_reports_mail_failure():
    (_, sent), *_ = _create(send_result=False)
    assert sent is False


def test_create_employee_survives_missing_frontend_url():
    (user, sent), *_ = _create(send_error=RuntimeError("FRONTEND_URL"))
    assert user == CREATED and sent is False


def test_endpoint_does_not_need_password_and_returns_email_sent():
    headers = {"Authorization": "Bearer " + create_access_token({"sub": "2"})}
    full = {
        **CREATED,
        "last_name": "Dupont",
        "role": "employe",
        "phone": None,
        "creat_at": None,
        "desactive_at": None,
    }
    with patch("app.dependencies.get_user_by_id", return_value=MANAGER), patch(
        "app.routers.users_routers.get_user_by_id", return_value=MANAGER
    ), patch("app.routers.users_routers.create_employee", return_value=(full, False)):
        response = client.post("/api/addUsers", json=PAYLOAD, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["email_sent"] is False
    assert "password" not in body and "password_hash" not in body


def test_endpoint_duplicate_email_returns_409():
    headers = {"Authorization": "Bearer " + create_access_token({"sub": "2"})}
    with patch("app.dependencies.get_user_by_id", return_value=MANAGER), patch(
        "app.routers.users_routers.get_user_by_id", return_value=MANAGER
    ), patch(
        "app.routers.users_routers.create_employee", side_effect=ValueError("doublon")
    ):
        response = client.post("/api/addUsers", json=PAYLOAD, headers=headers)
    assert response.status_code == 409
