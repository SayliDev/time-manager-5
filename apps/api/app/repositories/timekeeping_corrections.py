"""CRUD des corrections de pointage avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les permissions et contrôles métier sont vérifiés dans le service.
Modifier le statut ne modifie pas automatiquement la session de travail.

Le schéma doit utiliser start_asked et
process_by REFERENCES users(id_user).
"""

from datetime import datetime
from typing import Any

from psycopg import sql
from psycopg.rows import dict_row

from app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({
    "start_asked",
    "end_asked",
    "motif",
    "status",
    "process_by",
    "id_work_session",
})


def get_all() -> list[dict[str, Any]]:
    """Retourne toutes les corrections, triées par identifiant."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.timekeeping_correction
                ORDER BY id_timekeeping_correction
                """
            )
            return cursor.fetchall()


def get_by_id(record_id: int) -> dict[str, Any] | None:
    """Retourne une correction, ou None si elle n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.timekeeping_correction
                WHERE id_timekeeping_correction = %s
                """,
                (record_id,),
            )
            return cursor.fetchone()


def create(
    *,
    id_work_session: int,
    start_asked: datetime | None = None,
    end_asked: datetime | None = None,
    motif: str | None = None,
    status: str = "en_attente",
    process_by: int | None = None,
) -> dict[str, Any]:
    """Crée une correction et retourne la ligne créée.

    PostgreSQL vérifie les clés étrangères et les contraintes de dates.
    Utiliser des datetime avec fuseau horaire pour les horaires proposés.
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO public.timekeeping_correction (
                    start_asked,
                    end_asked,
                    motif,
                    status,
                    process_by,
                    id_work_session
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    start_asked,
                    end_asked,
                    motif,
                    status,
                    process_by,
                    id_work_session,
                ),
            )

            correction = cursor.fetchone()

            if correction is None:
                raise RuntimeError(
                    "La création de la correction n'a retourné aucune ligne."
                )

            return correction


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
        UPDATE public.timekeeping_correction
        SET {}
        WHERE id_timekeeping_correction = %s
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
    """Supprime définitivement la correction ; True si elle existait."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM public.timekeeping_correction
                WHERE id_timekeeping_correction = %s
                RETURNING id_timekeeping_correction
                """,
                (record_id,),
            )
            return cursor.fetchone() is not None