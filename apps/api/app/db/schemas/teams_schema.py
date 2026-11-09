from pydantic import BaseModel


class Team(BaseModel):
    id_team: int
    name: str
    description: str | None
    id_manager: int
    member_ids: list[int]
    avg_weekly_hours: float
    attendance_rate: float
