from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)

    # Relacionamentos
    course = relationship("Course", back_populates="subjects")
    class_subjects = relationship("ClassSubject", back_populates="subject", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="subject")


