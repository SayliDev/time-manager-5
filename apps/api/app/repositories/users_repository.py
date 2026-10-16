"""CRUD des utilisateurs avec Psycopg 3.

Chaque fonction ouvre sa connexion via get_connection().
Les résultats excluent password_hash.
Les erreurs PostgreSQL sont propagées à l'appelant.

Les autorisations, notamment les changements de rôle, et le hachage
des mots de passe sont gérés dans le service.
"""

from typing import Any

from psycopg import sql
from psycopg.rows import dict_row

from app.db.database_conn import get_connection


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


def get_all() -> list[dict[str, Any]]:
    """Retourne tous les utilisateurs, y compris ceux désactivés."""
    query = sql.SQL(
        "SELECT {} FROM {} ORDER BY id_user"
    ).format(PUBLIC_COLUMNS, TABLE)

    with get_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            return cursor.fetchall()


def get_by_id(record_id: int) -> dict[str, Any] | None:
    """Retourne un utilisateur sans hash, ou None s'il n'existe pas."""
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
    """Crée un utilisateur et retourne ses données sans le hash.
    password_hash doit être déjà haché, ou None.
    creat_at reçoit la valeur par défaut de PostgreSQL.
    Un email déjà présent provoque une erreur UniqueViolation.
    """
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


def update(
    record_id: int,
    **changes: Any,
) -> dict[str, Any] | None:
    """Modifie les champs fournis et retourne l'utilisateur sans hash.

    Retourne None si l'utilisateur n'existe pas.
    Un champ omis reste inchangé.
    None écrit SQL NULL si la colonne le permet.
    id_user et creat_at ne sont pas modifiables.
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


def delete(record_id: int) -> bool:
    """Supprime définitivement l'utilisateur ; True s'il existait.

    Une référence depuis une autre table peut bloquer la suppression
    et provoquer une erreur PostgreSQL ForeignKeyViolation.
    Aucune suppression en cascade ici.
    """
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


def deactivate(record_id: int) -> dict[str, Any] | None:
    """Désactive le compte sans supprimer son historique.

    Conserve la date existante si le compte est déjà désactivé.
    Retourne None si l'utilisateur n'existe pas.
    Le service d'authentification doit refuser les comptes désactivés.
    """
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