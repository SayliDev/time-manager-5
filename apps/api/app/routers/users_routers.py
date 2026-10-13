
import logging
logger = logging.getLogger(__name__)

from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.users_service import create_user, get_user_by_id, get_all_users


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
    prefix="/app",
    tags=["Users"],
)


@router.post("/addUsers",response_model=UserResponse,status_code=status.HTTP_201_CREATED,)
def create_user_endpoint(
    payload: UserCreate,
):
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
    try:
        user = get_user_by_id(user_id=user_id)

        logger.info("User retrieved: %s", user)

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
    from app.services.users_service import deactivate_user

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
    from app.services.users_service import update_user

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
