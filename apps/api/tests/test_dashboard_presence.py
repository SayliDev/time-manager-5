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
