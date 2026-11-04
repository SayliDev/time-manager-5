from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Indicator(BaseModel):
    value: float
    delta: float
    trend: list[float]


class DashboardKpis(BaseModel):
    attendance_rate: Indicator
    avg_weekly_hours: Indicator
    alerts: int


class DashboardHours(BaseModel):
    label: str
    onsite: float
    remote: float


class Presence(BaseModel):
    id_user: int
    presence: Literal["present", "remote", "late", "absent", "off"]
    weekly_hours: float
    last_clock_at: datetime | None


class ActivityEvent(BaseModel):
    id: int
    id_user: int
    type: Literal["arrival", "departure", "alert"]
    at: datetime
    label: str
