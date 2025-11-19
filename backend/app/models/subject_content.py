from sqlalchemy import Column, String, Date, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base


class SubjectContent(Base):
    __tablename__ = "subject_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    bimester = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    sessions = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=True)
    observation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    class_obj = relationship("Class", back_populates="subject_contents")
    subject = relationship("Subject", back_populates="subject_contents")
