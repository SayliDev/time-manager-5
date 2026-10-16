from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable, Mapping, Any
from zoneinfo import ZoneInfo


PARIS = ZoneInfo("Europe/Paris")
Session = Mapping[str, Any]


def _midnight(day: date) -> datetime:
    """Début d'une journée française, converti en UTC."""
    return datetime.combine(
        day, time.min, tzinfo=PARIS
    ).astimezone(timezone.utc)


def calc_work_time(
    sessions: Iterable[Session],
    start_date: date,
    end_date: date,
) -> timedelta:
    """Cumule le travail entre start_date incluse et end_date exclue.

    Ignore les sessions ouvertes et annulées.
    Les dates des sessions doivent contenir un fuseau horaire.
    """
    if end_date < start_date:
        raise ValueError("La date de fin doit suivre la date de début.")

    period_start = _midnight(start_date)
    period_end = _midnight(end_date)
    total = timedelta()

    for session in sessions:
        if session.get("cancel_at") is not None:
            continue

        start = session["start_at"]
        end = session.get("end_at")

        if end is None:
            continue

        if start.utcoffset() is None or end.utcoffset() is None:
            raise ValueError("Les dates doivent avoir un fuseau horaire.")

        start = start.astimezone(timezone.utc)
        end = end.astimezone(timezone.utc)

        if end < start:
            raise ValueError("Une session se termine avant son début.")

        # Ne conserve que la partie comprise dans la période.
        clipped_start = max(start, period_start)
        clipped_end = min(end, period_end)

        if clipped_end > clipped_start:
            total += clipped_end - clipped_start

    return total


def format_work_time(duration: timedelta) -> str:
    """Transforme une durée en '7h 30min', sans arrondir les secondes."""
    total_minutes = int(duration.total_seconds()) // 60
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours}h {minutes:02d}min"


def calc_ongoing_week(
    sessions: Iterable[Session],
    today: date,
) -> timedelta:
    """Cumul du lundi jusqu'à aujourd'hui inclus."""
    monday = today - timedelta(days=today.weekday())

    return calc_work_time(
        sessions,
        start_date=monday,
        end_date=today + timedelta(days=1),
    )


def calc_past_time_week(
    sessions: Iterable[Session],
    week_date: date,
    today: date,
) -> timedelta:
    """Total d'une semaine passée, du lundi au dimanche.

    week_date peut être n'importe quel jour de la semaine visée.
    """
    monday = week_date - timedelta(days=week_date.weekday())
    current_monday = today - timedelta(days=today.weekday())

    if monday >= current_monday:
        raise ValueError("Choisis une semaine entièrement passée.")

    return calc_work_time(
        sessions,
        start_date=monday,
        end_date=monday + timedelta(days=7),
    )


def show_past_date(
    sessions: Iterable[Session],
    start_date: date,
    today: date,
) -> dict[date, timedelta]:
    """Durée de chaque jour, de start_date jusqu'à hier inclus.

    Inclut les jours sans travail avec une durée nulle.
    """
    if start_date > today:
        raise ValueError("La date de début ne peut pas être future.")

    sessions = list(sessions)
    results = {}
    day = start_date

    while day < today:
        results[day] = calc_work_time(
            sessions,
            start_date=day,
            end_date=day + timedelta(days=1),
        )
        day += timedelta(days=1)

    return results