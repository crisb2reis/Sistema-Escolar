from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    matricula = Column(String, unique=True, nullable=False, index=True)
    curso = Column(String, nullable=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)

    # Relacionamentos
    user = relationship("User", back_populates="student")
    class_obj = relationship("Class", back_populates="students")
    attendances = relationship(
        "Attendance", 
        primaryjoin="Student.user_id == foreign(Attendance.student_id)",
        foreign_keys="[Attendance.student_id]",
        viewonly=True
    )

