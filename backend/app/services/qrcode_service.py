import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel
from app.models.qrcode_token import QRCodeToken, QRTokenStatus
from app.core.security import create_qr_token, verify_qr_token
from app.core.config import settings
from app.db.redis_client import get_redis


def generate_qr_code(token: str, use_deep_link: bool = True) -> str:
    """Gera imagem QR Code em base64 a partir de um token
    
    Args:
        token: Token JWT para o QR code
        use_deep_link: Se True, usa deep link do app mobile. Se False, usa apenas o token.
    """
    # Se usar deep link, criar URL que abre o app mobile
    if use_deep_link:
        # Deep link format: frequenciaescolar://checkin?token=TOKEN
        # Isso permite que o app mobile seja aberto automaticamente
        qr_data = f"frequenciaescolar://checkin?token={token}"
    else:
        # Usar apenas o token (compatibilidade com versões antigas)
        qr_data = token
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converter para base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str


async def create_qr_token_for_session(
    db: Session,
    session_id: str,
    expires_in_minutes: Optional[int] = None
) -> dict:
    """Cria um novo token QR para uma sessão"""
    # Verificar se sessão existe e está aberta
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise ValueError("Session not found")
    
    if session.status.value != "open":
        raise ValueError("Session is not open")
    
    # Gerar nonce único
    nonce = str(uuid.uuid4())
    
    # Criar token JWT assinado
    expire_minutes = expires_in_minutes or settings.QR_TOKEN_EXPIRE_MINUTES
    token = create_qr_token(session_id, nonce, expire_minutes)
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
    
    # Gerar token_id único
    token_id = str(uuid.uuid4())
    
    # Salvar token no banco
    qr_token = QRCodeToken(
        id=uuid.uuid4(),
        session_id=session_id,
        token_id=token_id,
        jwt_payload=token,
        nonce=nonce,
        expires_at=expires_at,
        status=QRTokenStatus.ACTIVE
    )
    db.add(qr_token)
    db.commit()
    
    # Armazenar nonce no Redis com TTL
    redis_client = get_redis()
    redis_key = f"qr_token:nonce:{nonce}"
    redis_client.setex(redis_key, expire_minutes * 60, "active")
    
    # Gerar QR Code com deep link para abrir o app mobile
    qr_image_base64 = generate_qr_code(token, use_deep_link=True)
    
    return {
        "token_id": token_id,
        "token": token,
        "qr_image_base64": qr_image_base64,
        "expires_at": expires_at.isoformat()
    }


def validate_qr_token(
    db: Session,
    token: str
) -> dict:
    """Valida token do QR Code"""
    # Decodificar token
    payload = verify_qr_token(token)
    if not payload:
        return {"valid": False, "error": "Invalid token signature"}
    
    # Verificar expiração
    exp_timestamp = payload.get("exp")
    if datetime.utcnow().timestamp() > exp_timestamp:
        return {"valid": False, "error": "Token expired"}
    
    session_id = payload.get("session_id")
    nonce = payload.get("nonce")
    
    # Verificar se nonce foi usado (Redis)
    redis_client = get_redis()
    redis_key = f"qr_token:nonce:{nonce}"
    nonce_status = redis_client.get(redis_key)
    
    if nonce_status is None:
        return {"valid": False, "error": "Token already used or expired"}
    
    if nonce_status == "used":
        return {"valid": False, "error": "Token already used"}
    
    # Verificar token no banco
    qr_token = db.query(QRCodeToken).filter(
        QRCodeToken.nonce == nonce,
        QRCodeToken.session_id == session_id
    ).first()
    
    if not qr_token:
        return {"valid": False, "error": "Token not found"}
    
    if qr_token.status != QRTokenStatus.ACTIVE:
        return {"valid": False, "error": "Token is not active"}
    
    return {
        "valid": True,
        "session_id": session_id,
        "nonce": nonce,
        "qr_token_id": str(qr_token.id)
    }


def mark_qr_token_as_used(
    db: Session,
    nonce: str,
    qr_token_id: str
):
    """Marca token como usado"""
    # Marcar no Redis
    redis_client = get_redis()
    redis_key = f"qr_token:nonce:{nonce}"
    redis_client.set(redis_key, "used")
    
    # Marcar no banco
    qr_token = db.query(QRCodeToken).filter(QRCodeToken.id == qr_token_id).first()
    if qr_token:
        qr_token.status = QRTokenStatus.USED
        db.commit()

