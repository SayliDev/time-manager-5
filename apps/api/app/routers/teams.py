from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.repositories.time_repository import load_scope
from app.services.timekeeping_service import presence
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
