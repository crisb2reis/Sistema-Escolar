from pydantic import BaseModel
from typing import Optional


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

    class Config:
        from_attributes = True



