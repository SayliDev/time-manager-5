from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
import traceback

from core.passwords import verify_password
from core.security import create_access_token
from core.logging import logger
from app.services.users_service import (
    get_password_hash_by_id,
    get_user_by_email,
    update_user,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):  

    if not form_data.username or not form_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur et mot de passe requis",
        )
    
    
    user = get_user_by_email(email=form_data.username)
    logger.info(
        "Login attempt for username=%s, user_found=%s",
        form_data.username,
        user is not None,
    )

    if not user or user["desactive_at"] is not None:
        logger.warning(
            "Login rejected for username=%s: user unavailable",
            form_data.username,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
        )

    if not verify_password(
        form_data.password,
        get_password_hash_by_id(user_id=user["id_user"]),
    ):
        logger.warning(
            "Login rejected for username=%s: invalid password",
            form_data.username,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
        )



    access_token = create_access_token(
        {
            "id": str(user["id_user"]),
            "sub": str(user["id_user"]),
            "email": user["email"],
            "role": user["role"],
        }
    )

    # update last login timestamp for the user if needed
    try:
        update_user(user_id=user["id_user"],last_login="now()")
    except Exception as e:
        logger.error("Failed to update last login for username=%s: %s", form_data.username, str(e))

    logger.info("Login succeeded for username=%s", form_data.username)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }