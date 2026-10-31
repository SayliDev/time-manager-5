"""Scoped reads and atomic clock operations."""

from datetime import datetime, timezone
from fastapi import HTTPException
from app.db.database_conn import get_connection


def load_scope(user, day, team_id=None):
    """Charge uniquement les données accessibles au compte à la date demandée.

    Un employé accède à lui-même ; un manager à ses équipes principales ou
    supplémentaires et à lui-même ; un admin aux comptes actifs. Un filtre
    d’équipe non autorisé produit 403. L’affectation retenue est la plus récente
    encore active ce jour-là ; les sessions annulées sont exclues.
    """
    with get_connection() as conn:
        teams = _load_allowed_teams(conn, user, team_id)
        users = _load_scope_users(conn, user, day, team_id, teams)
        timekeeping = _load_timekeeping_data(conn, users)
    return {"users": users, "teams": teams, **timekeeping}


def _load_allowed_teams(conn, user, team_id):
    """Load permitted teams and reject an unauthorized team filter."""
    teams = conn.execute("SELECT * FROM team ORDER BY name").fetchall()
    additional_team_ids = set()
    if user["role"] == "manager":
        additional_team_ids = {
            row["id_team"]
            for row in conn.execute(
                "SELECT id_team FROM team_manager WHERE id_user=%s",
                (user["id_user"],),
            ).fetchall()
        }
    allowed = [
        t
        for t in teams
        if user["role"] == "admin"
        or (
            user["role"] == "manager"
            and (
                t["id_user"] == user["id_user"]
                or t["id_team"] in additional_team_ids
            )
        )
    ]
    if team_id is not None and not any(t["id_team"] == team_id for t in allowed):
        raise HTTPException(403, "Équipe non autorisée.")
    if team_id is not None:
        allowed = [t for t in allowed if t["id_team"] == team_id]
    return allowed


def _load_scope_users(conn, user, day, team_id, teams):
    """Select active users using their latest allocation on the requested day."""
    ids = [team["id_team"] for team in teams]
    return conn.execute(
        """
        SELECT u.id_user, u.first_name, u.last_name, u.email, u.phone, u.role,
               a.id_team, t.name AS team_name
        FROM users u
        LEFT JOIN LATERAL (SELECT id_team FROM team_allocation
            WHERE id_user=u.id_user AND start_at<=%(day)s
            AND (end_at IS NULL OR end_at>=%(day)s)
            ORDER BY start_at DESC, id_team_allocation DESC LIMIT 1) a ON TRUE
        LEFT JOIN team t ON t.id_team=a.id_team
        WHERE u.desactive_at IS NULL AND (
            (%(admin)s AND (%(team)s::integer IS NULL OR a.id_team=%(team)s))
            OR (NOT %(admin)s AND (a.id_team=ANY(%(ids)s)
                OR (%(team)s::integer IS NULL AND u.id_user=%(self)s))))
        ORDER BY u.last_name, u.first_name
    """,
        {
            "day": day,
            "admin": user["role"] == "admin",
            "team": team_id,
            "ids": ids,
            "self": user["id_user"],
        },
    ).fetchall()


def _load_timekeeping_data(conn, users):
    """Load sessions, contracts and leave for the selected users."""
    if not users:
        return {"sessions": [], "contracts": [], "leaves": []}
    user_ids = [u["id_user"] for u in users]
    sessions = conn.execute(
        "SELECT * FROM work_session WHERE id_user=ANY(%s) AND cancel_at IS NULL ORDER BY start_at",
        (user_ids,),
    ).fetchall()
    contracts = conn.execute(
        "SELECT * FROM contract WHERE id_user=ANY(%s) ORDER BY start_date DESC, id_contract DESC",
        (user_ids,),
    ).fetchall()
    leaves = conn.execute(
        "SELECT * FROM leave_absence WHERE id_user=ANY(%s)", (user_ids,)
    ).fetchall()
    return {
        "sessions": sessions,
        "contracts": contracts,
        "leaves": leaves,
    }


def clock(user_id, mode=None):
    """Enregistre une arrivée si mode est fourni, sinon clôture la session ouverte.

    Le verrou sur l’utilisateur sérialise aussi deux arrivées simultanées, même
    si aucune session n’existe encore. Une arrivée en double ou un départ sans
    session ouverte renvoie 409 ; le contexte annule alors la transaction.
    """
    with get_connection() as conn:
        # Serialize operations for this employee, including concurrent arrivals.
        conn.execute(
            "SELECT id_user FROM users WHERE id_user=%s FOR UPDATE", (user_id,)
        )
        active = conn.execute(
            "SELECT * FROM work_session WHERE id_user=%s AND end_at IS NULL AND cancel_at IS NULL FOR UPDATE",
            (user_id,),
        ).fetchall()
        if mode is not None:
            if active:
                raise HTTPException(409, "Une session est déjà en cours.")
            return conn.execute(
                "INSERT INTO work_session(id_user, work_mode, start_at) VALUES (%s,%s,%s) RETURNING *",
                (user_id, mode, datetime.now(timezone.utc)),
            ).fetchone()
        if not active:
            raise HTTPException(409, "Aucune session en cours.")
        return conn.execute(
            "UPDATE work_session SET end_at=%s WHERE id_work_session=%s RETURNING *",
            (datetime.now(timezone.utc), active[-1]["id_work_session"]),
        ).fetchone()
