from collections.abc import Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.services.users_service import get_user_by_id
from core.security import decode_access_token

ADMIN = "admin"
MANAGER = "manager"
EMPLOYEE = "employe"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    """Retourne l'utilisateur du token, s'il existe et n'est pas désactivé."""
    try:
        user_id = int(decode_access_token(token)["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise _unauthorized("Token invalide")

    user = get_user_by_id(user_id=user_id)

    if user is None or user["desactive_at"] is not None:
        raise _unauthorized("Compte introuvable ou désactivé")

    return user


def require_roles(*roles: str) -> Callable[..., dict[str, Any]]:
    """Restreint une route aux rôles donnés (403 sinon)."""
    allowed = frozenset(roles)

    def dependency(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        if current_user["role"] not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Droits insuffisants",
            )
        return current_user

    return dependency


# Gestion des comptes : managers et administrateurs
require_management = require_roles(ADMIN, MANAGER)
