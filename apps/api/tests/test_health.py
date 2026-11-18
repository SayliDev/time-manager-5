"""Health endpoint database status and error handling."""

from unittest.mock import patch

import psycopg

from app.main import TABLES


def test_health_returns_table_counts(client):
    with patch("app.main.connexion") as connect:
        connection = connect.return_value.__enter__.return_value
        connection.execute.return_value.fetchone.return_value = {"total": 3}

        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "tables": dict.fromkeys(TABLES, 3),
    }
    assert connection.execute.call_count == len(TABLES)


def test_health_returns_service_unavailable_on_database_error(client):
    with patch("app.main.connexion", side_effect=psycopg.OperationalError):
        response = client.get("/health")

    assert response.status_code == 503
    assert response.json() == {
        "detail": "Base inaccessible ou schéma incomplet.",
    }
