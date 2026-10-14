"""Aucun accès réseau/BDD : le module de connexion est remplacé avant import."""
import importlib
import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock

import psycopg
import pytest
from psycopg.rows import dict_row


@pytest.fixture
def db(monkeypatch):
    cursor = MagicMock(name="cursor")
    cursor.__enter__.return_value = cursor
    cursor.__exit__.return_value = False
    connection = MagicMock(name="connection")
    connection.__enter__.return_value = connection
    connection.__exit__.return_value = False
    connection.cursor.return_value = cursor
    factory = MagicMock(name="get_connection", return_value=connection)

    def forbidden(*args, **kwargs):
        raise AssertionError("Un test unitaire a tenté une vraie connexion PostgreSQL.")

    monkeypatch.setattr(psycopg, "connect", forbidden)
    monkeypatch.setattr(psycopg.Connection, "connect", forbidden)
    database = ModuleType("app.db.database")
    database.get_connection = factory
    monkeypatch.setitem(sys.modules, "app.db.database", database)

    def load(module_name):
        module = importlib.import_module("app.crud." + module_name)
        monkeypatch.setattr(module, "get_connection", factory)
        return module

    return SimpleNamespace(
        cursor=cursor, connection=connection, factory=factory, load=load,
    )


def query_text(db):
    query = db.cursor.execute.call_args.args[0]
    if hasattr(query, "as_string"):
        query = query.as_string()
    return " ".join(query.split()).lower()


@pytest.fixture
def sql_text():
    return query_text


@pytest.fixture
def check_context():
    def check(db, *, dictionaries=True):
        db.factory.assert_called_once_with()
        db.connection.__enter__.assert_called_once()
        db.connection.__exit__.assert_called_once()
        db.cursor.__enter__.assert_called_once()
        db.cursor.__exit__.assert_called_once()
        if dictionaries:
            db.connection.cursor.assert_called_once_with(row_factory=dict_row)
    return check

