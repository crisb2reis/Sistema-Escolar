from pydantic import BaseModel, field_validator
from typing import Optional, List
import uuid


class CourseInfo(BaseModel):
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


class SubjectBase(BaseModel):
    code: str
    name: str
    course_id: str


class SubjectCreate(SubjectBase):
    class_ids: Optional[List[str]] = None


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    course_id: Optional[str] = None


class SubjectResponse(BaseModel):
    id: str
    code: str
    name: str
    course_id: str
    course: Optional[CourseInfo] = None

    @field_validator('id', 'course_id', mode='before')
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


class ClassSubjectCreate(BaseModel):
    subject_id: str


class ClassSubjectResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    subject: Optional[SubjectInfo] = None

    @field_validator('id', 'class_id', 'subject_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


