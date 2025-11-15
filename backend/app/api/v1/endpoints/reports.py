from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.base import get_db
from app.api.v1.dependencies import get_current_teacher_or_admin, get_current_user
from app.models.user import User
from app.models.attendance import Attendance
from app.models.session import Session as SessionModel
from app.models.student import Student
from app.api.v1.schemas.report import AttendanceResponse, StudentAttendanceResponse
from app.services.report_service import generate_csv_report, generate_xlsx_report, generate_pdf_report
import io

router = APIRouter()


@router.get("/sessions/{session_id}/attendances", response_model=List[AttendanceResponse])
async def get_session_attendances(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista presenças de uma sessão"""
    # Verificar se sessão existe
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verificar permissão (professor da sessão ou admin)
    if current_user.role.value != "admin" and session.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this session"
        )
    
    attendances = db.query(Attendance).filter(
        Attendance.session_id == session_id
    ).all()
    
    return attendances


@router.get("/students/{student_id}/attendance", response_model=List[StudentAttendanceResponse])
async def get_student_attendance(
    student_id: str,
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Histórico de presenças de um aluno"""
    # Verificar se aluno existe
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verificar permissão (próprio aluno, professor ou admin)
    if (current_user.role.value not in ["admin", "teacher"] and 
        current_user.id != student.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student's attendance"
        )
    
    query = db.query(Attendance).filter(Attendance.student_id == student.user_id)
    
    if from_date:
        query = query.filter(Attendance.timestamp >= from_date)
    if to_date:
        query = query.filter(Attendance.timestamp <= to_date)
    
    attendances = query.order_by(Attendance.timestamp.desc()).all()
    
    return attendances


@router.get("/classes/{class_id}/report")
async def get_class_report(
    class_id: str,
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Relatório agregado por turma"""
    # Verificar se turma existe
    from app.models.class_model import Class
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Filtrar por mês/ano se fornecido
    query = db.query(Attendance).join(SessionModel).filter(
        SessionModel.class_id == class_id
    )
    
    if month and year:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        query = query.filter(Attendance.timestamp >= start_date, Attendance.timestamp < end_date)
    
    attendances = query.all()
    
    # Agregar dados
    total_sessions = db.query(SessionModel).filter(
        SessionModel.class_id == class_id
    ).count()
    
    students = db.query(Student).filter(Student.class_id == class_id).all()
    
    report_data = {
        "class_id": class_id,
        "class_name": class_obj.name,
        "total_sessions": total_sessions,
        "total_students": len(students),
        "attendances": [
            {
                "student_id": str(att.student_id),
                "session_id": str(att.session_id),
                "timestamp": att.timestamp.isoformat()
            }
            for att in attendances
        ]
    }
    
    return report_data


@router.get("/attendance/csv")
async def export_attendance_csv(
    session_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Exporta relatório de presenças em CSV"""
    csv_content = await generate_csv_report(
        db=db,
        session_id=session_id,
        class_id=class_id,
        student_id=student_id,
        from_date=from_date,
        to_date=to_date
    )
    
    return StreamingResponse(
        io.BytesIO(csv_content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )


@router.get("/attendance/xlsx")
async def export_attendance_xlsx(
    session_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Exporta relatório de presenças em XLSX"""
    xlsx_content = await generate_xlsx_report(
        db=db,
        session_id=session_id,
        class_id=class_id,
        student_id=student_id,
        from_date=from_date,
        to_date=to_date
    )
    
    return StreamingResponse(
        io.BytesIO(xlsx_content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_report.xlsx"}
    )


@router.get("/attendance/pdf")
async def export_attendance_pdf(
    session_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher_or_admin)
):
    """Exporta relatório de presenças em PDF"""
    pdf_content = await generate_pdf_report(
        db=db,
        session_id=session_id,
        class_id=class_id,
        student_id=student_id,
        from_date=from_date,
        to_date=to_date
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=attendance_report.pdf"}
    )



