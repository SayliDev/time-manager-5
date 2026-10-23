from datetime import date, datetime, timedelta

from app.services.time_service import PARIS
from app.services.timekeeping_service import build_timekeeping


def make_work_session(identifier, day, hour, end_hour=None, mode="onsite"):
    start = datetime(2026, 10, day, hour, tzinfo=PARIS)
    return {
        "id_work_session": identifier,
        "start_at": start,
        "end_at": start.replace(hour=end_hour) if end_hour else None,
        "cancel_at": None,
        "work_mode": mode,
    }


def test_lunch_return_is_not_late_and_hours_exclude_open_cancelled():
    sessions = [
        make_work_session(1, 1, 9, 12),
        make_work_session(2, 1, 13, 17, "remote"),
        make_work_session(3, 2, 9),
    ]
    cancelled = make_work_session(4, 1, 8, 9)
    cancelled["cancel_at"] = cancelled["start_at"]
    result = build_timekeeping(
        {"sessions": sessions + [cancelled]},
        date(2026, 10, 1),
        date(2026, 10, 2),
        datetime(2026, 10, 3, tzinfo=PARIS),
    )
    assert result["stats"]["total"] == 7
    assert result["stats"]["days"] == 1
    assert [e["status"] for e in result["entries"]] == ["missing", "ok", "ok"]
    assert result["hours"][0]["remote"] == 4


def test_overnight_session_is_clipped_and_unknown_mode_preserved():
    item = make_work_session(1, 1, 23, mode=None)
    item["end_at"] = item["start_at"] + timedelta(hours=3)
    result = build_timekeeping(
        {"sessions": [item]},
        date(2026, 10, 2),
        date(2026, 10, 2),
        datetime(2026, 10, 3, tzinfo=PARIS),
    )
    assert result["stats"]["total"] == 2
    assert result["entries"] == []


def test_first_arrival_only_is_late_and_current_open_session_ongoing():
    result = build_timekeeping(
        {
            "sessions": [
                make_work_session(1, 2, 10, 12, None),
                make_work_session(2, 2, 13),
            ]
        },
        date(2026, 10, 2),
        date(2026, 10, 2),
        datetime(2026, 10, 2, 14, tzinfo=PARIS),
    )
    assert [e["status"] for e in result["entries"]] == ["ongoing", "late"]
    assert result["entries"][1]["mode"] == "unknown"
