"""Account dates exposed to the client and password timestamp persistence."""
import os
from contextlib import nullcontext

import pytest

from app.dependencies import get_current_user
from app.main import app


def test_me_exposes_account_and_password_dates(client):
    app.dependency_overrides[get_current_user] = lambda: {
        'id_user': 1, 'first_name': 'Marie', 'last_name': 'Dupont',
        'email': 'marie@example.com', 'role': 'employe',
        'creat_at': '2026-11-06T09:00:00Z',
        'password_set_at': '2026-11-06T10:00:00Z',
    }
    try:
        response = client.get('/me')
        assert response.status_code == 200
        assert response.json()['creat_at'] == '2026-11-06T09:00:00Z'
        assert response.json()['password_set_at'] == '2026-11-06T10:00:00Z'
    finally:
        app.dependency_overrides.clear()


def test_password_dates_follow_password_changes(monkeypatch):
    if os.getenv('TEST_DATABASE') != '1':
        pytest.skip('Set TEST_DATABASE=1 for PostgreSQL integration checks')
    from app.db.database_conn import get_connection
    from app.repositories import users_repository as repository

    with get_connection() as connection:
        connection.execute('''CREATE TEMP TABLE users (
            id_user INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            first_name TEXT, last_name TEXT, email TEXT, password_hash TEXT,
            password_set_at TIMESTAMPTZ, role TEXT, phone TEXT,
            creat_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, desactive_at TIMESTAMPTZ)''')
        monkeypatch.setattr(repository, 'get_connection', lambda: nullcontext(connection))
        user = repository.create(first_name='Marie', last_name='Dupont', email='marie@example.com', password_hash='initial')
        assert user['creat_at'] is not None
        assert user['password_set_at'] is not None
        original = user['password_set_at']
        updated = repository.update(user['id_user'], first_name='Maria')
        assert updated['password_set_at'] == original
        updated = repository.update(user['id_user'], password_hash='new')
        assert updated['password_set_at'] >= original
        pending = repository.create(first_name='New', last_name='User', email='new@example.com')
        assert pending['password_set_at'] is None
