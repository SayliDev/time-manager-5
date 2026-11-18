"""Password reset for the authenticated account."""
import hashlib
import secrets

from app.repositories import password_reset_repository as repository
from app.services.email_service import build_reset_url, send_password_reset_email
from core.passwords import MAX_PASSWORD_BYTES, hash_password


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


def request_password_reset(*, user: dict) -> None:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    reset_url = build_reset_url(token)
    repository.create_token(user_id=user["id_user"], token_hash=token_hash)
    if not send_password_reset_email(
        to_email=user["email"], first_name=user["first_name"], reset_url=reset_url,
    ):
        repository.delete_token(token_hash=token_hash)
        raise RuntimeError("Impossible d'envoyer l'email. Veuillez réessayer plus tard.")


def reset_password(*, token: str, password: str) -> None:
    if len(password) < 8 or len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères et au maximum 72 octets.")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if not repository.consume_token(token_hash=token_hash, password_hash=hash_password(password)):
        raise ValueError("Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien depuis Mon compte.")
