"""Optional PostgreSQL checks using only session-local temporary tables.

Run with TEST_DATABASE=1 when the project database is reachable.
"""
import os
from contextlib import nullcontext

import pytest

from app.db.database_conn import get_connection
from app.repositories import password_reset_repository as repository


@pytest.fixture
def database(monkeypatch):
    if os.getenv('TEST_DATABASE') != '1':
        pytest.skip('Set TEST_DATABASE=1 to run PostgreSQL integration checks')
    with get_connection() as connection:
        connection.execute('''CREATE TEMP TABLE users (
            id_user INTEGER PRIMARY KEY, password_hash TEXT,
            password_set_at TIMESTAMPTZ, desactive_at TIMESTAMPTZ)''')
        connection.execute('''CREATE TEMP TABLE password_reset_token (
            id_user INTEGER, token_hash TEXT UNIQUE, expires_at TIMESTAMPTZ,
            used_at TIMESTAMPTZ, creat_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)''')
        connection.execute('INSERT INTO users (id_user) VALUES (1)')
        monkeypatch.setattr(repository, 'get_connection', lambda: nullcontext(connection))
        yield connection


def test_token_can_be_consumed_once_and_invalidates_other_links(database):
    repository.create_token(user_id=1, token_hash='a' * 64)
    repository.create_token(user_id=1, token_hash='b' * 64)
    assert repository.consume_token(token_hash='a' * 64, password_hash='new-hash')
    assert not repository.consume_token(token_hash='a' * 64, password_hash='replay')
    assert not repository.consume_token(token_hash='b' * 64, password_hash='other-link')
    user = database.execute('SELECT * FROM users WHERE id_user = 1').fetchone()
    assert user['password_hash'] == 'new-hash'
    assert user['password_set_at'] is not None


@pytest.mark.parametrize('state', ['expired', 'disabled', 'missing'])
def test_invalid_tokens_do_not_change_password(database, state):
    if state != 'missing':
        repository.create_token(user_id=1, token_hash='a' * 64)
    if state == 'expired':
        database.execute("UPDATE password_reset_token SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'")
    if state == 'disabled':
        database.execute('UPDATE users SET desactive_at = CURRENT_TIMESTAMP')
    assert not repository.consume_token(token_hash='a' * 64, password_hash='should-not-be-saved')
    assert database.execute('SELECT password_hash FROM users').fetchone()['password_hash'] is None
