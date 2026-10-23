"""
Gestion des mots de passe.

Utilisé par l'inscription et par le login : on ne stocke jamais un mot de
passe en clair, uniquement son hash (colonne password_hash).

Responsabilités :
- Hashage des mots de passe
- Vérification des mots de passe

Algorithme :
- Argon2 via Passlib
"""
from passlib.context import CryptContext
from core.logging import logger

# ---------------------------------------------------
# bcrypt (anciennement utilisé, remplacé par argon2)
# ---------------------------------------------------

# import bcrypt

# # bcrypt ne lit que les 72 premiers octets : on refuse plus long que cela
# # plutôt que de tronquer silencieusement.
# MAX_PASSWORD_BYTES = 72


# def hash_password(password: str) -> str:
#     """Retourne le hash bcrypt (avec sel intégré) du mot de passe."""
#     raw = password.encode("utf-8")
#     if len(raw) > MAX_PASSWORD_BYTES:
#         raise ValueError("Mot de passe trop long (72 octets maximum)")
#     return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii")


# def verify_password(password: str, password_hash: str | None) -> bool:
#     """Vrai si le mot de passe correspond au hash. Faux si pas de hash."""
#     if not password_hash:
#         return False
#     raw = password.encode("utf-8")
#     if len(raw) > MAX_PASSWORD_BYTES:
#         return False
#     try:
#         return bcrypt.checkpw(raw, password_hash.encode("ascii"))
#     except ValueError:
#         return False


MAX_PASSWORD_BYTES = 72

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

#Génère un hash Argon2 pour un mot de passe.
def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"Mot de passe trop long ({MAX_PASSWORD_BYTES} octets maximum)"
        )

    return pwd_context.hash(password)

# Vérifie un mot de passe contre son hash.
def verify_password(plain_password: str,hashed_password: str | None,) -> bool:
    if not hashed_password:
        return False

    if len(plain_password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return False

    try:
        is_valid = pwd_context.verify(plain_password, hashed_password)
        logger.info("Password verification completed: valid=%s %s", is_valid, hashed_password)
        return is_valid
    except Exception:
        logger.info("Password verification completed: valid=False %s", hashed_password)
        return False