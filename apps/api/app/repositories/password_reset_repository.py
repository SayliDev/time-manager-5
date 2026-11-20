"""Persist hashed reset tokens and consume them in a single transaction."""
from datetime import datetime

from app.db.database_conn import get_connection


def create(*, user_id: int, token_hash: str, expires_at: datetime) -> None:
    # Existing links remain usable if delivery of the new email fails.
    with get_connection() as connection:
        connection.execute(
            """INSERT INTO password_reset_token (id_user, token_hash, expires_at)
            VALUES (%s, %s, %s)""",
            (user_id, token_hash, expires_at),
        )


def delete(*, token_hash: str) -> None:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM password_reset_token WHERE token_hash = %s", (token_hash,),
        )


def consume(*, token_hash: str, password_hash: str) -> dict | None:
    with get_connection() as connection:
        # Lock the account first so two different links cannot both change it.
        user = connection.execute(
            """SELECT u.id_user FROM users u
            JOIN password_reset_token t ON t.id_user = u.id_user
            WHERE t.token_hash = %s AND u.desactive_at IS NULL
            FOR UPDATE OF u""", (token_hash,),
        ).fetchone()
        if not user:
            return None
        token = connection.execute(
            """UPDATE password_reset_token SET used_at = CURRENT_TIMESTAMP
            WHERE token_hash = %s AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
            RETURNING id_user""", (token_hash,),
        ).fetchone()
        if not token:
            return None
        updated_user = connection.execute(
            """UPDATE users SET password_hash = %s, password_set_at = CURRENT_TIMESTAMP
            WHERE id_user = %s RETURNING id_user, email, role""",
            (password_hash, user["id_user"]),
        ).fetchone()
        connection.execute(
            """UPDATE password_reset_token SET used_at = CURRENT_TIMESTAMP
            WHERE id_user = %s AND used_at IS NULL""", (user["id_user"],),
        )
        return updated_user
