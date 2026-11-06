"""Persist hashed reset tokens and atomically consume them."""
from app.db.database_conn import get_connection


def create_token(*, user_id: int, token_hash: str) -> None:
    with get_connection() as connection:
        connection.execute(
            """INSERT INTO password_reset_token (id_user, token_hash, expires_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP + INTERVAL '24 hours')""",
            (user_id, token_hash),
        )


def delete_token(*, token_hash: str) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM password_reset_token WHERE token_hash = %s", (token_hash,))


def consume_token(*, token_hash: str, password_hash: str) -> bool:
    with get_connection() as connection:
        # Lock the user first so simultaneous links cannot both change the password.
        user = connection.execute(
            """SELECT u.id_user FROM users u
            JOIN password_reset_token t ON t.id_user = u.id_user
            WHERE t.token_hash = %s AND u.desactive_at IS NULL
            FOR UPDATE OF u""", (token_hash,),
        ).fetchone()
        if not user:
            return False
        token = connection.execute(
            """UPDATE password_reset_token SET used_at = CURRENT_TIMESTAMP
            WHERE token_hash = %s AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
            RETURNING id_user""", (token_hash,),
        ).fetchone()
        if not token:
            return False
        connection.execute(
            """UPDATE users SET password_hash = %s, password_set_at = CURRENT_TIMESTAMP
            WHERE id_user = %s""", (password_hash, user["id_user"]),
        )
        connection.execute(
            """UPDATE password_reset_token SET used_at = CURRENT_TIMESTAMP
            WHERE id_user = %s AND used_at IS NULL""", (user["id_user"],),
        )
        return True
