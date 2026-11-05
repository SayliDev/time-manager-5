"""Schemas Pydantic pour l'inscription."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.passwords import MAX_PASSWORD_BYTES
def check_password_rules(value:str) -> str:
    if len(value) < 8:
        raise ValueError("Minimum 8 caratères")
    if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
        raise ValueError("Au moins une lettre et un chiffre")
    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError("72 octets maximum")
    return value

class RegisterRequest(BaseModel):
    first_name: str = Field(max_length=50)
    last_name: str = Field(max_length=50)
    email: EmailStr
    password: str

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Champ obligatoire")
        return value

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def password_rules(cls, value: str) -> str:
        return check_password_rules(value)


class UserOut(BaseModel):
    id_user: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    phone: str | None = None
    creat_at: datetime

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=200)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_rules(cls, value: str) -> str:
        return check_password_rules(value)