"""CRUD des affectations aux équipes avec Psycopg 3.

Chaque fonction ouvre sa propre connexion via get_connection().
Les erreurs PostgreSQL sont propagées à l'appelant.
Les contrôles métier et les autorisations restent dans les services.
"""

from datetime import date
from typing import Any

from psycopg import sql
from psycopg.rows import dict_row

from apps.api.app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({
    "start_at",
    "end_at",
    "id_user",
    "id_team",
})


def get_all() -> list[dict[str, Any]]:
    """Retourne toutes les affectations, triées par identifiant."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM team_allocation
                ORDER BY id_team_allocation
                """
            )
            return cursor.fetchall()


def get_by_id(record_id: int) -> dict[str, Any] | None:
    """Retourne une affectation, ou None si elle n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM team_allocation
                WHERE id_team_allocation = %s
                """,
                (record_id,),
            )
            return cursor.fetchone()


def create(
    *,
    id_user: int,
    id_team: int,
    start_at: date,
    end_at: date | None = None,
) -> dict[str, Any]:
    """Crée une affectation et retourne la ligne créée."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO team_allocation (
                    start_at,
                    end_at,
                    id_user,
                    id_team
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (start_at, end_at, id_user, id_team),
            )

            allocation = cursor.fetchone()

            if allocation is None:
                raise RuntimeError(
                    "La création de l'affectation n'a retourné aucune ligne."
                )

            return allocation


def update(
    record_id: int,
    **changes: Any,
) -> dict[str, Any] | None:
    """Modifie les champs fournis et retourne la ligne, ou None.

    Un champ omis reste inchangé.
    None écrit SQL NULL si la colonne le permet.
    """
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
        UPDATE team_allocation
        SET {}
        WHERE id_team_allocation = %s
        RETURNING *
        """
    ).format(assignments)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), record_id),
            )
            return cursor.fetchone()


def delete(record_id: int) -> bool:
    """Supprime définitivement l'affectation ; True si elle existait."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM team_allocation
                WHERE id_team_allocation = %s
                RETURNING id_team_allocation
                """,
                (record_id,),
            )
            return cursor.fetchone() is not None