from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    name = Column(String, nullable=False)

    # Relacionamentos
    course = relationship("Course", back_populates="classes")
    students = relationship("Student", back_populates="class_obj")
    schedules = relationship("Schedule", back_populates="class_obj", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="class_obj")



