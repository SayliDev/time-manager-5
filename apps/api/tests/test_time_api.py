from datetime import date, datetime, time
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from app.repositories.time_repository import clock, load_scope
from app.routers.time import time_data
from app.services.timekeeping_service import user_time, presence


def instant(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def fixture_data():
    return {
        "users": [{"id_user": 3}],
        "teams": [],
        "leaves": [],
        "contracts": [
            {
                "id_user": 3,
                "start_date": date(2026, 1, 1),
                "end_date": None,
                "weekly_hours": Decimal("35"),
                "expected_start": time(9),
                "late_tolerance_minutes": 5,
                "overtime_threshold_hours": 0,
            }
        ],
        "sessions": [
            {
                "id_work_session": 12,
                "id_user": 3,
                "start_at": instant("2026-10-02T07:06:00Z"),
                "end_at": instant("2026-10-02T14:36:00Z"),
                "work_mode": "remote",
            }
        ],
    }


def test_decimal_hours_lateness_and_utc_contract():
    data = fixture_data()
    result = user_time(
        data, 3, date(2026, 10, 2), date(2026, 10, 2), instant("2026-10-02T18:00:00Z")
    )
    entry = result["work-sessions"][0]
    assert entry["hours"] == 7.5
    assert entry["status"] == "late"
    assert entry["start_at"] == "2026-10-02T07:06:00Z"
    assert result["daily"] == [
        {"date": "2026-10-02", "label": "Ven", "hours": 7.5, "onsite": 0, "remote": 7.5}
    ]
    assert result["time-summary"]["late_count"] == 1


def test_open_session_null_hours_and_midnight_missing():
    data = fixture_data()
    data["sessions"][0]["end_at"] = None
    for now, status in [
        ("2026-10-02T18:00:00Z", "ongoing"),
        ("2026-10-03T06:00:00Z", "missing"),
    ]:
        entry = user_time(data, 3, date(2026, 10, 2), date(2026, 10, 2), instant(now))[
            "work-sessions"
        ][0]
        assert entry["status"] == status
        assert entry["hours"] is None and entry["end_at"] is None


def test_leave_overrides_late_presence():
    data = fixture_data()
    data["leaves"] = [
        {"id_user": 3, "start_date": date(2026, 10, 2), "end_date": date(2026, 10, 2)}
    ]
    assert (
        presence(data, date(2026, 10, 2), instant("2026-10-02T18:00:00Z"))[0][
            "presence"
        ]
        == "off"
    )


def test_out_of_scope_user_is_forbidden():
    with patch("app.routers.time.load_scope", return_value={"users": []}):
        with pytest.raises(HTTPException) as error:
            time_data(99, date(2026, 10, 1), date(2026, 10, 2), {"id_user": 3})
        assert error.value.status_code == 403


def test_invalid_period_is_rejected_before_database_read():
    with patch("app.routers.time.load_scope") as load:
        with pytest.raises(HTTPException) as error:
            time_data(3, date(2026, 10, 2), date(2026, 10, 1), {"id_user": 3})
        assert error.value.status_code == 422
        load.assert_not_called()


@pytest.mark.parametrize(
    "path",
    [
        "/api/users/3/work-sessions",
        "/api/users/3/hours/daily",
        "/api/users/3/hours/weekly",
        "/api/users/3/time-summary",
        "/api/dashboard/kpis",
        "/api/dashboard/hours",
        "/api/dashboard/presence",
        "/api/dashboard/activity",
        "/api/teams",
    ],
)
def test_routes_require_authentication(client, path):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize(
    "path", ["/api/work-sessions/clock-in", "/api/work-sessions/clock-out"]
)
def test_clock_requires_authentication(client, path):
    assert client.post(path, json={"mode": "onsite"}).status_code == 401


@pytest.mark.parametrize(
    "mode,active", [("onsite", [{"id_work_session": 1}]), (None, [])]
)
def test_clock_conflicts_lock_employee_before_reading_open_sessions(mode, active):
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.return_value.fetchall.return_value = active
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        with pytest.raises(HTTPException) as error:
            clock(3, mode)
    assert error.value.status_code == 409
    assert "FOR UPDATE" in conn.execute.call_args_list[0].args[0]
    assert conn.execute.call_count == 2


def test_employee_cannot_select_team_owned_by_another_manager():
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.return_value.fetchall.return_value = [{"id_team": 1, "id_user": 11}]
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        with pytest.raises(HTTPException) as error:
            load_scope({"id_user": 3, "role": "employee"}, date(2026, 10, 2), 1)
    assert error.value.status_code == 403
    assert conn.execute.call_count == 1


@pytest.mark.parametrize("team_id", [None, 2])
def test_additional_manager_can_read_assigned_teams(team_id):
    teams = [{"id_team": 1, "id_user": 2}, {"id_team": 2, "id_user": 3}]
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.return_value.fetchall.side_effect = [
        teams,
        [{"id_team": 1}, {"id_team": 2}],
        [],
        [],
        [],
        [],
    ]
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        data = load_scope(
            {"id_user": 11, "role": "manager"}, date(2026, 10, 23), team_id
        )
    expected = [1, 2] if team_id is None else [2]
    assert [team["id_team"] for team in data["teams"]] == expected
    assert conn.execute.call_args_list[2].args[1]["ids"] == expected
    assert [team["id_user"] for team in teams] == [2, 3]


def test_additional_manager_cannot_read_unassigned_team():
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.return_value.fetchall.side_effect = [
        [{"id_team": 1, "id_user": 2}, {"id_team": 2, "id_user": 3}],
        [{"id_team": 1}],
    ]
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        with pytest.raises(HTTPException) as error:
            load_scope({"id_user": 11, "role": "manager"}, date(2026, 10, 23), 2)
    assert error.value.status_code == 403
    assert conn.execute.call_count == 2


def test_empty_scope_skips_timekeeping_queries():
    conn = MagicMock()
    conn.__enter__.return_value = conn
    conn.execute.return_value.fetchall.side_effect = [[], []]
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        data = load_scope({"id_user": 3, "role": "employee"}, date(2026, 10, 2))
    assert data == {
        "users": [], "teams": [], "sessions": [], "contracts": [], "leaves": []
    }
    assert conn.execute.call_count == 2


def test_scope_loads_timekeeping_only_for_accessible_users():
    conn = MagicMock()
    conn.__enter__.return_value = conn
    users = [{"id_user": 3}]
    sessions = [{"id_work_session": 7, "id_user": 3}]
    contracts = [{"id_contract": 2, "id_user": 3}]
    leaves = [{"id_user": 3}]
    conn.execute.return_value.fetchall.side_effect = [
        [], users, sessions, contracts, leaves
    ]
    with patch("app.repositories.time_repository.get_connection", return_value=conn):
        data = load_scope({"id_user": 3, "role": "employee"}, date(2026, 10, 2))
    assert data == {
        "users": users, "teams": [], "sessions": sessions,
        "contracts": contracts, "leaves": leaves,
    }
    for call in conn.execute.call_args_list[2:]:
        assert call.args[1] == ([3],)
