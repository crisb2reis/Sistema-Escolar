from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.api.v1.dependencies import get_current_active_admin
from app.models.user import User
from app.models.course import Course
from app.api.v1.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria um novo curso/disciplina"""
    # Verificar se código já existe
    existing_course = db.query(Course).filter(Course.code == course_data.code).first()
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course code already exists"
        )
    
    course = Course(
        id=uuid.uuid4(),
        code=course_data.code,
        name=course_data.name
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_course",
        details={"course_id": str(course.id), "code": course.code}
    )
    
    return course


@router.get("/", response_model=List[CourseResponse])
async def list_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Lista todos os cursos"""
    courses = db.query(Course).offset(skip).limit(limit).all()
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obtém detalhes de um curso"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza dados de um curso"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course_data.code:
        existing_course = db.query(Course).filter(
            Course.code == course_data.code,
            Course.id != course_id
        ).first()
        if existing_course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists"
            )
        course.code = course_data.code
    
    if course_data.name:
        course.name = course_data.name
    
    db.commit()
    db.refresh(course)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_course",
        details={"course_id": str(course.id)}
    )
    
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deleta um curso"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_course",
        details={"course_id": str(course.id), "code": course.code}
    )
    
    db.delete(course)
    db.commit()
    
    return None



