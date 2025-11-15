from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from datetime import datetime
from typing import Optional


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    is_active: str
    created_at: datetime

    @classmethod
    def from_orm(cls, obj):
        """Converte UUID para string"""
        data = {
            "id": str(obj.id),
            "name": obj.name,
            "email": obj.email,
            "role": obj.role,
            "is_active": obj.is_active,
            "created_at": obj.created_at,
        }
        return cls(**data)

    class Config:
        from_attributes = True

