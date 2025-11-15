from pydantic import BaseModel
from typing import Optional


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

    class Config:
        from_attributes = True



