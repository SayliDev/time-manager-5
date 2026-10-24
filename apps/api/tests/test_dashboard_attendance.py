from datetime import date, datetime

import pytest

from app.services.dashboard_service import build_dashboard
from app.services.time_service import PARIS


DAY = date(2026, 10, 2)
CUTOFF = datetime(2026, 10, 2, 18, tzinfo=PARIS)


def session(user_id, start_hour=9, end_hour=12, day=2, mode="onsite", cancelled=False):
    return {
        "id_work_session": user_id * 100 + start_hour,
        "id_user": user_id,
        "start_at": datetime(2026, 10, day, start_hour, tzinfo=PARIS),
        "end_at": datetime(2026, 10, day, end_hour, tzinfo=PARIS) if end_hour is not None else None,
        "cancel_at": CUTOFF if cancelled else None,
        "work_mode": mode,
    }


def dashboard(user_count, sessions, period="week", cutoff=CUTOFF):
    users = [{
        "id_user": index, "first_name": "Test", "last_name": str(index),
        "email": f"test{index}@example.com", "phone": None,
        "role": "employe", "id_team": None, "team_name": None,
    } for index in range(1, user_count + 1)]
    return build_dashboard(
        {"users": users, "sessions": sessions, "teams": []},
        reference_date=DAY, period=period, cutoff=cutoff,
    )


def test_attendance_includes_onsite_and_remote_once_per_user():
    result = dashboard(3, [
        session(1), session(1, start_hour=13, end_hour=17),
        session(2, end_hour=None, mode="remote"),
    ])
    assert result["stats"]["attendance"] == 66.7
    assert result["stats"]["clockedIn"] == 1
    assert result["stats"]["clockedToday"] == 2


@pytest.mark.parametrize("sessions", [
    [],
    [session(1, cancelled=True)],
    [session(1, day=1)],
    [session(1, day=1, end_hour=None)],
])
def test_attendance_excludes_missing_cancelled_or_stale_sessions(sessions):
    result = dashboard(1, sessions)
    assert result["stats"]["attendance"] == 0
    assert result["stats"]["clockedToday"] == 0


def test_attendance_ignores_sessions_after_the_cutoff():
    result = dashboard(2, [session(1), session(2, start_hour=13, end_hour=None)],
                       cutoff=datetime(2026, 10, 2, 12, tzinfo=PARIS))
    assert result["stats"]["attendance"] == 50
    assert result["stats"]["clockedToday"] == 1


def test_attendance_does_not_require_a_known_work_mode():
    assert dashboard(1, [session(1, mode=None)])["stats"]["attendance"] == 100


def test_empty_team_has_no_attendance_rate():
    assert dashboard(0, [])["stats"]["attendance"] is None


@pytest.mark.parametrize("period", ["week", "month"])
def test_attendance_is_for_the_reference_day_in_both_views(period):
    assert dashboard(2, [session(1)], period=period)["stats"]["attendance"] == 50


def test_closed_overnight_session_counts_on_the_reference_day():
    overnight = session(1, start_hour=22, day=1)
    overnight["end_at"] = datetime(2026, 10, 2, 6, tzinfo=PARIS)
    assert dashboard(1, [overnight])["stats"]["attendance"] == 100


def test_daily_clock_ins_remain_counted_after_everyone_has_clocked_out():
    result = dashboard(3, [
        session(1), session(1, start_hour=13, end_hour=17),
        session(2, mode="remote"),
    ])
    assert result["stats"]["clockedToday"] == 2
    assert result["stats"]["clockedIn"] == 0


def test_daily_clock_ins_only_count_users_in_the_selected_scope():
    result = dashboard(1, [session(1), session(2)])
    assert result["stats"]["clockedToday"] == 1


def test_empty_team_has_no_daily_clock_ins():
    assert dashboard(0, [])["stats"]["clockedToday"] == 0
