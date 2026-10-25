"""Routes de consultation des pointages pour les managers."""

from datetime import date, datetime, timedelta

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.services.dashboard_service import period_bounds
from app.services.time_service import PARIS, _midnight
from app.services.timekeeping_service import build_timekeeping

router = APIRouter(tags=["Manager"])


@router.get("/timekeeping")
def get_timekeeping_endpoint(
    user_id: int | None = Query(None, gt=0),
    start_date: date | None = None,
    end_date: date | None = None,
    reference_date: date | None = None,
    manager: dict = Depends(get_current_user),
):
    """Maintient le format historique agrégé de la page Pointages.

    Vérifie les dates et l’employé sélectionné dans le périmètre accessible.
    Les règles de statut et les totaux viennent du service commun time_api.
    """
    now = datetime.now(PARIS)
    reference_day = reference_date or now.date()
    if reference_day > now.date():
        raise HTTPException(422, "La date de référence ne peut pas être future.")
    period_start = start_date or period_bounds(reference_day, "month")[0]
    period_end = end_date or reference_day
    if period_end < period_start or (period_end - period_start).days > 366:
        raise HTTPException(
            422,
            "Choisissez une période de 367 jours maximum, dans l’ordre chronologique.",
        )
    cutoff = (
        now
        if reference_day == now.date()
        else _midnight(reference_day + timedelta(days=1))
    )
    try:
        from app.repositories.time_api import load_scope

        data = load_scope(manager, reference_day)
    except psycopg.Error as error:
        raise HTTPException(503, "Base de données indisponible.") from error
    users = [
        {
            "id": str(user["id_user"]),
            "firstName": user["first_name"],
            "lastName": user["last_name"],
        }
        for user in data["users"]
    ]
    selected_user_id = (
        str(user_id) if user_id is not None else (users[0]["id"] if users else None)
    )
    if user_id is not None and not any(
        user["id"] == selected_user_id for user in users
    ):
        raise HTTPException(403, "Employé introuvable.")
    data["sessions"] = [
        session
        for session in data["sessions"]
        if str(session["id_user"]) == selected_user_id
    ]
    from app.services.time_api import user_time

    projected = (
        user_time(data, int(selected_user_id), period_start, period_end, cutoff)
        if selected_user_id
        else None
    )
    legacy = build_timekeeping(data, period_start, period_end, cutoff)
    if projected:

        def local_time(instant):
            """Convertit un instant ISO UTC en heure de Paris ; conserve une valeur absente."""
            return (
                datetime.fromisoformat(instant.replace("Z", "+00:00"))
                .astimezone(PARIS)
                .strftime("%H:%M")
                if instant
                else None
            )

        legacy["entries"] = [
            {
                "id": str(e["id_work_session"]),
                "date": e["date"],
                "arrival": local_time(e["start_at"]),
                "departure": local_time(e["end_at"]),
                "hours": e["hours"] or 0,
                "status": e["status"],
                "mode": e["mode"],
            }
            for e in projected["work-sessions"]
        ]
        summary = projected["time-summary"]
        legacy["stats"].update(
            total=summary["total_hours"],
            averageWeeklyHours=summary["avg_weekly_hours"],
            aboveTargetHours=summary["overtime_hours"],
        )
    return {
        **legacy,
        "users": users,
        "selectedId": selected_user_id,
        "startDate": period_start.isoformat(),
        "endDate": period_end.isoformat(),
    }
