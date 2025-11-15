from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.api.v1.dependencies import get_current_active_admin
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.class_model import Class
from app.api.v1.schemas.student import StudentCreate, StudentResponse, StudentUpdate, CSVUploadResponse
from app.core.security import get_password_hash
from app.services.csv_upload_service import process_student_csv
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria um novo aluno"""
    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == student_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verificar se matrícula já existe
    existing_student = db.query(Student).filter(Student.matricula == student_data.matricula).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matrícula already registered"
        )
    
    # Verificar se turma existe
    if student_data.class_id:
        class_obj = db.query(Class).filter(Class.id == student_data.class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
    
    # Criar usuário
    user = User(
        id=uuid.uuid4(),
        name=student_data.name,
        email=student_data.email,
        role=UserRole.STUDENT,
        password_hash=get_password_hash(student_data.password or "senha123"),  # Senha padrão
        is_active="true"
    )
    db.add(user)
    db.flush()
    
    # Criar estudante
    student = Student(
        id=uuid.uuid4(),
        user_id=user.id,
        matricula=student_data.matricula,
        curso=student_data.curso,
        class_id=student_data.class_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_student",
        details={"student_id": str(student.id), "matricula": student.matricula}
    )
    
    return student


@router.get("/", response_model=List[StudentResponse])
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Lista todos os alunos"""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obtém detalhes de um aluno"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza dados de um aluno"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    user = db.query(User).filter(User.id == student.user_id).first()
    
    # Atualizar campos
    if student_data.name:
        user.name = student_data.name
    if student_data.email:
        existing_user = db.query(User).filter(User.email == student_data.email, User.id != user.id).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = student_data.email
    if student_data.curso is not None:
        student.curso = student_data.curso
    if student_data.class_id is not None:
        if student_data.class_id:
            class_obj = db.query(Class).filter(Class.id == student_data.class_id).first()
            if not class_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class not found"
                )
        student.class_id = student_data.class_id
    
    db.commit()
    db.refresh(student)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_student",
        details={"student_id": str(student.id)}
    )
    
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deleta um aluno"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_student",
        details={"student_id": str(student.id), "matricula": student.matricula}
    )
    
    db.delete(student)
    db.commit()
    
    return None


@router.post("/upload-csv", response_model=CSVUploadResponse, status_code=status.HTTP_200_OK)
async def upload_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Upload de arquivo CSV para criação em lote de alunos"""
    # Validar extensão
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    # Processar CSV
    result = await process_student_csv(file, db, current_user.id)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="upload_students_csv",
        details={
            "filename": file.filename,
            "total_processed": result["total_processed"],
            "success_count": result["success_count"],
            "error_count": result["error_count"]
        }
    )
    
    return result



