from fastapi import APIRouter, HTTPException, status

from app.models.users import ResetPasswordRequest
from app.services.password_reset_service import reset_password
from core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/reset-password")
def reset_password_endpoint(payload: ResetPasswordRequest):
    user = reset_password(token=payload.token, new_password=payload.new_password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expiré",
        )

    # Meme contenu que le token du login : l'employe est connecte apres activation.
    access_token = create_access_token(
        {
            "id": str(user["id_user"]),
            "sub": str(user["id_user"]),
            "email": user["email"],
            "role": user["role"],
        }
    )
    return {
        "message": "Mot de passe défini. Vous êtes connecté.",
        "access_token": access_token,
        "token_type": "bearer",
    }
