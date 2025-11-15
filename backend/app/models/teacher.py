from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
from app.db.base import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    departamento = Column(String, nullable=True)

    # Relacionamentos
    user = relationship("User", back_populates="teacher")
    sessions = relationship(
        "Session",
        primaryjoin="Teacher.user_id == foreign(Session.teacher_id)",
        foreign_keys="[Session.teacher_id]",
        viewonly=True
    )

