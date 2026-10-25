from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.repositories.time_api import load_scope
from app.services.time_api import presence
from app.services.time_service import PARIS

router = APIRouter(prefix="/api", tags=["Teams"])


@router.get("/teams")
def teams(user: dict = Depends(get_current_user)):
    """Liste les équipes gérées et leurs indicateurs calculés sur les membres actifs.

    managerId reste le responsable principal ; les responsables supplémentaires
    bénéficient du même périmètre de lecture via team_manager.
    """
    now = datetime.now(timezone.utc)
    data = load_scope(user, now.astimezone(PARIS).date())
    statuses = {
        p["id_user"]: p for p in presence(data, now.astimezone(PARIS).date(), now)
    }
    result = []
    for t in data["teams"]:
        members = [u for u in data["users"] if u["id_team"] == t["id_team"]]
        result.append(
            {
                "id": str(t["id_team"]),
                "name": t["name"],
                "description": t["description"] or "",
                "managerId": str(t["id_user"]),
                "memberIds": [str(u["id_user"]) for u in members],
                "avgWeeklyHours": round(
                    sum(statuses[u["id_user"]]["weekly_hours"] for u in members)
                    / (len(members) or 1),
                    2,
                ),
                "attendanceRate": round(
                    sum(
                        statuses[u["id_user"]]["presence"]
                        in {"present", "remote", "late"}
                        for u in members
                    )
                    / (len(members) or 1)
                    * 100,
                    2,
                ),
            }
        )
    return result


@router.get("/directory")
def directory(user: dict = Depends(get_current_user)):
    """Adapte l’annuaire autorisé aux listes du front avec les présences du jour."""
    from app.services.dashboard_service import build_dashboard

    now = datetime.now(timezone.utc)
    day = now.astimezone(PARIS).date()
    data = load_scope(user, day)
    result = build_dashboard(data, reference_date=day, period="week", cutoff=now)[
        "users"
    ]
    statuses = {p["id_user"]: p for p in presence(data, day, now)}
    for u in result:
        p = statuses[int(u["id"])]
        u.update(
            presence=p["presence"],
            weeklyHours=p["weekly_hours"],
            lastClock=p["last_clock_at"] or "?",
        )
    return result


@router.get("/session")
def session(user: dict = Depends(get_current_user)):
    """Expose le profil connecté au front sans données d’authentification sensibles.

    Le rôle admin est présenté comme manager pour la navigation de l’interface.
    """
    return {
        "id": str(user["id_user"]),
        "firstName": user["first_name"],
        "lastName": user["last_name"],
        "email": user["email"],
        "role": "manager" if user["role"] in {"admin", "manager"} else "employee",
    }
