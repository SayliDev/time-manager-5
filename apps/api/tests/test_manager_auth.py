from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt
from starlette.requests import Request

from app.routers.manager_router import require_manager
from core.security import ALGORITHM, SECRET_KEY, create_access_token


def request_with_cookie(token):
    headers = [(b"cookie", f"access_token={token}".encode())] if token else []
    return Request({"type": "http", "headers": headers})


def expired_token():
    return jwt.encode(
        {"sub": "11", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


@pytest.mark.parametrize("bearer_kind,cookie_kind", [
    ("valid", None),
    (None, "valid"),
    ("invalid", "valid"),
    ("expired", "valid"),
])
def test_manager_accepts_valid_session(bearer_kind, cookie_kind):
    tokens = {
        None: None,
        "valid": create_access_token({"sub": "11"}),
        "invalid": "stale-token",
        "expired": expired_token(),
    }
    user = {"id_user": 11, "role": "manager", "desactive_at": None}
    with patch("app.routers.manager_router.users_repository.get_by_id", return_value=user):
        assert require_manager(request_with_cookie(tokens[cookie_kind]), tokens[bearer_kind]) == user


@pytest.mark.parametrize("bearer,cookie", [(None, None), ("invalid", None), ("invalid", "invalid")])
def test_invalid_sessions_are_rejected(bearer, cookie):
    with patch("app.routers.manager_router.users_repository.get_by_id") as get_user:
        with pytest.raises(HTTPException) as error:
            require_manager(request_with_cookie(cookie), bearer)
        assert error.value.status_code == 401
        get_user.assert_not_called()


def test_employee_bearer_cannot_fall_back_to_manager_cookie():
    employee_token = create_access_token({"sub": "12"})
    manager_token = create_access_token({"sub": "11"})
    employee = {"id_user": 12, "role": "employe", "desactive_at": None}
    with patch("app.routers.manager_router.users_repository.get_by_id", return_value=employee) as get_user:
        with pytest.raises(HTTPException) as error:
            require_manager(request_with_cookie(manager_token), employee_token)
        assert error.value.status_code == 403
        get_user.assert_called_once_with(12)


@pytest.mark.parametrize("user", [None, {"role": "manager", "desactive_at": datetime.now(timezone.utc)}])
def test_missing_or_disabled_account_is_rejected(user):
    token = create_access_token({"sub": "11"})
    with patch("app.routers.manager_router.users_repository.get_by_id", return_value=user):
        with pytest.raises(HTTPException) as error:
            require_manager(request_with_cookie(token), None)
        assert error.value.status_code == 401
