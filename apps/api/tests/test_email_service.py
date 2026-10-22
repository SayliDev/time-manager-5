from unittest.mock import patch

import pytest

from app.services.email_service import build_reset_url, send_account_created_email

URL = "https://tm.example.com/reset-password?token=abc123"


def _send():
    return send_account_created_email(
        to_email="marie.dupont@example.com", first_name="Marie", reset_url=URL
    )


def test_email_contains_identifier_and_reset_link():
    with patch("app.services.email_service.smtplib.SMTP") as smtp_class:
        smtp = smtp_class.return_value.__enter__.return_value
        sent = _send()

    assert sent is True
    message = smtp.send_message.call_args.args[0]
    assert message["To"] == "marie.dupont@example.com"
    body = message.get_content()
    assert "marie.dupont@example.com" in body
    assert URL in body
    assert "mot de passe temporaire" not in body.lower()


def test_send_returns_false_when_smtp_fails():
    with patch(
            "app.services.email_service.smtplib.SMTP", side_effect=ConnectionRefusedError
    ):
        assert _send() is False


def test_smtp_login_used_when_credentials_are_set(monkeypatch):
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "pass")
    with patch("app.services.email_service.smtplib.SMTP") as smtp_class:
        smtp = smtp_class.return_value.__enter__.return_value
        assert _send() is True
    smtp.starttls.assert_called_once()
    smtp.login.assert_called_once_with("user", "pass")


def test_build_reset_url_uses_frontend_url(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://tm.example.com/")
    assert build_reset_url("tok") == "https://tm.example.com/reset-password?token=tok"


def test_build_reset_url_falls_back_to_client_port(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.setenv("CLIENT_PORT", "4000")
    assert build_reset_url("tok") == "http://localhost:4000/reset-password?token=tok"


def test_build_reset_url_without_config_raises(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.delenv("CLIENT_PORT", raising=False)
    with pytest.raises(RuntimeError):
        build_reset_url("tok")