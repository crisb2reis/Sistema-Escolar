from pydantic import BaseModel, field_validator
from typing import Optional
import uuid


class CourseBase(BaseModel):
    code: str
    name: str


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None


class CourseResponse(BaseModel):
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



