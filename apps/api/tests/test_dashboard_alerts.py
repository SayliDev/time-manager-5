from datetime import date, datetime, timedelta, timezone

import pytest

from app.services.dashboard_service import build_dashboard
from app.services.time_service import PARIS


DAY = date(2026, 10, 2)


def clock_in(hour, minute=0, mode="onsite", day=DAY, cancelled=False):
    start = datetime.combine(day, datetime.min.time(), tzinfo=PARIS).replace(hour=hour, minute=minute)
    return {
        "id_user": 1, "id_work_session": hour * 60 + minute,
        "start_at": start, "end_at": start + timedelta(hours=1),
        "cancel_at": start if cancelled else None, "work_mode": mode,
    }


def dashboard(sessions, day=DAY, cutoff=None):
    if cutoff is None:
        cutoff = datetime.combine(day + timedelta(days=1), datetime.min.time(), tzinfo=PARIS)
    data = {
        "users": [{"id_user": 1, "first_name": "Test", "last_name": "User",
                   "email": "test@example.com", "phone": None, "role": "employe",
                   "id_team": None, "team_name": None}],
        "sessions": sessions, "teams": [],
    }
    return build_dashboard(data, reference_date=day, period="week", cutoff=cutoff)


@pytest.mark.parametrize("mode", ["onsite", "remote"])
@pytest.mark.parametrize("hour,minute,late", [(8, 45, False), (9, 0, False), (9, 1, True), (9, 30, True)])
def test_lateness_uses_first_clock_in_in_paris_time(mode, hour, minute, late):
    session = clock_in(hour, minute, mode=mode)
    session["start_at"] = session["start_at"].astimezone(timezone.utc)
    result = dashboard([session])
    expected = "late" if late else ("remote" if mode == "remote" else "present")
    assert result["users"][0]["presence"] == expected
    assert result["presence"]["late"] == int(late)
    assert result["stats"]["alerts"] == int(late)
    assert result["stats"]["attendance"] == 100


def test_later_sessions_do_not_make_an_ontime_user_late():
    result = dashboard([clock_in(14), clock_in(9)])
    assert result["users"][0]["presence"] == "present"
    assert result["stats"]["alerts"] == 0


def test_multiple_late_sessions_count_one_late_user():
    result = dashboard([clock_in(10), clock_in(14)])
    assert result["presence"]["late"] == 1
    assert result["presence"]["absent"] == 0
    assert result["stats"]["alerts"] == 1


@pytest.mark.parametrize("sessions", [[], [clock_in(9, cancelled=True)], [clock_in(9, day=DAY-timedelta(days=1))]])
def test_no_valid_clock_in_after_work_start_is_absent(sessions):
    result = dashboard(sessions)
    assert result["users"][0]["presence"] == "absent"
    assert result["presence"]["absent"] == 1
    assert result["stats"]["attendance"] == 0
    assert result["stats"]["alerts"] == 1


@pytest.mark.parametrize("hour,minute", [(8, 30), (9, 0)])
def test_no_absence_alert_before_or_at_work_start(hour, minute):
    result = dashboard([], cutoff=datetime(2026, 10, 2, hour, minute, tzinfo=PARIS))
    assert result["users"][0]["presence"] == "unknown"
    assert result["stats"]["alerts"] == 0


@pytest.mark.parametrize("day", [date(2026, 10, 3), date(2026, 10, 4)])
def test_weekends_do_not_generate_absence_or_lateness(day):
    result = dashboard([], day=day)
    assert result["users"][0]["presence"] == "unknown"
    assert result["stats"]["alerts"] == 0
    result = dashboard([clock_in(10, day=day)], day=day)
    assert result["users"][0]["presence"] == "present"
    assert result["stats"]["alerts"] == 0


def test_overnight_session_is_not_late():
    session = clock_in(22, day=DAY-timedelta(days=1))
    session["end_at"] = datetime(2026, 10, 2, 6, tzinfo=PARIS)
    result = dashboard([session])
    assert result["users"][0]["presence"] == "present"
    assert result["stats"]["alerts"] == 0
