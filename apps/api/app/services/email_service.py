import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _frontend_url() -> str:
    url = os.getenv("FRONTEND_URL")
    if url:
        return url.rstrip("/")
    port = os.getenv("CLIENT_PORT")  # déjà présent dans le .env
    if port:
        return f"http://localhost:{port}"
    raise RuntimeError("FRONTEND_URL (ou CLIENT_PORT) doit etre defini")


def build_reset_url(token: str) -> str:
    return f"{_frontend_url()}/reset-password?token={token}"


def send_account_created_email(
    *,
    to_email: str,
    first_name: str,
    reset_url: str | None = None,
    temporary_password: str | None = None,
    cc_email: str | None = None,
) -> bool:
    """Envoie le mail de création de compte. True si envoyé, False sinon."""
    message = EmailMessage()
    message["Subject"] = "Votre compte Time Manager a été créé"
    message["From"] = os.getenv("MAIL_FROM", "no-reply@timemanager.local")
    message["To"] = to_email
    if cc_email and cc_email != to_email:
        message["Cc"] = cc_email

    content = [
        f"Bonjour {first_name},",
        "",
        "Votre compte Time Manager a été créé.",
        f"Identifiant : {to_email}",
    ]
    if temporary_password:
        content.extend([
            "",
            f"Mot de passe temporaire : {temporary_password}",
            "Nous vous recommandons de le modifier après votre première connexion.",
        ])
    if reset_url:
        content.extend([
            "",
            "Pour choisir votre mot de passe, cliquez sur ce lien "
            "(valable 24 heures, utilisable une seule fois) :",
            reset_url,
        ])
    message.set_content("\n".join(content) + "\n")

    try:
        host = os.getenv("SMTP_HOST", "mailpit")
        port = int(os.getenv("SMTP_PORT", "1025"))
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            user = os.getenv("SMTP_USER")
            if user:
                smtp.starttls()
                smtp.login(user, os.getenv("SMTP_PASSWORD", ""))
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError, ValueError):
        # On ne journalise jamais le lien (il contient le jeton).
        logger.exception("Echec de l'envoi du mail de creation de compte")
        return False
    return True