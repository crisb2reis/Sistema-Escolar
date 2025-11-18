from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)

    # Constraint única para evitar duplicatas
    __table_args__ = (
        UniqueConstraint('class_id', 'subject_id', name='unique_class_subject'),
    )

    # Relacionamentos
    class_obj = relationship("Class", back_populates="class_subjects")
    subject = relationship("Subject", back_populates="class_subjects")


