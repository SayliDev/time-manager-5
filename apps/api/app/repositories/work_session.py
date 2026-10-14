"""CRUD des sessions de travail avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les permissions et contrôles métier sont vérifiés dans le service.
"""

from datetime import datetime
from typing import Any

from psycopg import sql
from psycopg.errors import ForeignKeyViolation
from psycopg.rows import dict_row

from apps.api.app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({
    "start_at",
    "end_at",
    "cancel_at",
    "id_user",
})


def get_all() -> list[dict[str, Any]]:
    """Retourne toutes les sessions, y compris celles annulées."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.work_session
                ORDER BY id_work_session
                """
            )
            return cursor.fetchall()


def get_by_id(session_id: int) -> dict[str, Any] | None:
    """Retourne une session, ou None si elle n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.work_session
                WHERE id_work_session = %s
                """,
                (session_id,),
            )
            return cursor.fetchone()


def create(
    *,
    start_at: datetime,
    id_user: int,
    end_at: datetime | None = None,
    cancel_at: datetime | None = None,
) -> dict[str, Any]:
    """Crée une session et retourne la ligne créée.

    L'utilisateur doit déjà exister.
    end_at=None représente une session ouverte.
    creat_at reçoit la valeur par défaut de PostgreSQL.
    Utiliser des datetime avec fuseau horaire.
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO public.work_session (
                    start_at,
                    end_at,
                    cancel_at,
                    id_user
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (start_at, end_at, cancel_at, id_user),
            )

            session = cursor.fetchone()

            if session is None:
                raise RuntimeError(
                    "La création de la session n'a retourné aucune ligne."
                )

            return session


def update(
    session_id: int,
    **changes: Any,
) -> dict[str, Any] | None:
    """Modifie les champs fournis et retourne la ligne, ou None.

    Un champ omis reste inchangé.
    None écrit SQL NULL si la colonne le permet.
    id_work_session et creat_at ne sont pas modifiables.
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
        UPDATE public.work_session
        SET {}
        WHERE id_work_session = %s
        RETURNING *
        """
    ).format(assignments)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), session_id),
            )
            return cursor.fetchone()


def delete(session_id: int) -> bool:
    """Supprime définitivement la session ; True si elle existait."""
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.work_session
                    WHERE id_work_session = %s
                    RETURNING id_work_session
                    """,
                    (session_id,),
                )
                return cursor.fetchone() is not None

    except ForeignKeyViolation as error:
        raise ValueError(
            "Suppression impossible : cette session est encore "
            "référencée par une autre table, par exemple une "
            "correction de pointage."
        ) from error