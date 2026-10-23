from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.models.users import ResetPasswordRequest
from app.services import password_reset_service as service

REPO = "app.services.password_reset_service.password_reset_repository"


def test_reset_request_accepts_valid_password():
    request = ResetPasswordRequest(token="abc", new_password="Secret123")
    assert request.new_password == "Secret123"


@pytest.mark.parametrize("password", ["court1", "uniquementlettres", "12345678"])
def test_reset_request_rejects_weak_password(password):
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="abc", new_password=password)


def test_reset_request_rejects_password_over_72_bytes():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="abc", new_password="a1" * 40)


def test_reset_request_requires_token():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="", new_password="Secret123")


def test_create_reset_token_stores_only_the_hash():
    with patch(f"{REPO}.create") as mocked:
        token = service.create_reset_token(user_id=7)

    kwargs = mocked.call_args.kwargs
    assert kwargs["user_id"] == 7
    assert kwargs["token_hash"] == service._hash_token(token)
    assert token not in kwargs["token_hash"]
    assert len(kwargs["token_hash"]) == 64
    delta = kwargs["expires_at"] - datetime.now(timezone.utc)
    assert timedelta(hours=23, minutes=59) < delta <= timedelta(hours=24)


def test_create_reset_token_is_unpredictable():
    with patch(f"{REPO}.create"):
        first = service.create_reset_token(user_id=1)
        second = service.create_reset_token(user_id=1)
    assert first != second


def test_reset_password_hashes_token_and_password():
    with patch(f"{REPO}.consume", return_value=True) as mocked:
        assert service.reset_password(token="abc", new_password="Secret123") is True

    kwargs = mocked.call_args.kwargs
    assert kwargs["token_hash"] == service._hash_token("abc")
    assert kwargs["password_hash"] != "Secret123"
    assert kwargs["password_hash"].startswith("$argon2")


def test_reset_password_returns_false_for_invalid_token():
    with patch(f"{REPO}.consume", return_value=False):
        assert service.reset_password(token="x", new_password="Secret123") is False