from fastapi import APIRouter, HTTPException

from app.models.users import RegisterRequest, UserOut
from app.services.users_service import create_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_ROLE = "employe"


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest):
    try:
        return create_user(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=payload.password,
            role=DEFAULT_ROLE,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail="Email deja utilise") from exc