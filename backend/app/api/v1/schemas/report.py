from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AttendanceResponse(BaseModel):
    id: str
    session_id: str
    student_id: str
    timestamp: datetime
    method: str
    device_id: Optional[str]
    geo_lat: Optional[float]
    geo_lon: Optional[float]

    class Config:
        from_attributes = True


class StudentAttendanceResponse(BaseModel):
    id: str
    session_id: str
    timestamp: datetime
    method: str

    class Config:
        from_attributes = True



