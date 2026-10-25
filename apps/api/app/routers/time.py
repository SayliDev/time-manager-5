from datetime import date, datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.repositories.time_api import load_scope, clock
from app.services.time_api import user_time, session_view
from app.services.time_service import PARIS

router = APIRouter(prefix="/api", tags=["Time"])


def time_data(user_id, start, end, user):
    """Valide la période et les droits avant de calculer les pointages d’un compte.

    Les bornes sont inclusives, limitées à 367 jours ; par défaut, le mois
    courant jusqu’à aujourd’hui. Un utilisateur hors périmètre produit 403.
    """
    now = datetime.now(timezone.utc)
    end = end or now.astimezone(PARIS).date()
    start = start or end.replace(day=1)
    if end < start or (end - start).days > 366:
        raise HTTPException(422, "P?riode invalide (367 jours maximum).")
    data = load_scope(user, end)
    if user_id not in [u["id_user"] for u in data["users"]]:
        raise HTTPException(403, "Employ? non autoris?.")
    return user_time(data, user_id, start, end, now)


@router.get("/users/{user_id}/work-sessions")
def sessions(
    user_id: int,
    start: date | None = Query(None, alias="from"),
    end: date | None = Query(None, alias="to"),
    user: dict = Depends(get_current_user),
):
    """Expose les sessions de l’employé, triées par arrivée décroissante."""
    return time_data(user_id, start, end, user)["work-sessions"]


@router.get("/users/{user_id}/hours/daily")
def daily(
    user_id: int,
    start: date | None = Query(None, alias="from"),
    end: date | None = Query(None, alias="to"),
    user: dict = Depends(get_current_user),
):
    """Expose les heures quotidiennes et leur répartition présentiel/télétravail."""
    return time_data(user_id, start, end, user)["daily"]


@router.get("/users/{user_id}/hours/weekly")
def weekly(
    user_id: int,
    start: date | None = Query(None, alias="from"),
    end: date | None = Query(None, alias="to"),
    user: dict = Depends(get_current_user),
):
    """Expose les heures et jours travaillés par semaine de la période."""
    return time_data(user_id, start, end, user)["weekly"]


@router.get("/users/{user_id}/time-summary")
def summary(
    user_id: int,
    start: date | None = Query(None, alias="from"),
    end: date | None = Query(None, alias="to"),
    user: dict = Depends(get_current_user),
):
    """Expose les totaux, l’écart à l’objectif contractuel et les anomalies."""
    return time_data(user_id, start, end, user)["time-summary"]


class ClockIn(BaseModel):
    mode: Literal["onsite", "remote"]


def clock_result(user, mode=None):
    """Applique le pointage au compte connecté et sérialise son résultat en UTC."""
    session = clock(user["id_user"], mode)
    now = datetime.now(timezone.utc)
    return session_view(session, load_scope(user, now.astimezone(PARIS).date()), now)


@router.post("/work-sessions/clock-in", status_code=201)
def clock_in(payload: ClockIn, user: dict = Depends(get_current_user)):
    """Crée une arrivée pour le compte connecté, en présentiel ou à distance."""
    return clock_result(user, payload.mode)


@router.post("/work-sessions/clock-out")
def clock_out(user: dict = Depends(get_current_user)):
    """Clôture la session ouverte du compte connecté, sans identifiant fourni."""
    return clock_result(user)
