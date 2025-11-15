from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.api.v1.dependencies import get_current_student
from app.models.user import User
from app.models.student import Student
from app.models.session import Session as SessionModel
from app.models.attendance import Attendance, AttendanceMethod
from app.api.v1.schemas.checkin import CheckInRequest, CheckInResponse
from app.services.qrcode_service import validate_qr_token, mark_qr_token_as_used
from app.services.attendance_service import register_attendance
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.post("/", response_model=CheckInResponse, status_code=status.HTTP_200_OK)
async def check_in(
    checkin_data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Endpoint principal de check-in via QR Code"""
    # Validar token do QR
    validation_result = validate_qr_token(db, checkin_data.token)
    
    if not validation_result.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation_result.get("error", "Invalid QR token")
        )
    
    session_id = validation_result["session_id"]
    nonce = validation_result["nonce"]
    qr_token_id = validation_result["qr_token_id"]
    
    # Verificar se sessão existe e está aberta
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status.value != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not open"
        )
    
    # Verificar se aluno pertence à turma da sessão
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    if student.class_id != session.class_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student does not belong to this class"
        )
    
    # Verificar se já existe presença (duplicata)
    existing_attendance = db.query(Attendance).filter(
        Attendance.session_id == session_id,
        Attendance.student_id == current_user.id
    ).first()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already registered"
        )
    
    # Registrar presença
    attendance = await register_attendance(
        db=db,
        session_id=session_id,
        student_id=current_user.id,
        device_id=checkin_data.device_id,
        geo_lat=checkin_data.geo.get("lat") if checkin_data.geo else None,
        geo_lon=checkin_data.geo.get("lon") if checkin_data.geo else None
    )
    
    # Marcar token como usado
    mark_qr_token_as_used(db, nonce, qr_token_id)
    
    # Log de auditoria
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="check_in",
        details={
            "session_id": str(session_id),
            "attendance_id": str(attendance.id),
            "device_id": checkin_data.device_id
        }
    )
    
    return {
        "status": "present",
        "timestamp": attendance.timestamp.isoformat(),
        "attendance_id": str(attendance.id)
    }



