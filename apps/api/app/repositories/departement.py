"""CRUD des départements avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les permissions métier sont vérifiées dans le service.
"""

from typing import Any

from psycopg import sql
from psycopg.errors import ForeignKeyViolation
from psycopg.rows import dict_row

from app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({"name"})


def get_all() -> list[dict[str, Any]]:
    """Retourne tous les départements, triés par identifiant."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT id_departement, name
                FROM public.departement
                ORDER BY id_departement
                """
            )
            return cursor.fetchall()


def get_by_id(departement_id: int) -> dict[str, Any] | None:
    """Retourne un département, ou None s'il n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT id_departement, name
                FROM public.departement
                WHERE id_departement = %s
                """,
                (departement_id,),
            )
            return cursor.fetchone()


def create(name: str) -> dict[str, Any]:
    """Crée un département et retourne la ligne créée."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO public.departement (name)
                VALUES (%s)
                RETURNING id_departement, name
                """,
                (name,),
            )

            department = cursor.fetchone()

            if department is None:
                raise RuntimeError(
                    "La création du département n'a retourné aucune ligne."
                )

            return department


def update(
    departement_id: int,
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
        UPDATE public.departement
        SET {}
        WHERE id_departement = %s
        RETURNING id_departement, name
        """
    ).format(assignments)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), departement_id),
            )
            return cursor.fetchone()


def delete(departement_id: int) -> bool:
    """Supprime définitivement le département ; True s'il existait."""
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.departement
                    WHERE id_departement = %s
                    RETURNING id_departement
                    """,
                    (departement_id,),
                )
                return cursor.fetchone() is not None

    except ForeignKeyViolation as error:
        raise ValueError(
            "Suppression impossible : ce département est encore "
            "référencé par une autre table, par exemple une équipe."
        ) from error