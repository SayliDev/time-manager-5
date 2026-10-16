"""
Gestion des JWT.
"""

import os

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.environ["SECRET_KEY"]

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/app/auth/login"
)

# Génère un JWT.
def create_access_token(data: dict,) -> str:
    payload = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload["exp"] = expire

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

# Décode un JWT.
def decode_access_token(token: str,) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )

# Récupère le claim 'sub'.
def get_token_subject(token: str,) -> str | None:

    try:
        payload = decode_access_token(token)

        return payload.get("sub")

    except JWTError:
        return None