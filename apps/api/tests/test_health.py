from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import TABLES, app


def test_health() -> None:
    expected_tables = {
        table: index + 1
        for index, table in enumerate(TABLES)
    }
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.execute.return_value.fetchone.side_effect = [
        {"total": count}
        for count in expected_tables.values()
    ]

    with patch("app.main.connexion", return_value=connection):
        response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "tables": expected_tables,
    }