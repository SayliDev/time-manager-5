import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.repositories import password_reset_repository
from core.passwords import hash_password

TOKEN_VALIDITY = timedelta(hours=24)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_reset_token(*, user_id: int) -> str:
    """Cree un jeton a usage unique ; retourne sa valeur en clair (pour le mail)."""
    token = secrets.token_urlsafe(32)
    password_reset_repository.create(
        user_id=user_id,
        token_hash=_hash_token(token),
        expires_at=datetime.now(timezone.utc) + TOKEN_VALIDITY,
    )
    return token


def reset_password(*, token: str, new_password: str) -> bool:
    return password_reset_repository.consume(
        token_hash=_hash_token(token),
        password_hash=hash_password(new_password),
    )