import pytest
from pydantic import ValidationError

from app.models.users import ResetPasswordRequest


def test_reset_request_accepts_valid_password():
    request = ResetPasswordRequest(token="abc", new_password="Secret123")
    assert request.new_password == "Secret123"


@pytest.mark.parametrize("password", ["court1", "uniquementlettres", "12345678"])
def test_reset_request_rejects_weak_password(password):
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="abc", new_password=password)


def test_reset_request_requires_token():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="", new_password="Secret123")