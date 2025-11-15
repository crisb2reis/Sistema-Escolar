from datetime import datetime
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceMethod
from app.db.redis_client import get_redis
import uuid


async def register_attendance(
    db: Session,
    session_id: str,
    student_id: str,
    device_id: str = None,
    geo_lat: float = None,
    geo_lon: float = None
) -> Attendance:
    """Registra presença de um aluno"""
    # Lock distribuído usando Redis para evitar race conditions
    redis_client = get_redis()
    lock_key = f"attendance_lock:{session_id}:{student_id}"
    
    # Tentar adquirir lock (expira em 5 segundos)
    lock_acquired = redis_client.set(lock_key, "locked", ex=5, nx=True)
    
    if not lock_acquired:
        raise ValueError("Another check-in is in progress")
    
    try:
        # Criar registro de presença
        attendance = Attendance(
            id=uuid.uuid4(),
            session_id=session_id,
            student_id=student_id,
            timestamp=datetime.utcnow(),
            method=AttendanceMethod.QRCODE,
            device_id=device_id,
            geo_lat=geo_lat,
            geo_lon=geo_lon
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return attendance
    finally:
        # Liberar lock
        redis_client.delete(lock_key)



