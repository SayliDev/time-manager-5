from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.services.password_reset_service import request_password_reset, reset_password

router = APIRouter(prefix="/api", tags=["Account"])


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


@router.post("/auth/reset-password")
def confirm_reset(payload: ResetPasswordRequest):
    try:
        reset_password(token=payload.token, password=payload.password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"message": "Votre mot de passe a été modifié. Vous pouvez vous connecter."}
