from sqlalchemy import Column, String, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    weekday = Column(String, nullable=False)  # "monday", "tuesday", etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relacionamentos
    class_obj = relationship("Class", back_populates="schedules")



