from datetime import datetime
from typing import Any

from psycopg.rows import dict_row

from app.db.database_conn import get_connection


def create_request(
    *,
    user_id: int,
    start_at: datetime,
    return_at: datetime,
    reason: str | None,
    leave_type: str = "conge",
) -> dict[str, Any]:
    query = """
        INSERT INTO leave_request (id_user, start_at, return_at, reason, leave_type)
        SELECT %s, %s, %s, %s, %s
        WHERE NOT EXISTS (
            SELECT 1
            FROM leave_request
            WHERE id_user = %s
              AND status IN ('pending', 'approved')
              AND start_at < %s
              AND return_at > %s
        )
        RETURNING id_leave_request, id_user, start_at, return_at, reason,
                  leave_type, status, processed_by, processed_at,
                  decision_comment, created_at
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (
                    user_id,
                    start_at,
                    return_at,
                    reason,
                    leave_type,
                    user_id,
                    return_at,
                    start_at,
                ),
            )
            request = cursor.fetchone()
            if request is None:
                raise ValueError("La période chevauche une demande existante.")
            return request


def get_for_user(user_id: int) -> list[dict[str, Any]]:
    query = """
                SELECT lr.*, u.first_name, u.last_name, u.email,
                             active_team.id_team AS team_id,
                             active_team.team_name,
               processor.first_name AS processor_first_name,
               processor.last_name AS processor_last_name
        FROM leave_request AS lr
        JOIN users AS u ON u.id_user = lr.id_user
                LEFT JOIN LATERAL (
                        SELECT t.id_team, t.name AS team_name
                        FROM team_allocation AS allocation
                        JOIN team AS t ON t.id_team = allocation.id_team
                        WHERE allocation.id_user = u.id_user
                            AND allocation.start_at <= CURRENT_DATE
                            AND (allocation.end_at IS NULL OR allocation.end_at >= CURRENT_DATE)
                        ORDER BY allocation.start_at DESC
                        LIMIT 1
                ) AS active_team ON TRUE
        LEFT JOIN users AS processor ON processor.id_user = lr.processed_by
        WHERE lr.id_user = %s
        ORDER BY lr.start_at DESC, lr.id_leave_request DESC
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (user_id,))
            return cursor.fetchall()


def get_all(
    *,
    viewer_id: int | None = None,
    viewer_role: str | None = None,
    team_id: int | None = None,
    user_id: int | None = None,
) -> list[dict[str, Any]]:
    """List visible requests, including the viewer's own, with optional filters."""
    query = """
        SELECT lr.*, u.first_name, u.last_name, u.email,
               active_team.id_team AS team_id,
               active_team.team_name,
               processor.first_name AS processor_first_name,
               processor.last_name AS processor_last_name
        FROM leave_request AS lr
        JOIN users AS u ON u.id_user = lr.id_user
        LEFT JOIN LATERAL (
            SELECT t.id_team, t.name AS team_name
            FROM team_allocation AS allocation
            JOIN team AS t ON t.id_team = allocation.id_team
            WHERE allocation.id_user = u.id_user
              AND allocation.start_at <= CURRENT_DATE
              AND (allocation.end_at IS NULL OR allocation.end_at >= CURRENT_DATE)
            ORDER BY allocation.start_at DESC
            LIMIT 1
        ) AS active_team ON TRUE
        LEFT JOIN users AS processor ON processor.id_user = lr.processed_by
        WHERE (
            %s::integer IS NULL OR lr.id_user = %s::integer OR EXISTS (
                SELECT 1
                FROM team_allocation AS viewer_allocation
                JOIN users AS viewer ON viewer.id_user = viewer_allocation.id_user
                WHERE viewer_allocation.id_team = active_team.id_team
                  AND viewer_allocation.id_user = %s::integer
                  AND viewer_allocation.start_at <= CURRENT_DATE
                  AND (viewer_allocation.end_at IS NULL OR viewer_allocation.end_at >= CURRENT_DATE)
                  AND (%s::text IS DISTINCT FROM 'manager' OR viewer.role = 'manager')
            )
        )
          AND (%s::integer IS NULL OR active_team.id_team = %s::integer)
          AND (%s::integer IS NULL OR lr.id_user = %s::integer)
        ORDER BY CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END,
                 lr.start_at ASC, lr.id_leave_request ASC
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (
                    viewer_id, viewer_id, viewer_id, viewer_role,
                    team_id, team_id, user_id, user_id,
                ),
            )
            return cursor.fetchall()


def decide_request(
    *,
    request_id: int,
    manager_id: int | None,
    status: str,
    decision_comment: str | None,
) -> dict[str, Any] | None:
    query = """
        UPDATE leave_request
        SET status = %s,
            processed_by = %s,
            processed_at = CURRENT_TIMESTAMP,
            decision_comment = %s
        WHERE id_leave_request = %s
          AND status = 'pending'
          AND (%s::integer IS NULL OR id_user <> %s::integer)
          AND (
              %s::integer IS NULL OR EXISTS (
                  SELECT 1
                  FROM team_allocation AS allocation
                  JOIN team AS t ON t.id_team = allocation.id_team
                                    JOIN team_allocation AS manager_allocation
                                        ON manager_allocation.id_team = allocation.id_team
                                    JOIN users AS manager ON manager.id_user = manager_allocation.id_user
                  WHERE allocation.id_user = leave_request.id_user
                                        AND manager.id_user = %s
                                        AND manager.role = 'manager'
                    AND allocation.start_at <= CURRENT_DATE
                    AND (allocation.end_at IS NULL OR allocation.end_at >= CURRENT_DATE)
                                        AND manager_allocation.start_at <= CURRENT_DATE
                                        AND (manager_allocation.end_at IS NULL OR manager_allocation.end_at >= CURRENT_DATE)
              )
          )
        RETURNING id_leave_request, id_user, start_at, return_at, reason,
                  status, processed_by, processed_at, decision_comment,
                  created_at
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (
                    status,
                    manager_id,
                    decision_comment,
                    request_id,
                    manager_id,
                    manager_id,
                    manager_id,
                    manager_id,
                ),
            )
            return cursor.fetchone()