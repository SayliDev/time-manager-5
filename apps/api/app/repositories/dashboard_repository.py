from datetime import date, datetime

from app.db.database_conn import get_connection


def load_dashboard(
    *,
    reference_date: date,
    team_id: int | None,
    start_at: datetime,
    cutoff: datetime,
) -> dict:
    """Charge un instantané cohérent des équipes, utilisateurs et sessions.

    Les affectations sont évaluées à reference_date et les sessions avant cutoff.
    Cette lecture historique ne vérifie pas les droits du demandeur : les routes
    actuelles utilisent load_scope pour appliquer les autorisations.
    """
    with get_connection() as connection:
        connection.execute(
            "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
        )

        teams = connection.execute(
            """
            SELECT id_team, name
            FROM public.team
            ORDER BY name, id_team
            """
        ).fetchall()

        if team_id is not None and not any(
            team["id_team"] == team_id for team in teams
        ):
            raise LookupError("Équipe introuvable.")

        users = connection.execute(
            """
            SELECT
                u.id_user,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                allocation.id_team,
                t.name AS team_name
            FROM public.users u
            LEFT JOIN LATERAL (
                SELECT a.id_team
                FROM public.team_allocation a
                WHERE a.id_user = u.id_user
                  AND a.start_at <= %(day)s
                  AND (
                      a.end_at IS NULL
                      OR a.end_at >= %(day)s
                  )
                ORDER BY a.start_at DESC, a.id_team_allocation DESC
                LIMIT 1
            ) allocation ON TRUE
            LEFT JOIN public.team t
                ON t.id_team = allocation.id_team
            WHERE u.creat_at < %(cutoff)s
              AND (
                  u.desactive_at IS NULL
                  OR u.desactive_at >= %(cutoff)s
              )
              AND (
                  %(team)s::integer IS NULL
                  OR allocation.id_team = %(team)s
              )
            ORDER BY u.last_name, u.first_name, u.id_user
            """,
            {
                "day": reference_date,
                "cutoff": cutoff,
                "team": team_id,
            },
        ).fetchall()

        sessions = connection.execute(
            """
            SELECT
                id_work_session,
                id_user,
                start_at,
                end_at,
                cancel_at,
                work_mode
            FROM public.work_session
            WHERE id_user = ANY(%s)
              AND cancel_at IS NULL
              AND start_at < %s
              AND (
                  end_at IS NULL
                  OR end_at > %s
              )
            ORDER BY start_at, id_work_session
            """,
            (
                [user["id_user"] for user in users],
                cutoff,
                start_at,
            ),
        ).fetchall()

    return {
        "teams": teams,
        "users": users,
        "sessions": sessions,
    }