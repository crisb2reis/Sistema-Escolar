from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.db.base import get_db
from app.api.v1.dependencies import get_current_teacher_or_admin, get_current_user, get_current_active_admin
from app.models.user import User
from app.models.session import Session as SessionModel, SessionStatus
from app.models.class_model import Class
from app.api.v1.schemas.session import SessionCreate, SessionResponse, QRCodeResponse
from app.services.qrcode_service import create_qr_token_for_session
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as sessões"""
    # Admin vê todas as sessões, professores veem apenas as suas
    if current_user.role.value == "admin":
        sessions = db.query(SessionModel).options(
            joinedload(SessionModel.class_obj)
        ).offset(skip).limit(limit).order_by(SessionModel.created_at.desc()).all()
    else:
        # Professores veem apenas suas sessões
        sessions = db.query(SessionModel).options(
            joinedload(SessionModel.class_obj)
        ).filter(SessionModel.teacher_id == current_user.id).offset(skip).limit(limit).order_by(SessionModel.created_at.desc()).all()
    
    return sessions


@router.post("/classes/{class_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    class_id: str,
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Cria uma nova sessão de aula"""
    # Verificar se turma existe
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Criar sessão
    session = SessionModel(
        id=uuid.uuid4(),
        class_id=class_id,
        teacher_id=current_user.id,
        start_at=session_data.start_at or datetime.utcnow(),
        status=SessionStatus.OPEN
    )
    db.add(session)
    db.commit()
    # Recarregar com o relacionamento class_obj
    session = db.query(SessionModel).options(joinedload(SessionModel.class_obj)).filter(SessionModel.id == session.id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_session",
        details={"session_id": str(session.id), "class_id": class_id}
    )
    
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém detalhes de uma sessão"""
    session = db.query(SessionModel).options(joinedload(SessionModel.class_obj)).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


@router.put("/{session_id}/close", response_model=SessionResponse)
async def close_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Encerra uma sessão"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verificar se usuário tem permissão (professor da sessão ou admin)
    if current_user.role.value != "admin" and session.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to close this session"
        )
    
    session.status = SessionStatus.CLOSED
    session.end_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="close_session",
        details={"session_id": str(session.id)}
    )
    
    return session


@router.post("/{session_id}/qrcode", response_model=QRCodeResponse)
async def generate_qrcode(
    session_id: str,
    expires_in_minutes: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Gera QR Code para uma sessão"""
    # Verificar se sessão existe
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verificar permissão
    if current_user.role.value != "admin" and session.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate QR for this session"
        )
    
    try:
        result = await create_qr_token_for_session(db, session_id, expires_in_minutes)
        
        await log_audit(
            db=db,
            actor_id=current_user.id,
            action="generate_qrcode",
            details={"session_id": str(session_id), "token_id": result["token_id"]}
        )
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



