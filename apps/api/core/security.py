from datetime import datetime, timedelta, timezone
import os
from jose import jwt

# ----------------------------------------------------
# create_access_token function for generating JWT tokens
# ----------------------------------------------------

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict):
    payload = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload["exp"] = expire

    return jwt.encode(payload, SECRET_KEY,algorithm=ALGORITHM,)