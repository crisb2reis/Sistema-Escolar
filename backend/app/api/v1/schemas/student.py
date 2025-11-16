from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class StudentBase(BaseModel):
    name: str
    email: EmailStr
    matricula: str
    curso: Optional[str] = None
    class_id: Optional[str] = None
    password: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    curso: Optional[str] = None
    class_id: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    user_id: str
    matricula: str
    curso: Optional[str]
    class_id: Optional[str]
    user: Optional[Dict[str, Any]] = None

    @field_validator('id', 'user_id', 'class_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class CSVUploadResponse(BaseModel):
    total_processed: int
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]] = []
    message: str



