import csv
import io
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.session import Session as SessionModel
from app.models.student import Student
from app.models.user import User
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors


async def generate_csv_report(
    db: Session,
    session_id: Optional[str] = None,
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
) -> str:
    """Gera relatório CSV de presenças"""
    query = db.query(Attendance)
    
    if session_id:
        query = query.filter(Attendance.session_id == session_id)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if from_date:
        query = query.filter(Attendance.timestamp >= from_date)
    if to_date:
        query = query.filter(Attendance.timestamp <= to_date)
    if class_id:
        query = query.join(SessionModel).filter(SessionModel.class_id == class_id)
    
    attendances = query.all()
    
    # Criar CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Session ID", "Student ID", "Student Name", "Timestamp", "Method", "Device ID"])
    
    # Dados
    for att in attendances:
        user = db.query(User).filter(User.id == att.student_id).first()
        student_name = user.name if user else "Unknown"
        
        writer.writerow([
            str(att.id),
            str(att.session_id),
            str(att.student_id),
            student_name,
            att.timestamp.isoformat(),
            att.method.value,
            att.device_id or ""
        ])
    
    return output.getvalue()


async def generate_xlsx_report(
    db: Session,
    session_id: Optional[str] = None,
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
) -> bytes:
    """Gera relatório XLSX de presenças"""
    query = db.query(Attendance)
    
    if session_id:
        query = query.filter(Attendance.session_id == session_id)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if from_date:
        query = query.filter(Attendance.timestamp >= from_date)
    if to_date:
        query = query.filter(Attendance.timestamp <= to_date)
    if class_id:
        query = query.join(SessionModel).filter(SessionModel.class_id == class_id)
    
    attendances = query.all()
    
    # Criar workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Attendance Report"
    
    # Header
    ws.append(["ID", "Session ID", "Student ID", "Student Name", "Timestamp", "Method", "Device ID"])
    
    # Dados
    for att in attendances:
        student = db.query(Student).join(User).filter(Student.user_id == att.student_id).first()
        if student:
            user = db.query(User).filter(User.id == att.student_id).first()
            student_name = user.name if user else "Unknown"
        else:
            student_name = "Unknown"
        
        ws.append([
            str(att.id),
            str(att.session_id),
            str(att.student_id),
            student_name,
            att.timestamp.isoformat(),
            att.method.value,
            att.device_id or ""
        ])
    
    # Salvar em bytes
    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()


async def generate_pdf_report(
    db: Session,
    session_id: Optional[str] = None,
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
) -> bytes:
    """Gera relatório PDF de presenças"""
    query = db.query(Attendance)
    
    if session_id:
        query = query.filter(Attendance.session_id == session_id)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if from_date:
        query = query.filter(Attendance.timestamp >= from_date)
    if to_date:
        query = query.filter(Attendance.timestamp <= to_date)
    if class_id:
        query = query.join(SessionModel).filter(SessionModel.class_id == class_id)
    
    attendances = query.all()
    
    # Criar PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Título
    title = Paragraph("Attendance Report", styles['Title'])
    elements.append(title)
    elements.append(Paragraph("<br/>", styles['Normal']))
    
    # Tabela
    data = [["ID", "Session ID", "Student Name", "Timestamp", "Method"]]
    
    for att in attendances:
        student = db.query(Student).join(User).filter(Student.user_id == att.student_id).first()
        if student:
            user = db.query(User).filter(User.id == att.student_id).first()
            student_name = user.name if user else "Unknown"
        else:
            student_name = "Unknown"
        
        data.append([
            str(att.id)[:8],
            str(att.session_id)[:8],
            student_name,
            att.timestamp.strftime("%Y-%m-%d %H:%M"),
            att.method.value
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    return buffer.getvalue()

