from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class AttendanceResponse(BaseModel):
    id: str
    session_id: str
    student_id: str
    timestamp: datetime
    method: str
    device_id: Optional[str]
    geo_lat: Optional[float]
    geo_lon: Optional[float]

    @field_validator('id', 'session_id', 'student_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class StudentAttendanceResponse(BaseModel):
    id: str
    session_id: str
    timestamp: datetime
    method: str

    @field_validator('id', 'session_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True



