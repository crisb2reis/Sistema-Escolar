from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False, index=True)
    details = Column(JSONB, nullable=True)  # Detalhes adicionais em JSON
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relacionamento
    actor = relationship("User")



