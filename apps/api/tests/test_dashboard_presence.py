from datetime import date, datetime

import pytest

from app.services.dashboard_service import build_dashboard
from app.services.time_service import PARIS


@pytest.mark.parametrize("mode,expected", [
    ("onsite", "present"),
    ("présentielle", "present"),
    ("presentiel", "present"),
    ("remote", "remote"),
    ("télétravail", "remote"),
    ("distanciel", "remote"),
    (" DISTANCIELLE ", "remote"),
    (None, "unknown"),
    ("invalid", "unknown"),
])
def test_dashboard_classifies_work_mode(mode, expected):
    data = {
        "teams": [],
        "users": [{
            "id_user": 1, "first_name": "Test", "last_name": "User",
            "email": "test@example.com", "phone": None, "role": "employe",
            "id_team": None, "team_name": None,
        }],
        "sessions": [{
            "id_user": 1, "id_work_session": 1,
            "start_at": datetime(2026, 10, 2, 9, tzinfo=PARIS),
            "end_at": datetime(2026, 10, 2, 17, tzinfo=PARIS),
            "cancel_at": None, "work_mode": mode,
        }],
    }
    result = build_dashboard(
        data, reference_date=date(2026, 10, 2), period="week",
        cutoff=datetime(2026, 10, 3, tzinfo=PARIS),
    )
    assert result["users"][0]["presence"] == expected
    assert result["presence"]["present"] == (expected == "present")
    assert result["presence"]["remote"] == (expected == "remote")


@pytest.mark.parametrize("period", ["week", "month"])
def test_dashboard_splits_hours_by_mode(period):
    data = {
        "teams": [],
        "users": [{
            "id_user": 1, "first_name": "Test", "last_name": "User",
            "email": "test@example.com", "phone": None, "role": "employe",
            "id_team": None, "team_name": None,
        }],
        "sessions": [],
    }
    for index, (mode, start, end, cancelled) in enumerate([
        ("onsite", 9, 12, False),
        ("remote", 13, 17, False),
        ("remote", 17, 18, True),
        ("remote", 18, None, False),
    ]):
        data["sessions"].append({
            "id_user": 1, "id_work_session": index,
            "start_at": datetime(2026, 10, 2, start, tzinfo=PARIS),
            "end_at": datetime(2026, 10, 2, end, tzinfo=PARIS) if end else None,
            "cancel_at": datetime(2026, 10, 2, 19, tzinfo=PARIS) if cancelled else None,
            "work_mode": mode,
        })
    result = build_dashboard(
        data, reference_date=date(2026, 10, 2), period=period,
        cutoff=datetime(2026, 10, 3, tzinfo=PARIS),
    )
    assert sum(bar["onsite"] for bar in result["hours"]) == 3
    assert sum(bar["remote"] for bar in result["hours"]) == 4
    assert sum(bar["hours"] for bar in result["hours"]) == 7
    assert result["users"][0]["dailyHours"][4] == {
        "day": "Ven", "hours": 7, "onsite": 3, "remote": 4,
    }
