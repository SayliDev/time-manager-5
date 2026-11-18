from datetime import date, timedelta


DAY_NAMES = ("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")


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
