from datetime import date, datetime, timedelta
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.repositories import dashboard_repository, users_repository
from app.services.dashboard_service import build_dashboard, period_bounds
from app.services.time_service import PARIS, _midnight
from core.security import decode_access_token


router = APIRouter(tags=["Manager"])

bearer = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


def require_manager(
    request: Request,
    token: str | None = Depends(bearer),
) -> dict:
    token = token or request.cookies.get("access_token")

    try:
        payload = decode_access_token(token) if token else {}
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Connexion requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = users_repository.get_by_id(user_id)
    except psycopg.Error as error:
        raise HTTPException(
            status_code=503,
            detail="Base de données indisponible.",
        ) from error

    if not user or user["desactive_at"] is not None:
        raise HTTPException(
            status_code=401,
            detail="Compte indisponible.",
        )

    if user["role"] not in {"manager", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux managers.",
        )

    return user


@router.get("/dashboard")
def get_dashboard(
    period: Literal["week", "month"] = "week",
    team_id: int | None = Query(None, gt=0),
    reference_date: date | None = None,
    manager: dict = Depends(require_manager),
):
    now = datetime.now(PARIS)
    day = reference_date or now.date()

    if day > now.date():
        raise HTTPException(
            status_code=422,
            detail="La date de référence ne peut pas être future.",
        )

    cutoff = (
        now
        if day == now.date()
        else _midnight(day + timedelta(days=1))
    )

    start, _ = period_bounds(day, period)
    week_start, _ = period_bounds(day, "week")

    try:
        data = dashboard_repository.load_dashboard(
            reference_date=day,
            team_id=team_id,
            start_at=_midnight(min(start, week_start)),
            cutoff=cutoff,
        )
    except LookupError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error
    except psycopg.Error as error:
        raise HTTPException(
            status_code=503,
            detail="Base de données indisponible.",
        ) from error

    return build_dashboard(
        data,
        reference_date=day,
        period=period,
        cutoff=cutoff,
    )