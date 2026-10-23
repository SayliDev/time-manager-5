"""Jetons de reinitialisation de mot de passe (Psycopg 3).

Seul le hash SHA-256 du jeton est stocke, jamais le jeton lui-meme.
"""

from datetime import datetime

from app.db.database_conn import get_connection


def create(*, user_id: int, token_hash: str, expires_at: datetime) -> None:
    """Invalide les anciens jetons de l'utilisateur, puis enregistre le nouveau."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE password_reset_token
                SET used_at = CURRENT_TIMESTAMP
                WHERE id_user = %s AND used_at IS NULL
                """,
                (user_id,),
            )
            cursor.execute(
                """
                INSERT INTO password_reset_token (id_user, token_hash, expires_at)
                VALUES (%s, %s, %s)
                """,
                (user_id, token_hash, expires_at),
            )


def consume(*, token_hash: str, password_hash: str) -> bool:
    """Marque le jeton comme utilise et change le mot de passe, en une requete.

    Retourne False si le jeton est inconnu, expire ou deja utilise.
    """
    query = """
        WITH used AS (
            UPDATE password_reset_token
            SET used_at = CURRENT_TIMESTAMP
            WHERE token_hash = %s
              AND used_at IS NULL
              AND expires_at > CURRENT_TIMESTAMP
            RETURNING id_user
        )
        UPDATE users
        SET password_hash = %s,
            password_set_at = CURRENT_TIMESTAMP
        WHERE id_user IN (SELECT id_user FROM used)
          AND desactive_at IS NULL
        RETURNING id_user
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (token_hash, password_hash))
            return cursor.fetchone() is not None