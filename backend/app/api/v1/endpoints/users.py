from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.api.v1.dependencies import get_current_active_admin
from app.models.user import User
from app.api.v1.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash
from app.services.audit_service import log_audit
import uuid

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Lista todos os usuários"""
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Obtém detalhes de um usuário"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Cria um novo usuário"""
    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Criar usuário
    user = User(
        id=uuid.uuid4(),
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        password_hash=get_password_hash(user_data.password),
        is_active="true"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="create_user",
        details={"user_id": str(user.id), "email": user.email, "role": user.role.value}
    )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualiza dados de um usuário"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Não permitir que admin desative a si mesmo
    if user_id == str(current_user.id) and user_data.is_active == "false":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    # Atualizar campos
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        # Verificar se email já existe em outro usuário
        existing_user = db.query(User).filter(User.email == user_data.email, User.id != user.id).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_data.email
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="update_user",
        details={"user_id": str(user.id), "email": user.email}
    )
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Deleta um usuário"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Não permitir que admin delete a si mesmo
    if user_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    await log_audit(
        db=db,
        actor_id=current_user.id,
        action="delete_user",
        details={"user_id": str(user.id), "email": user.email}
    )
    
    db.delete(user)
    db.commit()
    
    return None

