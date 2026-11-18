"""Read-only information for the authenticated account."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.services.users_service import get_account_managers

router = APIRouter(prefix='/api/me', tags=['Account'])


class ManagerIdentity(BaseModel):
    id_user: int
    first_name: str
    last_name: str
    email: str


@router.get('/managers', response_model=list[ManagerIdentity])
def account_managers(current_user: dict = Depends(get_current_user)):
    return get_account_managers(current_user=current_user)
