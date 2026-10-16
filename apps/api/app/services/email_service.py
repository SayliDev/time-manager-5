import os
import smtplib
from email.message import EmailMessage


def build_reset_url(token: str) -> str:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{frontend_url}/reset-password?token={token}"


def send_account_created_email(
        *, to_email: str, first_name: str, reset_url: str
) -> None:
    message = EmailMessage()
    message["Subject"] = "Votre compte Time Manager a été créé"
    message["From"] = os.getenv("MAIL_FROM", "no-reply@timemanager.local")
    message["To"] = to_email
    message.set_content(
        f"Bonjour {first_name},\n\n"
        "Votre compte Time Manager a été créé.\n"
        f"Identifiant : {to_email}\n\n"
        "Pour choisir votre mot de passe, cliquez sur ce lien "
        "(valable 24 heures, utilisable une seule fois) :\n"
        f"{reset_url}\n"
    )

    host = os.getenv("SMTP_HOST", "mailpit")
    port = int(os.getenv("SMTP_PORT", "1025"))
    with smtplib.SMTP(host, port, timeout=10) as smtp:
        user = os.getenv("SMTP_USER")
        if user:
            smtp.starttls()
            smtp.login(user, os.getenv("SMTP_PASSWORD", ""))
        smtp.send_message(message)