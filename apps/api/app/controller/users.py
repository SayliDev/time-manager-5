from fastapi import Depends, HTTPException, Request, status
from core.security import decode_access_token, oauth2_scheme
from jose import JWTError

# -----------------------------------------------------------------------------
# JWT
# Récupération de l'utilisateur courant à partir du token JWT.
# -----------------------------------------------------------------------------
def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
):
    token = token or request.cookies.get("access_token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        current_user = {
            "id": payload.get("id"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "team": payload.get("team"),
            "firstname": payload.get("firstname"),
            "lastname": payload.get("lastname"),
        }

        if current_user["id"] is None:
            raise credentials_exception
        # Si l'ID de l'utilisateur est présent, on considère que l'utilisateur est authentifié.
        return current_user

    except JWTError:
        raise credentials_exception

    
def require_role(required_role: str):
    def checker(
        current_user: dict = Depends(get_current_user),
    ):
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user

    return checker


def require_roles(*roles):
    def checker(
        current_user: dict = Depends(get_current_user),
    ):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions",
            )

        return current_user

    return checker