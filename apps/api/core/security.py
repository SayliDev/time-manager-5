from datetime import datetime, timedelta, timezone
import os
from jose import jwt

# ----------------------------------------------------
# create_access_token function for generating JWT tokens
# ----------------------------------------------------

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: str | dict[str, object]):
    payload = {"sub": data} if isinstance(data, str) else data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload["exp"] = expire

    return jwt.encode(payload, SECRET_KEY,algorithm=ALGORITHM,)


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )