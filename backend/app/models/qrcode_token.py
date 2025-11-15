from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.db.base import Base


class QRTokenStatus(str, enum.Enum):
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"


class QRCodeToken(Base):
    __tablename__ = "qrcode_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    token_id = Column(String, unique=True, nullable=False, index=True)
    jwt_payload = Column(String, nullable=False)  # Token completo para validação
    nonce = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(SQLEnum(QRTokenStatus), default=QRTokenStatus.ACTIVE, nullable=False)

    # Relacionamentos
    session = relationship("Session", back_populates="qr_tokens")



