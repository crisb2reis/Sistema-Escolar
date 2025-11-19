from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db.base import get_db
from app.api.v1.dependencies import get_current_active_admin, get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.class_subject import ClassSubject
from app.models.course import Course
from app.models.class_model import Class
from app.api.v1.schemas.subject import (
    SubjectCreate, 
    SubjectResponse, 
    SubjectUpdate,
    ClassSubjectCreate,
    ClassSubjectResponse
)
from app.models.subject_content import SubjectContent
from app.api.v1.schemas.subject_content import (
    SubjectContentCreate,
    SubjectContentResponse,
    SubjectContentUpdate,
)
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria uma nova disciplina"""
    # Verificar se código já existe para o curso
    existing_subject = db.query(Subject).filter(
        Subject.code == subject_data.code,
        Subject.course_id == subject_data.course_id
    ).first()
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject code already exists for this course"
        )
    
    # Verificar se curso existe
    course = db.query(Course).filter(Course.id == subject_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    subject = Subject(
        id=uuid.uuid4(),
        code=subject_data.code,
        name=subject_data.name,
        course_id=subject_data.course_id
    )
    db.add(subject)
    db.flush()  # Flush para obter o ID sem fazer commit ainda
    
    # Associar disciplina às turmas se fornecidas
    if subject_data.class_ids:
        for class_id in subject_data.class_ids:
            # Verificar se turma existe
            class_obj = db.query(Class).filter(Class.id == class_id).first()
            if not class_obj:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Class {class_id} not found"
                )
            
            # Verificar se turma pertence ao curso da disciplina
            if class_obj.course_id != subject.course_id:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Class {class_id} does not belong to the subject's course"
                )
            
            # Verificar se associação já existe
            existing = db.query(ClassSubject).filter(
                ClassSubject.class_id == class_id,
                ClassSubject.subject_id == subject.id
            ).first()
            
            if not existing:
                class_subject = ClassSubject(
                    id=uuid.uuid4(),
                    class_id=class_id,
                    subject_id=subject.id
                )
                db.add(class_subject)
    
    db.commit()
    # Recarregar com o relacionamento course
    subject = db.query(Subject).options(joinedload(Subject.course)).filter(Subject.id == subject.id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_subject",
        details={
            "subject_id": str(subject.id),
            "code": subject.code,
            "class_ids": subject_data.class_ids or []
        }
    )
    
    return subject


@router.get("/", response_model=List[SubjectResponse])
async def list_subjects(
    skip: int = 0,
    limit: int = 100,
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Lista todas as disciplinas"""
    query = db.query(Subject).options(joinedload(Subject.course))
    
    if course_id:
        query = query.filter(Subject.course_id == course_id)
    
    subjects = query.offset(skip).limit(limit).all()
    return subjects


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obtém detalhes de uma disciplina"""
    subject = db.query(Subject).options(joinedload(Subject.course)).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza dados de uma disciplina"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    if subject_data.code:
        existing_subject = db.query(Subject).filter(
            Subject.code == subject_data.code,
            Subject.id != subject_id
        ).first()
        if existing_subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject code already exists"
            )
        subject.code = subject_data.code
    
    if subject_data.name:
        subject.name = subject_data.name
    
    if subject_data.course_id:
        course = db.query(Course).filter(Course.id == subject_data.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        subject.course_id = subject_data.course_id
    
    db.commit()
    # Recarregar com o relacionamento course
    subject = db.query(Subject).options(joinedload(Subject.course)).filter(Subject.id == subject_id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_subject",
        details={"subject_id": str(subject.id)}
    )
    
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deleta uma disciplina"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_subject",
        details={"subject_id": str(subject.id), "code": subject.code}
    )
    
    db.delete(subject)
    db.commit()
    
    return None


# Endpoints para ClassSubject (associação Turma-Disciplina)

@router.post("/classes/{class_id}/subjects", response_model=ClassSubjectResponse, status_code=status.HTTP_201_CREATED)
async def add_subject_to_class(
    class_id: str,
    subject_data: ClassSubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Associa uma disciplina a uma turma"""
    # Verificar se turma existe
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Verificar se disciplina existe
    subject = db.query(Subject).filter(Subject.id == subject_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Verificar se disciplina pertence ao curso da turma
    if subject.course_id != class_obj.course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject does not belong to the class's course"
        )
    
    # Verificar se associação já existe
    existing = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_data.subject_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject already associated with this class"
        )
    
    class_subject = ClassSubject(
        id=uuid.uuid4(),
        class_id=class_id,
        subject_id=subject_data.subject_id
    )
    db.add(class_subject)
    db.commit()
    # Recarregar com relacionamentos
    class_subject = db.query(ClassSubject).options(
        joinedload(ClassSubject.subject)
    ).filter(ClassSubject.id == class_subject.id).first()
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="add_subject_to_class",
        details={"class_id": class_id, "subject_id": subject_data.subject_id}
    )
    
    return class_subject


