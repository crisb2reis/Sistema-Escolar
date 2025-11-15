#!/usr/bin/env python3
"""
Script para criar usuário inicial no banco de dados
"""
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.base import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_user(name: str, email: str, password: str, role: str = "teacher"):
    """Cria um usuário no banco de dados"""
    db = SessionLocal()
    
    try:
        # Verificar se usuário já existe
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ Usuário com email {email} já existe!")
            return None
        
        # Validar role
        try:
            user_role = UserRole(role)
        except ValueError:
            print(f"❌ Role inválida: {role}. Use: student, teacher ou admin")
            return None
        
        # Criar usuário
        user = User(
            id=uuid.uuid4(),
            name=name,
            email=email,
            role=user_role,
            password_hash=get_password_hash(password),
            is_active="true",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✅ Usuário criado com sucesso!")
        print(f"   ID: {user.id}")
        print(f"   Nome: {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role.value}")
        print(f"   Senha: {password}")
        
        return user
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar usuário: {e}")
        return None
    finally:
        db.close()


def generate_sql_insert(name: str, email: str, password: str, role: str = "teacher"):
    """Gera SQL INSERT para criar usuário"""
    from app.core.security import get_password_hash
    
    user_id = uuid.uuid4()
    password_hash = get_password_hash(password)
    now = datetime.utcnow()
    
    try:
        user_role = UserRole(role)
    except ValueError:
        print(f"❌ Role inválida: {role}. Use: student, teacher ou admin")
        return None
    
    sql = f"""INSERT INTO public.users
(id, "name", email, "role", password_hash, is_active, created_at, updated_at)
VALUES(
    '{user_id}',
    '{name}',
    '{email}',
    '{user_role.value}',
    '{password_hash}',
    'true',
    '{now.isoformat()}',
    '{now.isoformat()}'
);"""
    
    return sql


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Criar usuário no banco de dados')
    parser.add_argument('--name', required=True, help='Nome do usuário')
    parser.add_argument('--email', required=True, help='Email do usuário')
    parser.add_argument('--password', required=True, help='Senha do usuário')
    parser.add_argument('--role', default='teacher', choices=['student', 'teacher', 'admin'], 
                       help='Role do usuário (default: teacher)')
    parser.add_argument('--sql-only', action='store_true', 
                       help='Apenas gerar SQL, não executar')
    
    args = parser.parse_args()
    
    if args.sql_only:
        sql = generate_sql_insert(args.name, args.email, args.password, args.role)
        if sql:
            print("\nSQL gerado:\n")
            print(sql)
    else:
        create_user(args.name, args.email, args.password, args.role)



