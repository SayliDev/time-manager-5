from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.controller.users import get_current_user, require_roles
from app.repositories import leave_requests, team_allocations
from app.services.leave_requests_service import (
    create_leave_request,
    decide_leave_request,
)

class LeaveRequestCreate(BaseModel):
    start_at: datetime
    return_at: datetime
    reason: str | None = None
    leave_type: Literal['conge', 'maladie', 'rtt'] = 'conge'


class LeaveDecision(BaseModel):
    status: Literal['approved', 'rejected']
    decision_comment: str | None = None


router = APIRouter(prefix='/api/leave-requests', tags=['Leave requests'])


@router.post('', status_code=status.HTTP_201_CREATED)
def create_leave(
    payload: LeaveRequestCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        return create_leave_request(
            user_id=int(current_user['id']),
            start_at=payload.start_at,
            return_at=payload.return_at,
            reason=payload.reason,
            leave_type=payload.leave_type,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get('')
def get_leave_requests(
    team_id: int | None = None,
    user_id: int | None = None,
    current_user: dict[str, Any] = Depends(get_current_user),  # get id_user from JWT
):
    role = current_user.get('role')
    is_privileged_viewer = role in {'admin', 'manager'}
    visible_team_id = team_id
    if not is_privileged_viewer:
        visible_team_id = team_allocations.get_active_team_id(
            int(current_user['id'])
        )

    return leave_requests.get_all(
        viewer_id=None if role == 'admin' else int(current_user['id']),
        viewer_role=role,
        team_id=visible_team_id,
        user_id=user_id,
    )


@router.patch('/{request_id}')
def decide_leave(
    request_id: int,
    payload: LeaveDecision,
    current_user: dict[str, Any] = Depends(require_roles('admin', 'manager')),
):
    try:
        return decide_leave_request(
            request_id=request_id,
            manager_id=(
                None
                if current_user.get('role') == 'admin'
                else int(current_user['id'])
            ),
            status=payload.status,
            decision_comment=payload.decision_comment,
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error