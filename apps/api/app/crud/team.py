"""CRUD des équipes avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les permissions métier sont vérifiées dans le service.
"""

from typing import Any

from psycopg import sql
from psycopg.errors import ForeignKeyViolation
from psycopg.rows import dict_row

from apps.api.app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({
    "name",
    "description",
    "id_user",
    "id_departement",
})


def get_all() -> list[dict[str, Any]]:
    """Retourne toutes les équipes, triées par identifiant."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.team
                ORDER BY id_team
                """
            )
            return cursor.fetchall()


def get_by_id(team_id: int) -> dict[str, Any] | None:
    """Retourne une équipe, ou None si elle n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.team
                WHERE id_team = %s
                """,
                (team_id,),
            )
            return cursor.fetchone()


def create(
    *,
    name: str,
    id_user: int,
    id_departement: int,
    description: str | None = None,
) -> dict[str, Any]:
    """Crée une équipe et retourne la ligne créée.

    id_user désigne le responsable de l'équipe.
    L'utilisateur et le département doivent déjà exister.
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO public.team (
                    name,
                    description,
                    id_user,
                    id_departement
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (name, description, id_user, id_departement),
            )

            team = cursor.fetchone()

            if team is None:
                raise RuntimeError(
                    "La création de l'équipe n'a retourné aucune ligne."
                )

            return team


def update(
    team_id: int,
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
        UPDATE public.team
        SET {}
        WHERE id_team = %s
        RETURNING *
        """
    ).format(assignments)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), team_id),
            )
            return cursor.fetchone()


def delete(team_id: int) -> bool:
    """Supprime définitivement l'équipe ; True si elle existait."""
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.team
                    WHERE id_team = %s
                    RETURNING id_team
                    """,
                    (team_id,),
                )
                return cursor.fetchone() is not None

    except ForeignKeyViolation as error:
        raise ValueError(
            "Suppression impossible : cette équipe est encore "
            "référencée par une autre table, par exemple une affectation."
        ) from error