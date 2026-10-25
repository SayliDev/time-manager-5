"""Public time API projections. Calendar days use Europe/Paris; instants use UTC."""

from datetime import datetime, time, timedelta, timezone
from app.services.time_service import PARIS, calc_work_time
from app.services.dashboard_service import DAY_NAMES, work_mode


def utc(value):
    """Sérialise un instant en ISO 8601 UTC avec suffixe Z, ou conserve None."""
    return (
        value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        if value
        else None
    )


def contract(data, user_id, day):
    """Sélectionne le contrat actif ce jour-là, ou un dictionnaire vide par défaut.

    Les contrats doivent être fournis du plus récent au plus ancien, comme
    dans load_scope, pour départager plusieurs contrats couvrant le même jour.
    """
    return next(
        (
            c
            for c in data.get("contracts", [])
            if c["id_user"] == user_id
            and c["start_date"] <= day
            and (c["end_date"] is None or c["end_date"] >= day)
        ),
        {},
    )


def hours(sessions, start, end):
    """Cumule les heures décimales entre deux journées, la dernière étant exclue."""
    return calc_work_time(sessions, start, end).total_seconds() / 3600


def session_view(session, data, now):
    """Produit le format public d’une session et détermine son statut.

    Une session ouverte passée devient missing ; ses heures restent nulles.
    Le retard utilise la première arrivée, l’horaire contractuel et la tolérance.
    Il est prioritaire sur overtime, évalué au cumul hebdomadaire à la clôture.
    """
    day = session["start_at"].astimezone(PARIS).date()
    c = contract(data, session["id_user"], day)
    expected = datetime.combine(
        day, c.get("expected_start", time(9)), PARIS
    ) + timedelta(minutes=c.get("late_tolerance_minutes", 5))
    peers = [s for s in data["sessions"] if s["id_user"] == session["id_user"]]
    first = min(
        (s["start_at"] for s in peers if s["start_at"].astimezone(PARIS).date() == day),
        default=session["start_at"],
    )
    status = "ok"
    if session["end_at"] is None:
        status = "ongoing" if day == now.astimezone(PARIS).date() else "missing"
    elif day.weekday() < 5 and session["start_at"] == first and first > expected:
        status = "late"
    else:
        monday = day - timedelta(days=day.weekday())
        completed = [
            s for s in peers if s["end_at"] and s["end_at"] <= session["end_at"]
        ]
        if hours(completed, monday, monday + timedelta(days=7)) > float(
            c.get("weekly_hours", 35)
        ) + float(c.get("overtime_threshold_hours", 0)):
            status = "overtime"
    return {
        "id_work_session": session["id_work_session"],
        "date": day.isoformat(),
        "start_at": utc(session["start_at"]),
        "end_at": utc(session["end_at"]),
        "hours": round(
            (session["end_at"] - session["start_at"]).total_seconds() / 3600, 2
        )
        if session["end_at"]
        else None,
        "mode": "remote" if work_mode(session) == "remote" else "onsite",
        "status": status,
    }


