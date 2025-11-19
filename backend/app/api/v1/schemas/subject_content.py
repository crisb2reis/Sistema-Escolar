from pydantic import BaseModel, field_validator
from typing import Optional, List
import uuid
from datetime import date


class SubjectContentBase(BaseModel):
    date: date
    sessions: int
    content: Optional[str] = None
    observation: Optional[str] = None
    bimester: Optional[str] = None


class SubjectContentCreate(SubjectContentBase):
    pass


class SubjectContentUpdate(BaseModel):
    date: Optional[date] = None
    sessions: Optional[int] = None
    content: Optional[str] = None
    observation: Optional[str] = None
    bimester: Optional[str] = None


class SubjectContentResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    date: date
    sessions: int
    content: Optional[str] = None
    observation: Optional[str] = None
    bimester: Optional[str] = None

    @field_validator('id', 'class_id', 'subject_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True
