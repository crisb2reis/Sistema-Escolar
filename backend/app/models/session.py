from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.orm import remote
import uuid
import enum
from datetime import datetime
from app.db.base import Base


class SessionStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=True)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.OPEN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    class_obj = relationship("Class", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
    teacher = relationship(
        "Teacher",
        primaryjoin="Session.teacher_id == foreign(Teacher.user_id)",
        foreign_keys="[Session.teacher_id]",
        viewonly=True
    )
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")
    qr_tokens = relationship("QRCodeToken", back_populates="session", cascade="all, delete-orphan")

