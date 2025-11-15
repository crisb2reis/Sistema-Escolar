from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Float, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
import uuid
import enum
from datetime import datetime
from app.db.base import Base


class AttendanceMethod(str, enum.Enum):
    QRCODE = "qrcode"
    MANUAL = "manual"


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    method = Column(SQLEnum(AttendanceMethod), default=AttendanceMethod.QRCODE, nullable=False)
    device_id = Column(String, nullable=True)
    geo_lat = Column(Float, nullable=True)
    geo_lon = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    # Relacionamentos
    session = relationship("Session", back_populates="attendances")
    student = relationship(
        "Student",
        primaryjoin="Attendance.student_id == foreign(Student.user_id)",
        foreign_keys="[Attendance.student_id]",
        viewonly=True
    )

    # Constraint único: um aluno só pode ter uma presença por sessão
    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='unique_session_student'),
    )

