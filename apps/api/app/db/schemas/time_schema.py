from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

WorkMode = Literal["onsite", "remote"]


class ClockIn(BaseModel):
    mode: WorkMode


class WorkSession(BaseModel):
    id_work_session: int
    date: date
    start_at: datetime
    end_at: datetime | None
    hours: float | None
    mode: WorkMode
    status: Literal["ok", "late", "overtime", "missing", "ongoing"]


class DailyHours(BaseModel):
    date: date
    label: str
    hours: float
    onsite: float
    remote: float


class WeeklyHours(BaseModel):
    week: int
    start: date
    end: date
    hours: float
    days_worked: int


class TimeSummary(BaseModel):
    total_hours: float
    avg_weekly_hours: float
    avg_weekly_hours_delta: float
    overtime_hours: float
    late_count: int
    missing_count: int