def user_time(data, user_id, start, end, now):
    """Construit sessions, heures quotidiennes, semaines et résumé d’un employé.

    Les jours suivent Paris et les bornes sont inclusives. Seules les sessions
    terminées avant now contribuent aux durées ; les jours vides valent zéro.
    L’objectif reste entier pour chaque semaine intersectée, sans proratisation.
    """
    sessions = [
        s for s in data["sessions"] if s["id_user"] == user_id and s["start_at"] <= now
    ]
    completed = [s for s in sessions if s["end_at"] and s["end_at"] <= now]
    entries = [
        session_view(s, data, now)
        for s in sorted(
            sessions, key=lambda s: (s["start_at"], s["id_work_session"]), reverse=True
        )
        if start <= s["start_at"].astimezone(PARIS).date() <= end
    ]
    daily = []
    weekly = {}
    day = start
    while day <= end:
        total = hours(completed, day, day + timedelta(days=1))
        daily.append(
            {
                "date": day.isoformat(),
                "label": DAY_NAMES[day.weekday()],
                "hours": round(total, 2),
                **{
                    mode: round(
                        hours(
                            [
                                s
                                for s in completed
                                if ("remote" if work_mode(s) == "remote" else "onsite")
                                == mode
                            ],
                            day,
                            day + timedelta(days=1),
                        ),
                        2,
                    )
                    for mode in ("onsite", "remote")
                },
            }
        )
        monday = day - timedelta(days=day.weekday())
        row = weekly.setdefault(
            monday,
            {
                "week": monday.isocalendar().week,
                "start": day.isoformat(),
                "end": day.isoformat(),
                "hours": 0,
                "days_worked": 0,
            },
        )
        row["end"] = day.isoformat()
        row["hours"] += total
        row["days_worked"] += int(total > 0)
        day += timedelta(days=1)
    total = sum(w["hours"] for w in weekly.values())
    target = sum(
        float(contract(data, user_id, m).get("weekly_hours", 35)) for m in weekly
    )
    overtime = sum(
        max(
            0,
            w["hours"]
            - float(contract(data, user_id, m).get("weekly_hours", 35))
            - float(contract(data, user_id, m).get("overtime_threshold_hours", 0)),
        )
        for m, w in weekly.items()
    )
    for w in weekly.values():
        w["hours"] = round(w["hours"], 2)
    summary = {
        "total_hours": round(total, 2),
        "avg_weekly_hours": round(total / (len(weekly) or 1), 2),
        "avg_weekly_hours_delta": round((total / target - 1) * 100, 2) if target else 0,
        "overtime_hours": round(overtime, 2),
        "late_count": sum(e["status"] == "late" for e in entries),
        "missing_count": sum(e["status"] == "missing" for e in entries),
    }
    return {
        "work-sessions": entries,
        "daily": daily,
        "weekly": list(weekly.values()),
        "time-summary": summary,
    }


def presence(data, day, now):
    """Calcule le statut quotidien et les heures hebdomadaires par collaborateur.

    Les weekends et congés sont off. La première arrivée détermine le retard ;
    sans arrivée, un jour ouvré est absent. Le dernier pointage peut être ancien.
    """
    result = []
    monday = day - timedelta(days=day.weekday())
    for u in data["users"]:
        sessions = [
            s
            for s in data["sessions"]
            if s["id_user"] == u["id_user"] and s["start_at"] <= now
        ]
        today = [s for s in sessions if s["start_at"].astimezone(PARIS).date() == day]
        off = day.weekday() >= 5 or any(
            leave["id_user"] == u["id_user"] and leave["start_date"] <= day <= leave["end_date"]
            for leave in data.get("leaves", [])
        )
        c = contract(data, u["id_user"], day)
        expected = datetime.combine(
            day, c.get("expected_start", time(9)), PARIS
        ) + timedelta(minutes=c.get("late_tolerance_minutes", 5))
        status = "off" if off else "absent"
        if today and not off:
            status = "remote" if work_mode(today[-1]) == "remote" else "present"
            if min(s["start_at"] for s in today) > expected:
                status = "late"
        events = [
            v for s in sessions for v in (s["start_at"], s["end_at"]) if v and v <= now
        ]
        result.append(
            {
                "id_user": u["id_user"],
                "presence": status,
                "weekly_hours": round(
                    hours(
                        [s for s in sessions if s["end_at"] and s["end_at"] <= now],
                        monday,
                        monday + timedelta(days=7),
                    ),
                    2,
                ),
                "last_clock_at": utc(max(events)) if events else None,
            }
        )
    return result


def activity(data, now, limit):
    """Fusionne arrivées, départs et alertes avant now, puis conserve les plus récents.

    Les identifiants sont dérivés de la session et du type d’événement.
    Les alertes sont calculées à la lecture, sans table d’événements persistés.
    """
    events = []
    for s in data["sessions"]:
        if s["start_at"] > now:
            continue
        for index, kind, key, label in (
            (0, "arrival", "start_at", "a point? son arriv?e"),
            (1, "departure", "end_at", "a point? son d?part"),
        ):
            if s[key] and s[key] <= now:
                events.append(
                    {
                        "id": s["id_work_session"] * 3 + index,
                        "id_user": s["id_user"],
                        "type": kind,
                        "at": utc(s[key]),
                        "label": label,
                    }
                )
        if session_view(s, data, now)["status"] in {"late", "missing"}:
            events.append(
                {
                    "id": s["id_work_session"] * 3 + 2,
                    "id_user": s["id_user"],
                    "type": "alert",
                    "at": utc(s["start_at"]),
                    "label": "anomalie de pointage",
                }
            )
    return sorted(events, key=lambda e: e["at"], reverse=True)[:limit]
