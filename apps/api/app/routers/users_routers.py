
import logging

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.dependencies import ADMIN, get_current_user, require_management
from app.services.users_service import create_user, get_user_by_id, get_all_users, update_user, deactivate_user, get_user_by_email

logger = logging.getLogger(__name__)

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str = "employe"
    phone: str | None = None


class UserResponse(BaseModel):
    id_user: int
    first_name: str
    last_name: str
    email: str
    role: str
    phone: str | None = None
    creat_at: datetime | None = None
    desactive_at: datetime | None = None

router = APIRouter(
    prefix="/api",
    tags=["Users"],
    dependencies=[Depends(get_current_user)],
)


def ensure_can_manage_admin(current_user: dict[str, Any], *roles: str | None) -> None:
    """Seul un administrateur peut créer, modifier ou désactiver un administrateur."""
    if ADMIN in roles and current_user["role"] != ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un administrateur peut gérer un compte administrateur.",
        )


def get_existing_user(user_id: int) -> dict[str, Any]:
    try:
        user = get_user_by_id(user_id=user_id)
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("/addUsers",response_model=UserResponse,status_code=status.HTTP_201_CREATED,)
def create_user_endpoint(
    payload: UserCreate,
    current_user: dict[str, Any] = Depends(require_management),
):
    ensure_can_manage_admin(current_user, payload.role)

    try:
        user = create_user(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=payload.password,
            role=payload.role,
            phone=payload.phone,
        )

        return user

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

@router.get("/getUsers/{user_id}",response_model=UserResponse,status_code=status.HTTP_200_OK,)
def get_user_endpoint(user_id: int):
    user = get_existing_user(user_id)
    logger.info("User retrieved: id=%s", user_id)
    return user

@router.get("/getAllUsers",response_model=list[UserResponse],status_code=status.HTTP_200_OK,)
def get_all_users_endpoint():
    try:
        users = get_all_users()
        return users
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )

@router.delete("/deactivateUser/{user_id}",status_code=status.HTTP_204_NO_CONTENT,)
def deactivate_user_endpoint(
    user_id: int,
    current_user: dict[str, Any] = Depends(require_management),
):
    if user_id == current_user["id_user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas désactiver votre propre compte.",
        )

    target = get_existing_user(user_id)
    ensure_can_manage_admin(current_user, target["role"])

    try:
        deactivate_user(user_id=user_id)
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )
    return None

@router.put("/updateUser/{user_id}",response_model=UserResponse,status_code=status.HTTP_200_OK,)
def update_user_endpoint(
    user_id: int,
    payload: UserCreate,
    current_user: dict[str, Any] = Depends(require_management),
):
    target = get_existing_user(user_id)
    ensure_can_manage_admin(current_user, target["role"], payload.role)

    try:
        user = update_user(
            user_id=user_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=payload.password,
            role=payload.role,
            phone=payload.phone,
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )

@router.get("/userByEmail",response_model=UserResponse,status_code=status.HTTP_200_OK,)
def get_user_by_email_endpoint(email: str):
    try:
        user = get_user_by_email(email=email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )
