from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionBase(BaseModel):
    start_at: Optional[datetime] = None


class SessionCreate(SessionBase):
    pass


class SessionResponse(BaseModel):
    id: str
    class_id: str
    teacher_id: str
    start_at: datetime
    end_at: Optional[datetime]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class QRCodeResponse(BaseModel):
    token_id: str
    token: str
    qr_image_base64: str
    expires_at: str



