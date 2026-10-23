from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone

from app.services.time_service import PARIS, _midnight, calc_work_time


DAY_NAMES = ("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")
# Demo schedule until individual working calendars are available.
WORKDAY_START = time(9)


def period_bounds(day: date, period: str) -> tuple[date, date]:
    """Détermine les bornes d’une semaine ou d’un mois, avec fin exclusive.

    La semaine commence le lundi ; les valeurs de period sont validées en route.
    """
    if period == "week":
        start = day - timedelta(days=day.weekday())
        return start, start + timedelta(days=7)

    start = day.replace(day=1)
    end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return start, end


def work_mode(session) -> str:
    """Normalise les valeurs historiques de work_mode pour les vues dashboard.

    Retourne present, remote ou unknown si la valeur ne peut pas être reconnue.
    """
    mode = str(session.get("work_mode") or "").strip().lower()
    if mode in {"remote", "teletravail", "télétravail", "distanciel", "distancielle"}:
        return "remote"
    elif mode in {
        "onsite",
        "on_site",
        "presentiel",
        "présentiel",
        "presentielle",
        "présentielle",
    }:
        return "present"
    else:
        return "unknown"


def build_dashboard(
    data: dict,
    *,
    reference_date: date,
    period: str,
    cutoff: datetime,
) -> dict:
    """Construit la projection historique du dashboard à la date de référence.

    Les calculs utilisent le calendrier de Paris et ignorent les sessions
    annulées ou futures. Le périmètre doit déjà être filtré par l’appelant.
    """
    week_start, week_end = period_bounds(reference_date, "week")
    start, end = period_bounds(reference_date, period)

    by_user = defaultdict(list)

    for session in data["sessions"]:
        if not session.get("cancel_at") and session["start_at"] < cutoff:
            by_user[session["id_user"]].append(session)

    def hours(sessions, lower, upper):
        """Cumule les sessions terminées avant cutoff sur des journées à fin exclusive."""
        completed = [
            session
            for session in sessions
            if session["end_at"] is not None
            and session["end_at"] <= cutoff
        ]

        duration = calc_work_time(completed, lower, upper)
        return duration.total_seconds() / 3600

    def hour_totals(sessions, lower, upper, denominator=1):
        """Ventile les heures totales par mode, éventuellement en moyenne par personne."""
        return {
            "hours": round(hours(sessions, lower, upper) / denominator, 2),
            "onsite": round(hours(
                [s for s in sessions if work_mode(s) == "present"],
                lower, upper,
            ) / denominator, 2),
            "remote": round(hours(
                [s for s in sessions if work_mode(s) == "remote"],
                lower, upper,
            ) / denominator, 2),
        }

    def day_bars(sessions, denominator=1):
        """Prépare les sept points quotidiens de la semaine, jours sans travail inclus."""
        return [
            {
                "day": DAY_NAMES[index],
                **hour_totals(
                    sessions,
                    week_start + timedelta(days=index),
                    week_start + timedelta(days=index + 1),
                    denominator,
                ),
            }
            for index in range(7)
        ]

    users = []
    activity = []
    clocked_in = 0
    attended = 0

    presence = {
        "present": 0,
        "remote": 0,
        "late": 0,
        "absent": 0,
    }

    day_start = _midnight(reference_date)
    day_end = _midnight(reference_date + timedelta(days=1))
    working_day = reference_date.weekday() < 5
    expected_start = datetime.combine(reference_date, WORKDAY_START, tzinfo=PARIS)

    for user in data["users"]:
        sessions = sorted(
            by_user[user["id_user"]],
            key=lambda session: session["start_at"],
        )

        todays = [
            session
            for session in sessions
            if session["start_at"] < day_end
            and (session["end_at"] or cutoff) > day_start
        ]

        # Une ancienne session laissée ouverte ne prouve pas
        # que la personne travaille aujourd'hui.
        todays = [
            session
            for session in todays
            if session["end_at"] is not None
            or session["start_at"].astimezone(PARIS).date()
            == reference_date
        ]

        active = [
            session
            for session in todays
            if session["end_at"] is None
            or session["end_at"] > cutoff
        ]

        clocked_in += bool(active)
        attended += bool(todays)

        presence_status = work_mode(todays[-1]) if todays else "unknown"

        if working_day:
            if not todays and cutoff > expected_start:
                presence_status = "absent"
            elif todays and todays[0]["start_at"] > expected_start:
                # The first clock-in determines lateness, not the lunch return.
                presence_status = "late"

        if presence_status in presence:
            presence[presence_status] += 1

        events = []
        entries = []

        for session in sessions:
            session_events = (
                (
                    "arrival",
                    session["start_at"],
                    "a pointé son arrivée",
                ),
                (
                    "departure",
                    session["end_at"],
                    "a pointé son départ",
                ),
            )

            for kind, instant, label in session_events:
                if instant is None or instant > cutoff:
                    continue

                events.append(instant)

                activity.append({
                    "id": f'{session["id_work_session"]}-{kind}',
                    "userId": str(user["id_user"]),
                    "type": kind,
                    "time": instant.astimezone(PARIS).strftime(
                        "%d/%m %H:%M"
                    ),
                    "label": label,
                    "_instant": instant,
                })

            finished = (
                session["end_at"] is not None
                and session["end_at"] <= cutoff
            )

            duration = 0

            if finished:
                duration = (
                    session["end_at"].astimezone(timezone.utc)
                    - session["start_at"].astimezone(timezone.utc)
                ).total_seconds() / 3600

            entries.append({
                "id": str(session["id_work_session"]),
                "date": (
                    session["start_at"]
                    .astimezone(PARIS)
                    .date()
                    .isoformat()
                ),
                "arrival": session["start_at"].astimezone(
                    PARIS
                ).strftime("%H:%M"),
                "departure": (
                    session["end_at"].astimezone(PARIS).strftime("%H:%M")
                    if finished
                    else None
                ),
                "hours": round(duration, 2),
                "status": "ok" if finished else "ongoing",
            })

        users.append({
            "id": str(user["id_user"]),
            "firstName": user["first_name"],
            "lastName": user["last_name"],
            "email": user["email"],
            "phone": user["phone"] or "",
            "role": (
                "manager"
                if user["role"] in {"manager", "admin"}
                else "employee"
            ),
            "teamId": (
                str(user["id_team"])
                if user["id_team"] is not None
                else None
            ),
            "teamName": user["team_name"],
            "presence": presence_status,
            "weeklyHours": round(
                hours(sessions, week_start, week_end),
                2,
            ),
            "lastClock": (
                max(events).astimezone(PARIS).strftime("%d/%m %H:%M")
                if events
                else "—"
            ),
            "dailyHours": day_bars(sessions),
            "entries": list(reversed(entries))[:4],
        })

    selected_sessions = [
        session
        for user in data["users"]
        for session in by_user[user["id_user"]]
    ]

    denominator = len(users) or 1

    if period == "week":
        bars = day_bars(selected_sessions, denominator)
    else:
        bars = []
        lower = start

        while lower < end:
            upper = min(
                lower + timedelta(days=7 - lower.weekday()),
                end,
            )

            bars.append({
                "day": (
                    f"{lower:%d/%m}–"
                    f"{upper - timedelta(days=1):%d/%m}"
                ),
                **hour_totals(selected_sessions, lower, upper, denominator),
            })

            lower = upper

    activity.sort(
        key=lambda event: event["_instant"],
        reverse=True,
    )

    recent_activity = [
        {
            key: value
            for key, value in event.items()
            if key != "_instant"
        }
        for event in activity[:8]
    ]

    return {
        "teams": [
            {
                "id": str(team["id_team"]),
                "name": team["name"],
            }
            for team in data["teams"]
        ],
        "users": users,
        "hours": bars,
        "activity": recent_activity,
        "presence": presence,
        "referenceDate": reference_date.isoformat(),
        "stats": {
            "clockedIn": clocked_in,
            "clockedToday": attended,
            "attendance": (
                round(attended / len(users) * 100, 1) if users else None
            ),
            "alerts": presence["late"] + presence["absent"],
            "averageWeeklyHours": round(
                hours(selected_sessions, week_start, week_end)
                / denominator,
                2,
            ),
        },
    }