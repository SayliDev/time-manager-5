"""CRUD des contrats avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les permissions métier sont vérifiées dans le service.
"""

from datetime import date
from typing import Any

from psycopg import sql
from psycopg.errors import ForeignKeyViolation
from psycopg.rows import dict_row

from apps.api.app.db.database_conn import get_connection


MODIFIABLE_FIELDS = frozenset({
    "contract_type",
    "start_date",
    "end_date",
    "id_user",
})


def get_all() -> list[dict[str, Any]]:
    """Retourne tous les contrats, triés par identifiant."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.contract
                ORDER BY id_contract
                """
            )
            return cursor.fetchall()


def get_by_id(contract_id: int) -> dict[str, Any] | None:
    """Retourne un contrat, ou None s'il n'existe pas."""
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT *
                FROM public.contract
                WHERE id_contract = %s
                """,
                (contract_id,),
            )
            return cursor.fetchone()


def create(
    *,
    start_date: date,
    id_user: int,
    contract_type: str | None = None,
    end_date: date | None = None,
) -> dict[str, Any]:
    """Crée un contrat et retourne la ligne créée.

    PostgreSQL vérifie que l'utilisateur existe et que la date
    de fin, si renseignée, est supérieure ou égale à celle de début.
    """
    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO public.contract (
                    contract_type,
                    start_date,
                    end_date,
                    id_user
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (contract_type, start_date, end_date, id_user),
            )

            contract = cursor.fetchone()

            if contract is None:
                raise RuntimeError(
                    "La création du contrat n'a retourné aucune ligne."
                )

            return contract


def update(
    contract_id: int,
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
        UPDATE public.contract
        SET {}
        WHERE id_contract = %s
        RETURNING *
        """
    ).format(assignments)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (*changes.values(), contract_id),
            )
            return cursor.fetchone()


def delete(contract_id: int) -> bool:
    """Supprime définitivement le contrat ; True s'il existait."""
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.contract
                    WHERE id_contract = %s
                    RETURNING id_contract
                    """,
                    (contract_id,),
                )
                return cursor.fetchone() is not None

    except ForeignKeyViolation as error:
        raise ValueError(
            "Suppression impossible : ce contrat est encore "
            "référencé par une autre table."
        ) from error