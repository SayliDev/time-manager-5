from datetime import date, datetime, timedelta
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import require_management
from app.services.dashboard_service import build_dashboard, period_bounds
from app.services.time_service import PARIS, _midnight


router = APIRouter(tags=["Manager"])


@router.get("/dashboard")
def get_dashboard(
    period: Literal["week", "month"] = "week",
    team_id: int | None = Query(None, gt=0),
    reference_date: date | None = None,
    manager: dict = Depends(require_management),
):
    """Conserve la réponse agrégée historique du dashboard pour les managers.

    Applique le périmètre des équipes et interdit une référence future.
    Les nouvelles pages utilisent les routes détaillées /api/dashboard/*.
    """
    now = datetime.now(PARIS)
    day = reference_date or now.date()

    if day > now.date():
        raise HTTPException(
            status_code=422,
            detail="La date de référence ne peut pas être future.",
        )

    cutoff = now if day == now.date() else _midnight(day + timedelta(days=1))

    start, _ = period_bounds(day, period)
    week_start, _ = period_bounds(day, "week")

    try:
        from app.repositories.time_api import load_scope

        data = load_scope(manager, day, team_id)
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

    result = build_dashboard(
        data,
        reference_date=day,
        period=period,
        cutoff=cutoff,
    )
    from app.services.time_api import presence

    statuses = {p["id_user"]: p for p in presence(data, day, cutoff)}
    result["presence"] = {
        key: 0 for key in ("present", "remote", "late", "absent", "off")
    }
    for employee in result["users"]:
        state = statuses[int(employee["id"])]
        employee["presence"] = state["presence"]
        employee["weeklyHours"] = state["weekly_hours"]
        result["presence"][state["presence"]] += 1
    result["stats"]["alerts"] = (
        result["presence"]["late"] + result["presence"]["absent"]
    )
    return result
