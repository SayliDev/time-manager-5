
import logging
import traceback

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.controller.users import get_current_user, require_roles
from app.services.users_service import (
    create_user,
    deactivate_user,
    get_all_users,
    get_all_users_with_details,
    get_user_by_id,
    update_user,
)
from app.services.email_service import send_account_created_email
from core.password_generator import generate_temporary_password

logger = logging.getLogger(__name__)

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str | None = None
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


class UserDetailsResponse(UserResponse):
    id_team: int | None = None
    team_name: str | None = None
    department_name: str | None = None
    weekly_hours: float
    last_clock_start: datetime | None = None
    last_clock_end: datetime | None = None
    presence: str

router = APIRouter(
    prefix="/api",
    tags=["Users"],
)


@router.post("/addUsers",response_model=UserResponse,status_code=status.HTTP_201_CREATED,)
def create_user_endpoint(
    payload: UserCreate,
    current_user: dict = Depends(require_roles("admin", "manager")),
):
    try:
        temporary_password = payload.password or generate_temporary_password()
        user = create_user(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password=temporary_password,
            role=payload.role,
            phone=payload.phone,
        )

        email_sent = send_account_created_email(
            to_email=user["email"],
            first_name=user["first_name"],
            temporary_password=temporary_password,
            cc_email=current_user.get("email"),
        )
        if not email_sent:
            logger.warning(
                "User created but account email could not be sent: %s",
                user["email"],
            )

        return user

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

@router.get("/getUsers/{user_id}",response_model=UserResponse,status_code=status.HTTP_200_OK,)
def get_user_endpoint(user_id: int):
    try:
        user = get_user_by_id(user_id=user_id)

        logger.info("User retrieved: id=%s", user_id)

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
def deactivate_user_endpoint(user_id: int):
    try:
        deactivate_user(user_id=user_id)
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )
    return None

@router.put("/updateUser/{user_id}",response_model=UserResponse,status_code=status.HTTP_200_OK,)
def update_user_endpoint(user_id: int, payload: UserCreate):
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

@router.get("/me", tags=["Authentication"])
def me_endpoint(
    current_user: str = Depends(get_current_user),
):
    return {
        "username": current_user,
        "role": current_user["role"]  # Remplacez "user" par la valeur réelle du rôle si disponible
    }

@router.get("/all/details",response_model=list[UserDetailsResponse],status_code=status.HTTP_200_OK,)
def all_users_details(
    user=Depends(require_roles("admin", "manager")),
):
    try:
        return get_all_users_with_details()
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )

