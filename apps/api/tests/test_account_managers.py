"""Account manager visibility and current team relationships."""
import os
from unittest.mock import patch

import pytest

from app.dependencies import get_current_user
from app.main import app
from app.services.users_service import get_account_managers

MANAGER = {'id_user': 2, 'first_name': 'Marie', 'last_name': 'Dupont', 'email': 'marie@example.com'}


def test_managers_require_authentication(client):
    assert client.get('/api/me/managers').status_code == 401


def test_managers_are_scoped_to_current_employee(client):
    app.dependency_overrides[get_current_user] = lambda: {'id_user': 7, 'role': 'employe'}
    try:
        with patch('app.services.users_service.get_current_managers', return_value=[MANAGER]) as get:
            response = client.get('/api/me/managers?user_id=99')
        assert response.status_code == 200
        assert response.json() == [MANAGER]
        get.assert_called_once_with(user_id=7)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize('role', ['admin', 'manager'])
def test_other_roles_do_not_query_managers(role):
    with patch('app.services.users_service.get_current_managers') as get:
        assert get_account_managers(current_user={'id_user': 7, 'role': role}) == []
    get.assert_not_called()


def test_current_managers_exclude_inactive_relationships(monkeypatch):
    if os.getenv('TEST_DATABASE') != '1':
        pytest.skip('Set TEST_DATABASE=1 for PostgreSQL integration checks')
    from contextlib import nullcontext
    from app.db.database_conn import get_connection
    from app.repositories import users_repository as repository

    with get_connection() as connection:
        connection.execute('''CREATE TEMP TABLE users (
            id_user INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT,
            email TEXT, desactive_at TIMESTAMPTZ)''')
        connection.execute('CREATE TEMP TABLE team (id_team INTEGER, id_user INTEGER)')
        connection.execute('''CREATE TEMP TABLE team_allocation (
            id_user INTEGER, id_team INTEGER, start_at DATE, end_at DATE)''')
        connection.execute('''INSERT INTO users VALUES
            (1, 'Employee', 'One', 'employee@example.com', NULL),
            (2, 'Marie', 'Dupont', 'marie@example.com', NULL),
            (3, 'Inactive', 'Manager', 'inactive@example.com', CURRENT_TIMESTAMP),
            (4, 'Former', 'Manager', 'former@example.com', NULL),
            (5, 'Future', 'Manager', 'future@example.com', NULL),
            (6, 'Another', 'Manager', 'another@example.com', NULL)''')
        connection.execute('INSERT INTO team VALUES (1, 2), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 1)')
        connection.execute('''INSERT INTO team_allocation VALUES
            (1, 1, CURRENT_DATE - 1, NULL),
            (1, 2, CURRENT_DATE, CURRENT_DATE),
            (1, 3, CURRENT_DATE, NULL),
            (1, 4, CURRENT_DATE - 2, CURRENT_DATE - 1),
            (1, 5, CURRENT_DATE + 1, NULL),
            (1, 6, CURRENT_DATE, NULL),
            (1, 7, CURRENT_DATE, NULL)''')
        monkeypatch.setattr(repository, 'get_connection', lambda: nullcontext(connection))
        managers = repository.get_current_managers(user_id=1)
        assert {manager['id_user'] for manager in managers} == {2, 6}
        assert len(managers) == 2
        assert repository.get_current_managers(user_id=99) == []
