from datetime import datetime, timedelta, timezone
from typing import Literal
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.repositories.time_api import load_scope
from app.services.time_api import presence, activity, hours
from app.services.dashboard_service import period_bounds, work_mode, DAY_NAMES
from app.services.time_service import PARIS

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def context(user, team_id):
    """Prépare la date de Paris, l’instant UTC et les données autorisées."""
    now = datetime.now(timezone.utc)
    day = now.astimezone(PARIS).date()
    return load_scope(user, day, team_id), day, now


def metrics(data, start, end, now):
    """Calcule présence et heures hebdomadaires moyennes sur un intervalle.

    La fin est exclusive. La présence exclut weekends et congés ; les durées
    excluent les sessions ouvertes et celles terminées après l’instant de calcul.
    """
    sessions = [s for s in data["sessions"] if s["end_at"] and s["end_at"] <= now]
    count = len(data["users"])
    # Compare equally elapsed portions of the current and previous periods.
    days = []
    d = start
    while d < end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    attended = expected = 0
    for d in days:
        for u in data["users"]:
            if any(
                leave["id_user"] == u["id_user"] and leave["start_date"] <= d <= leave["end_date"]
                for leave in data["leaves"]
            ):
                continue
            expected += 1
            attended += any(
                s["id_user"] == u["id_user"]
                and s["start_at"] <= now
                and s["start_at"].astimezone(PARIS).date() == d
                for s in data["sessions"]
            )
    return (
        round(attended / expected * 100, 2) if expected else 0,
        round(hours(sessions, start, end) / (count or 1) / max(len(days) / 5, 1), 2),
    )


@router.get("/kpis")
def kpis(
    period: Literal["week", "month"] = "week",
    team_id: int | None = Query(None, gt=0),
    user: dict = Depends(get_current_user),
):
    """Compare six périodes sur une durée écoulée comparable, bornée par période.

    La variation est relative à la période précédente ; une base nulle donne 0.
    Les alertes comptent les collaborateurs absents ou en retard aujourd’hui.
    """
    data, day, now = context(user, team_id)
    start, _ = period_bounds(day, period)
    elapsed = (day - start).days + 1
    trends = []
    cursor = start
    for _ in range(6):
        _, upper = period_bounds(cursor, period)
        trends.append(
            metrics(data, cursor, min(cursor + timedelta(days=elapsed), upper), now)
        )
        cursor = period_bounds(cursor - timedelta(days=1), period)[0]
    trends.reverse()

    def indicator(index):
        """Extrait la valeur, la variation en pourcentage et les six points de tendance."""
        values = [v[index] for v in trends]
        delta = (values[-1] - values[-2]) / values[-2] * 100 if values[-2] else 0
        return {"value": values[-1], "delta": round(delta, 2), "trend": values}

    return {
        "attendance_rate": indicator(0),
        "avg_weekly_hours": indicator(1),
        "alerts": sum(
            p["presence"] in {"late", "absent"} for p in presence(data, day, now)
        ),
    }


@router.get("/hours")
def dashboard_hours(
    period: Literal["week", "month"] = "week",
    team_id: int | None = Query(None, gt=0),
    user: dict = Depends(get_current_user),
):
    """Retourne les heures par collaborateur, ventilées par mode de travail.

    Les points sont quotidiens en vue semaine et hebdomadaires en vue mois.
    """
    data, day, now = context(user, team_id)
    start, end = period_bounds(day, period)
    sessions = [s for s in data["sessions"] if s["end_at"] and s["end_at"] <= now]
    result = []
    while start < end:
        upper = min(
            end, start + timedelta(days=1 if period == "week" else 7 - start.weekday())
        )
        result.append(
            {
                "label": DAY_NAMES[start.weekday()]
                if period == "week"
                else start.isoformat(),
                **{
                    mode: round(
                        hours(
                            [s for s in sessions if work_mode(s) == source],
                            start,
                            upper,
                        )
                        / (len(data["users"]) or 1),
                        2,
                    )
                    for mode, source in (("onsite", "present"), ("remote", "remote"))
                },
            }
        )
        start = upper
    return result


@router.get("/presence")
def dashboard_presence(
    team_id: int | None = Query(None, gt=0), user: dict = Depends(get_current_user)
):
    """Retourne les présences du jour dans le périmètre autorisé."""
    data, day, now = context(user, team_id)
    return presence(data, day, now)


@router.get("/activity")
def dashboard_activity(
    limit: int = Query(10, ge=1, le=100),
    team_id: int | None = Query(None, gt=0),
    user: dict = Depends(get_current_user),
):
    """Retourne les événements autorisés, du plus récent au plus ancien."""
    data, day, now = context(user, team_id)
    return activity(data, now, limit)
