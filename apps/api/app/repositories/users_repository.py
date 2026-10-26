"""CRUD des utilisateurs avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les résultats excluent password_hash.
Les erreurs PostgreSQL sont propagées à l'appelant.

Les autorisations, notamment les changements de rôle, et le hachage
des mots de passe sont gérés dans le service.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from psycopg import sql
from psycopg.rows import dict_row

from app.db.database_conn import get_connection
from app.services.time_service import calc_work_time


PUBLIC_COLUMNS = sql.SQL(
    "id_user, first_name, last_name, email, "
    "role, phone, creat_at, desactive_at"
)

TABLE = sql.Identifier("users")

MODIFIABLE_FIELDS = frozenset({
    "first_name",
    "last_name",
    "email",
    "password_hash",
    "role",
    "phone",
    "desactive_at",
})

# Retourne tous les utilisateurs, y compris ceux désactivés.
def get_all() -> list[dict[str, Any]]:

    query = sql.SQL(
        "SELECT {} FROM {} ORDER BY id_user"
    ).format(PUBLIC_COLUMNS, TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            return cursor.fetchall()


def get_all_with_details() -> list[dict[str, Any]]:
    """Retourne les informations nécessaires à la page Employés."""
    query = sql.SQL(
        """
        SELECT
            u.id_user,
            u.first_name,
            u.last_name,
            u.email,
            u.role,
            u.phone,
            u.creat_at,
            u.desactive_at,
            active_team.id_team,
            active_team.team_name,
            active_team.department_name,
            latest_session.start_at AS last_clock_start,
            latest_session.end_at AS last_clock_end,
            CASE
                WHEN latest_session.id_work_session IS NULL THEN 'off'
                WHEN latest_session.end_at IS NULL THEN 'present'
                ELSE 'off'
            END AS presence
        FROM users AS u
        LEFT JOIN LATERAL (
            SELECT
                t.id_team,
                t.name AS team_name,
                department.department_name
            FROM team_allocation AS allocation
            JOIN team AS t ON t.id_team = allocation.id_team
            LEFT JOIN LATERAL (
                SELECT d.name AS department_name
                FROM team_department AS assignment
                JOIN departement AS d ON d.id_departement = assignment.id_departement
                WHERE assignment.id_team = t.id_team
                  AND assignment.start_at <= CURRENT_DATE
                  AND (assignment.end_at IS NULL OR assignment.end_at >= CURRENT_DATE)
                ORDER BY assignment.start_at DESC
                LIMIT 1
            ) AS department ON TRUE
            WHERE allocation.id_user = u.id_user
              AND allocation.start_at <= CURRENT_DATE
              AND (allocation.end_at IS NULL OR allocation.end_at >= CURRENT_DATE)
            ORDER BY allocation.start_at DESC
            LIMIT 1
        ) AS active_team ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                ws.id_work_session,
                ws.start_at,
                ws.end_at
            FROM work_session AS ws
            WHERE ws.id_user = u.id_user
              AND ws.cancel_at IS NULL
            ORDER BY ws.start_at DESC
            LIMIT 1
        ) AS latest_session ON TRUE
        WHERE u.desactive_at IS NULL
        ORDER BY u.last_name, u.first_name, u.id_user
        """
    )

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            users = cursor.fetchall()

            sessions_by_user: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
            cursor.execute(
                """
                SELECT id_user, start_at, end_at, cancel_at
                FROM work_session
                WHERE cancel_at IS NULL
                """
            )
            for session in cursor.fetchall():
                sessions_by_user[session["id_user"]].append(session)

    paris_today = datetime.now(ZoneInfo("Europe/Paris")).date()
    monday = paris_today - timedelta(days=paris_today.weekday())
    end_date = paris_today + timedelta(days=1)

    for user in users:
        duration = calc_work_time(
            sessions_by_user[user["id_user"]],
            start_date=monday,
            end_date=end_date,
        )
        user["weekly_hours"] = duration.total_seconds() / 3600

    return users

#  Retourne un utilisateur sans hash, ou None s'il n'existe pas.
def get_by_id(record_id: int) -> dict[str, Any] | None:

    query = sql.SQL(
        "SELECT {} FROM {} WHERE id_user = %s"
    ).format(PUBLIC_COLUMNS, TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (record_id,))
            return cursor.fetchone()

def create(
    *,
    first_name: str,
    last_name: str,
    email: str,
    password_hash: str | None = None,
    role: str = "employe",
    phone: str | None = None,
) -> dict[str, Any]:

    query = sql.SQL(
        """
        INSERT INTO {} (
            first_name,
            last_name,
            email,
            password_hash,
            role,
            phone
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING {}
        """
    ).format(TABLE, PUBLIC_COLUMNS)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    role,
                    phone,
                ),
            )

            user = cursor.fetchone()

            if user is None:
                raise RuntimeError(
                    "La création de l'utilisateur n'a retourné aucune ligne."
                )

            return user

#   Modifie les champs fournis et retourne l'utilisateur sans hash.
#   Retourne None si l'utilisateur n'existe pas.
#   Un champ omis reste inchangé.
#   None écrit SQL NULL si la colonne le permet.
#   id_user et creat_at ne sont pas modifiables.
def update(
    record_id: int,
    **changes: Any,
) -> dict[str, Any] | None:

    if not changes:
        raise ValueError("Fournir au moins un champ à modifier.")

    invalid_fields = changes.keys() - MODIFIABLE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Champs non modifiables : {', '.join(sorted(invalid_fields))}"
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(field))
        for field in changes
    )

    query = sql.SQL(
        """
        UPDATE {}
        SET {}
        WHERE id_user = %s
        RETURNING {}
        """
    ).format(TABLE, assignments, PUBLIC_COLUMNS)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), record_id),
            )
            return cursor.fetchone()

#    Supprime définitivement l'utilisateur ; True s'il existait.
#    Une référence depuis une autre table peut bloquer la suppression
#    et provoquer une erreur PostgreSQL ForeignKeyViolation.
#    Aucune suppression en cascade ici.
def delete(record_id: int) -> bool:

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql.SQL(
                    """
                    DELETE FROM {}
                    WHERE id_user = %s
                    RETURNING id_user
                    """
                ).format(TABLE),
                (record_id,),
            )
            return cursor.fetchone() is not None

#    """Désactive le compte sans supprimer son historique.
#    Conserve la date existante si le compte est déjà désactivé.
#    Retourne None si l'utilisateur n'existe pas.
#    Le service d'authentification doit refuser les comptes désactivés.
def deactivate(record_id: int) -> dict[str, Any] | None:

    query = sql.SQL(
        """
        UPDATE {}
        SET desactive_at = COALESCE(desactive_at, CURRENT_TIMESTAMP)
        WHERE id_user = %s
        RETURNING {}
        """
    ).format(TABLE, PUBLIC_COLUMNS)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (record_id,))
            return cursor.fetchone()

#  Récupère un utilisateur par son email
def get_by_email(email: str) -> dict[str, Any] | None:
    query = sql.SQL(
        """
        SELECT {}
        FROM {}
        WHERE email = %s
        """
    ).format(PUBLIC_COLUMNS, TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (email,))
            return cursor.fetchone()    


def get_password_hash_by_id(record_id: int) -> str | None:
    query = sql.SQL(
        """
        SELECT password_hash
        FROM {}
        WHERE id_user = %s
        """
    ).format(TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (record_id,))
            result = cursor.fetchone()
            return result["password_hash"] if result else None

def get_by_oid(oid: str) -> dict[str, Any] | None:
    query = sql.SQL(
        """
        SELECT {}
        FROM {} AS u
        INNER JOIN microsoft_log AS m ON u.id_user = m.id_user
        WHERE m.oid = %s
        """
    ).format(PUBLIC_COLUMNS, TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (oid,))
            return cursor.fetchone()