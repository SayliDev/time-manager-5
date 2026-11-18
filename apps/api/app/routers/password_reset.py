from fastapi import APIRouter, HTTPException, status

from app.models.users import ResetPasswordRequest
from app.services.password_reset_service import reset_password
from core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=8, max_length=72)


@router.post("/me/password-reset", status_code=202)
def request_reset(current_user: dict = Depends(get_current_user)):
    try:
        request_password_reset(user=current_user)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"message": "Un lien de réinitialisation a été envoyé à votre adresse email."}


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
