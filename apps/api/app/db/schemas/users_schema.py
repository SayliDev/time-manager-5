from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str = "employe"
    phone: str | None = None


class User(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    phone: str | None = None
    created_at: datetime