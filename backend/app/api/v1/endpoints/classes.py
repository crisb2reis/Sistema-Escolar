from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.base import get_db
from app.api.v1.dependencies import get_current_active_admin
from app.models.user import User
from app.models.class_model import Class
from app.models.course import Course
from app.api.v1.schemas.class_schema import ClassCreate, ClassResponse, ClassUpdate
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria uma nova turma"""
    # Verificar se curso existe
    course = db.query(Course).filter(Course.id == class_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    class_obj = Class(
        id=uuid.uuid4(),
        course_id=class_data.course_id,
        name=class_data.name
    )
    db.add(class_obj)
    db.commit()
    # Recarregar com o relacionamento course
    class_obj = db.query(Class).options(joinedload(Class.course)).filter(Class.id == class_obj.id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_class",
        details={"class_id": str(class_obj.id), "name": class_obj.name}
    )
    
    return class_obj


@router.get("/", response_model=List[ClassResponse])
async def list_classes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Lista todas as turmas"""
    classes = db.query(Class).options(joinedload(Class.course)).offset(skip).limit(limit).all()
    return classes


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obtém detalhes de uma turma"""
    class_obj = db.query(Class).options(joinedload(Class.course)).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    return class_obj


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    class_data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza dados de uma turma"""
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    if class_data.name:
        class_obj.name = class_data.name
    if class_data.course_id:
        course = db.query(Course).filter(Course.id == class_data.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        class_obj.course_id = class_data.course_id
    
    db.commit()
    # Recarregar com o relacionamento course
    class_obj = db.query(Class).options(joinedload(Class.course)).filter(Class.id == class_id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_class",
        details={"class_id": str(class_obj.id)}
    )
    
    return class_obj


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deleta uma turma"""
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_class",
        details={"class_id": str(class_obj.id), "name": class_obj.name}
    )
    
    db.delete(class_obj)
    db.commit()
    
    return None



