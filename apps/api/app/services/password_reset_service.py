"""Password reset for the authenticated account."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.repositories import password_reset_repository as repository
from app.services.email_service import build_reset_url, send_password_reset_email
from app.models.users import check_password_rules
from core.passwords import hash_password


TOKEN_VALIDITY = timedelta(hours=24)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_reset_token(*, user_id: int) -> str:
    """Cree un jeton a usage unique ; retourne sa valeur en clair (pour le mail)."""
    token = secrets.token_urlsafe(32)
    repository.create(
        user_id=user_id,
        token_hash=_hash_token(token),
        expires_at=datetime.now(timezone.utc) + TOKEN_VALIDITY,
    )
    return token


def request_password_reset(*, user: dict) -> None:
    token = secrets.token_urlsafe(32)
    token_hash = _hash_token(token)
    reset_url = build_reset_url(token)
    repository.create(
        user_id=user["id_user"], token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + TOKEN_VALIDITY,
    )
    if not send_password_reset_email(
        to_email=user["email"], first_name=user["first_name"], reset_url=reset_url,
    ):
        repository.delete(token_hash=token_hash)
        raise RuntimeError("Impossible d'envoyer l'email. Veuillez réessayer plus tard.")


def reset_password(*, token: str, new_password: str) -> dict | None:
    check_password_rules(new_password)
    return repository.consume(
        token_hash=_hash_token(token), password_hash=hash_password(new_password),
    )
