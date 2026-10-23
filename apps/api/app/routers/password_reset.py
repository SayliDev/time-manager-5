from fastapi import APIRouter, HTTPException, status

from app.models.users import ResetPasswordRequest
from app.services.password_reset_service import reset_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/reset-password")
def reset_password_endpoint(payload: ResetPasswordRequest):
    if not reset_password(token=payload.token, new_password=payload.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expiré",
        )
    return {"message": "Mot de passe défini. Vous pouvez vous connecter."}