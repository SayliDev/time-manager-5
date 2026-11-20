"""Optional PostgreSQL checks using only session-local temporary tables.

Run with TEST_DATABASE=1 when the project database is reachable.
"""
import os
from datetime import datetime, timedelta, timezone
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
            password_set_at TIMESTAMPTZ, desactive_at TIMESTAMPTZ,
            email TEXT DEFAULT 'test@example.com', role TEXT DEFAULT 'employe')''')
        connection.execute('''CREATE TEMP TABLE password_reset_token (
            id_user INTEGER, token_hash TEXT UNIQUE, expires_at TIMESTAMPTZ,
            used_at TIMESTAMPTZ, creat_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)''')
        connection.execute('INSERT INTO users (id_user) VALUES (1)')
        monkeypatch.setattr(repository, 'get_connection', lambda: nullcontext(connection))
        yield connection


def test_token_can_be_consumed_once_and_invalidates_other_links(database):
    repository.create(user_id=1, token_hash='a' * 64, expires_at=datetime.now(timezone.utc) + timedelta(hours=24))
    repository.create(user_id=1, token_hash='b' * 64, expires_at=datetime.now(timezone.utc) + timedelta(hours=24))
    assert repository.consume(token_hash='a' * 64, password_hash='new-hash')
    assert not repository.consume(token_hash='a' * 64, password_hash='replay')
    assert not repository.consume(token_hash='b' * 64, password_hash='other-link')
    user = database.execute('SELECT * FROM users WHERE id_user = 1').fetchone()
    assert user['password_hash'] == 'new-hash'
    assert user['password_set_at'] is not None


@pytest.mark.parametrize('state', ['expired', 'disabled', 'missing'])
def test_invalid_tokens_do_not_change_password(database, state):
    if state != 'missing':
        repository.create(user_id=1, token_hash='a' * 64, expires_at=datetime.now(timezone.utc) + timedelta(hours=24))
    if state == 'expired':
        database.execute("UPDATE password_reset_token SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'")
    if state == 'disabled':
        database.execute('UPDATE users SET desactive_at = CURRENT_TIMESTAMP')
    assert not repository.consume(token_hash='a' * 64, password_hash='should-not-be-saved')
    assert database.execute('SELECT password_hash FROM users').fetchone()['password_hash'] is None


def test_request_link_can_reset_password_and_cannot_be_replayed(database, client, monkeypatch):
    from urllib.parse import parse_qs, urlparse
    from unittest.mock import Mock

    from app.dependencies import get_current_user
    from app.main import app
    from app.services import password_reset_service as service
    from core.passwords import verify_password
    from core.security import decode_access_token

    send = Mock(return_value=True)
    monkeypatch.setattr(service, 'send_password_reset_email', send)
    monkeypatch.setenv('FRONTEND_URL', 'https://example.com')
    app.dependency_overrides[get_current_user] = lambda: {
        'id_user': 1, 'first_name': 'Test', 'email': 'test@example.com',
    }
    try:
        response = client.post('/api/me/password-reset')
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert response.status_code == 202
    reset_url = send.call_args.kwargs['reset_url']
    token = parse_qs(urlparse(reset_url).query)['token'][0]
    assert token not in str(database.execute('SELECT * FROM password_reset_token').fetchall())
    payload = {'token': token, 'new_password': 'Changed123'}
    response = client.post('/api/auth/reset-password', json=payload)
    assert response.status_code == 200
    assert decode_access_token(response.json()['access_token'])['sub'] == '1'
    user = database.execute('SELECT * FROM users WHERE id_user = 1').fetchone()
    assert verify_password('Changed123', user['password_hash'])
    assert user['password_set_at'] is not None
    assert client.post('/api/auth/reset-password', json=payload).status_code == 400


def test_failed_delivery_preserves_an_existing_link(database, monkeypatch):
    from unittest.mock import Mock
    from app.services import password_reset_service as service

    old_token = service.create_reset_token(user_id=1)
    monkeypatch.setattr(service, 'send_password_reset_email', Mock(return_value=False))
    monkeypatch.setenv('FRONTEND_URL', 'https://example.com')
    with pytest.raises(RuntimeError):
        service.request_password_reset(user={
            'id_user': 1, 'first_name': 'Test', 'email': 'test@example.com',
        })
    assert database.execute('SELECT count(*) AS count FROM password_reset_token').fetchone()['count'] == 1
    assert service.reset_password(token=old_token, new_password='Changed123') is not None
