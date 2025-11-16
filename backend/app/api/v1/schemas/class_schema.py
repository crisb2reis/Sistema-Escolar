from pydantic import BaseModel, field_validator
from typing import Optional
import uuid


class CourseInfo(BaseModel):
    code: str
    name: str

    class Config:
        from_attributes = True


class ClassBase(BaseModel):
    name: str
    course_id: str


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    course_id: Optional[str] = None


class ClassResponse(BaseModel):
    id: str
    course_id: str
    name: str
    course: Optional[CourseInfo] = None

    @field_validator('id', 'course_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True



