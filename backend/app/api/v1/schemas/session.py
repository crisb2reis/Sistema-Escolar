from pydantic import BaseModel, field_validator, model_serializer
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class SessionBase(BaseModel):
    start_at: Optional[datetime] = None
    subject_id: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class ClassInfo(BaseModel):
    id: str
    name: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class SubjectInfo(BaseModel):
    id: str
    code: str
    name: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: str
    class_id: str
    teacher_id: str
    subject_id: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime]
    status: str
    created_at: datetime
    class_obj: Optional[ClassInfo] = None
    subject: Optional[SubjectInfo] = None

    @field_validator('id', 'class_id', 'teacher_id', 'subject_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    @model_serializer
    def serialize_model(self):
        """Serializar com 'class' em vez de 'class_obj' para compatibilidade com frontend"""
        return {
            'id': self.id,
            'class_id': self.class_id,
            'teacher_id': self.teacher_id,
            'subject_id': str(self.subject_id) if self.subject_id else None,
            'start_at': self.start_at,
            'end_at': self.end_at,
            'status': self.status,
            'created_at': self.created_at,
            'class': self.class_obj.model_dump() if self.class_obj else None,
            'subject': self.subject.model_dump() if self.subject else None,
        }

    class Config:
        from_attributes = True


class QRCodeResponse(BaseModel):
    token_id: str
    token: str
    qr_image_base64: str
    expires_at: str