@router.get("/classes/{class_id}/subjects", response_model=List[ClassSubjectResponse])
async def get_class_subjects(
    class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as disciplinas de uma turma"""
    # Verificar se turma existe
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    class_subjects = db.query(ClassSubject).options(
        joinedload(ClassSubject.subject)
    ).filter(ClassSubject.class_id == class_id).all()
    
    return class_subjects


@router.delete("/classes/{class_id}/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_subject_from_class(
    class_id: str,
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Remove a associação de uma disciplina com uma turma"""
    class_subject = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_id
    ).first()
    
    if not class_subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not associated with this class"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="remove_subject_from_class",
        details={"class_id": class_id, "subject_id": subject_id}
    )
    
    db.delete(class_subject)
    db.commit()
    
    return None


# Endpoints para conteúdo programático (SubjectContent)


@router.get("/{subject_id}/classes/{class_id}/contents", response_model=List[SubjectContentResponse])
async def list_subject_contents(
    subject_id: str,
    class_id: str,
    bimester: Optional[str] = Query(None, description="Filter by bimester"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista conteúdos programáticos para uma disciplina em uma turma (opcionalmente por bimestre)"""
    # Verificar se turma e disciplina existem
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    query = db.query(SubjectContent).filter(
        SubjectContent.class_id == class_id,
        SubjectContent.subject_id == subject_id
    )
    if bimester:
        query = query.filter(SubjectContent.bimester == bimester)

    contents = query.order_by(SubjectContent.date.desc()).all()
    return contents


@router.post("/{subject_id}/classes/{class_id}/contents", response_model=SubjectContentResponse, status_code=status.HTTP_201_CREATED)
async def create_subject_content(
    subject_id: str,
    class_id: str,
    content_data: SubjectContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria um item de conteúdo programático para a disciplina/turma"""
    # Verificar se turma e disciplina existem
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # (Opcional) verificar se a disciplina está associada à turma
    existing_assoc = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_id
    ).first()
    if not existing_assoc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject is not associated with this class")

    subject_content = SubjectContent(
        id=uuid.uuid4(),
        class_id=class_id,
        subject_id=subject_id,
        bimester=content_data.bimester,
        date=content_data.date,
        sessions=content_data.sessions,
        content=content_data.content,
        observation=content_data.observation,
    )
    db.add(subject_content)
    db.commit()
    db.refresh(subject_content)

    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_subject_content",
        details={"id": str(subject_content.id), "class_id": class_id, "subject_id": subject_id}
    )

    return subject_content


@router.put("/{subject_id}/classes/{class_id}/contents/{content_id}", response_model=SubjectContentResponse)
async def update_subject_content(
    subject_id: str,
    class_id: str,
    content_id: str,
    content_data: SubjectContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza um item de conteúdo programático"""
    subject_content = db.query(SubjectContent).filter(SubjectContent.id == content_id, SubjectContent.class_id == class_id, SubjectContent.subject_id == subject_id).first()
    if not subject_content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    if content_data.date is not None:
        subject_content.date = content_data.date
    if content_data.sessions is not None:
        subject_content.sessions = content_data.sessions
    if content_data.content is not None:
        subject_content.content = content_data.content
    if content_data.observation is not None:
        subject_content.observation = content_data.observation
    if content_data.bimester is not None:
        subject_content.bimester = content_data.bimester

    db.commit()
    db.refresh(subject_content)

    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_subject_content",
        details={"id": str(subject_content.id)}
    )

    return subject_content


@router.delete("/{subject_id}/classes/{class_id}/contents/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject_content(
    subject_id: str,
    class_id: str,
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    subject_content = db.query(SubjectContent).filter(SubjectContent.id == content_id, SubjectContent.class_id == class_id, SubjectContent.subject_id == subject_id).first()
    if not subject_content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_subject_content",
        details={"id": str(subject_content.id)}
    )

    db.delete(subject_content)
    db.commit()

    return None

