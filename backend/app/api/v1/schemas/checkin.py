from pydantic import BaseModel
from typing import Optional, Dict


class GeoLocation(BaseModel):
    lat: float
    lon: float


class CheckInRequest(BaseModel):
    token: str
    device_id: Optional[str] = None
    geo: Optional[Dict[str, float]] = None


class CheckInResponse(BaseModel):
    status: str
    timestamp: str
    attendance_id: str



