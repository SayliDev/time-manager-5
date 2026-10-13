"""Hachage et vérification des mots de passe (bcrypt).

Utilisé par l'inscription et par le login : on ne stocke jamais un mot de
passe en clair, uniquement son hash (colonne password_hash).
"""

import bcrypt

# bcrypt ne lit que les 72 premiers octets : on refuse plus long que cela
# plutôt que de tronquer silencieusement.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    """Retourne le hash bcrypt (avec sel intégré) du mot de passe."""
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        raise ValueError("Mot de passe trop long (72 octets maximum)")
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str | None) -> bool:
    """Vrai si le mot de passe correspond au hash. Faux si pas de hash."""
    if not password_hash:
        return False
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(raw, password_hash.encode("ascii"))
    except ValueError:
        return False