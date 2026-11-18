from datetime import datetime, timezone


def test_users_update_last_login(db, sql_text):
    users = db.load("users_repository")
    last_login = datetime(2026, 11, 2, 9, 47, tzinfo=timezone.utc)

    users.update(42, last_login=last_login)

    assert 'set "last_login" = %s' in sql_text(db)
    assert db.cursor.execute.call_args.args[1] == (last_login, 42)
