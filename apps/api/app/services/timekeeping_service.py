"""Construction de l'historique et des indicateurs de pointage."""

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import TypedDict

from app.services.dashboard_service import WORKDAY_START, work_mode
from app.services.time_service import PARIS, calc_work_time


WEEKLY_TARGET_HOURS = 35


class WeeklyTotals(TypedDict):
    hours: float
    days: int


def build_timekeeping(
    data: dict,
    start: date,
    end: date,
    cutoff: datetime,
) -> dict:
    """Calcule les heures terminees et les anomalies en heure de Paris.

    Les sessions ouvertes et annulees sont exclues des durees.
    Le retard suit l'horaire de demonstration partage avec le dashboard.
    """
    sessions = [
        session
        for session in data["sessions"]
        if not session.get("cancel_at") and session["start_at"] < cutoff
    ]
    completed_sessions = [
        session
        for session in sessions
        if session["end_at"] is not None and session["end_at"] <= cutoff
    ]
    first_arrival_by_day = {}
    for session in sessions:
        day = session["start_at"].astimezone(PARIS).date()
        first_arrival_by_day[day] = min(
            first_arrival_by_day.get(day, session["start_at"]), session["start_at"]
        )
    entries = []
    for session in sorted(
        sessions,
        key=lambda session: (session["start_at"], session["id_work_session"]),
        reverse=True,
    ):
        arrival = session["start_at"].astimezone(PARIS)
        if not start <= arrival.date() <= end:
            continue
        is_finished = session["end_at"] is not None and session["end_at"] <= cutoff
        status = "ok"
        if not is_finished:
            status = (
                "ongoing"
                if arrival.date() == cutoff.astimezone(PARIS).date()
                else "missing"
            )
        elif (
            arrival.weekday() < 5
            and arrival == first_arrival_by_day[arrival.date()]
            and arrival.time() > WORKDAY_START
        ):
            status = "late"
        entries.append(
            {
                "id": str(session["id_work_session"]),
                "date": arrival.date().isoformat(),
                "arrival": arrival.strftime("%H:%M"),
                "departure": session["end_at"].astimezone(PARIS).strftime("%H:%M")
                if is_finished
                else None,
                "hours": round(
                    calc_work_time(
                        [session], start, end + timedelta(days=1)
                    ).total_seconds()
                    / 3600,
                    2,
                )
                if is_finished
                else 0,
                "status": status,
                "mode": {"present": "onsite", "remote": "remote"}.get(
                    work_mode(session), "unknown"
                ),
            }
        )
    hours = []
    weekly_totals: defaultdict[date, WeeklyTotals] = defaultdict(
        lambda: WeeklyTotals(hours=0.0, days=0)
    )
    day = start
    while day <= end:
        duration = (
            calc_work_time(
                completed_sessions, day, day + timedelta(days=1)
            ).total_seconds()
            / 3600
        )
        hours.append(
            {
                "day": day.strftime("%d/%m"),
                "hours": round(duration, 2),
                **{
                    mode: round(
                        calc_work_time(
                            [
                                session
                                for session in completed_sessions
                                if work_mode(session) == source
                            ],
                            day,
                            day + timedelta(days=1),
                        ).total_seconds()
                        / 3600,
                        2,
                    )
                    for mode, source in [("onsite", "present"), ("remote", "remote")]
                },
            }
        )
        monday = day - timedelta(days=day.weekday())
        weekly_totals[monday]["hours"] += duration
        weekly_totals[monday]["days"] += int(duration > 0)
        day += timedelta(days=1)
    weekly = [
        {
            "id": monday.isoformat(),
            "label": f"Semaine du {monday:%d/%m}",
            "range": f"{max(start, monday):%d/%m/%Y} – {min(end, monday + timedelta(days=6)):%d/%m/%Y}",
            "hours": round(values["hours"], 2),
            "days": values["days"],
        }
        for monday, values in weekly_totals.items()
    ]
    total_hours = sum(week["hours"] for week in weekly)
    return {
        "entries": entries,
        "hours": hours,
        "weekly": weekly,
        "stats": {
            "total": round(total_hours, 2),
            "averageWeeklyHours": round(total_hours / (len(weekly) or 1), 2),
            "aboveTargetHours": round(
                sum(max(0, week["hours"] - WEEKLY_TARGET_HOURS) for week in weekly), 2
            ),
            "days": sum(week["days"] for week in weekly),
        },
    }
