from unittest.mock import patch

from app.services.email_service import build_reset_url, send_account_created_email


def test_email_contains_identifier_and_reset_link():
    url = "http://localhost:5173/reset-password?token=abc123"
    with patch("app.services.email_service.smtplib.SMTP") as smtp_class:
        smtp = smtp_class.return_value.__enter__.return_value
        send_account_created_email(
            to_email="marie.dupont@example.com",
            first_name="Marie",
            reset_url=url,
        )

    message = smtp.send_message.call_args.args[0]
    assert message["To"] == "marie.dupont@example.com"
    body = message.get_content()
    assert "marie.dupont@example.com" in body
    assert url in body
    assert "mot de passe temporaire" not in body.lower()


def test_build_reset_url(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://tm.example.com/")
    assert build_reset_url("tok") == "https://tm.example.com/reset-password?token=tok"