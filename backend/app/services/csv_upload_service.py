import csv
import io
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.class_model import Class
from app.core.security import get_password_hash
from app.core.config import settings
import uuid


async def process_student_csv(
    file,
    db: Session,
    actor_id: str
) -> Dict[str, Any]:
    """Processa arquivo CSV e cria alunos em lote"""
    
    # Ler conteúdo do arquivo
    contents = await file.read()
    
    # Validar tamanho (5MB)
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_size:
        return {
            "total_processed": 0,
            "success_count": 0,
            "error_count": 0,
            "errors": [{"line": 0, "error": f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB"}],
            "message": "File too large"
        }
    
    # Decodificar CSV
    try:
        csv_content = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
    except Exception as e:
        return {
            "total_processed": 0,
            "success_count": 0,
            "error_count": 0,
            "errors": [{"line": 0, "error": f"Error reading CSV: {str(e)}"}],
            "message": "Invalid CSV format"
        }
    
    # Validar colunas obrigatórias
    required_columns = ['name', 'email', 'matricula']
    if not all(col in csv_reader.fieldnames for col in required_columns):
        return {
            "total_processed": 0,
            "success_count": 0,
            "error_count": 0,
            "errors": [{"line": 0, "error": f"Missing required columns. Required: {required_columns}"}],
            "message": "Invalid CSV format"
        }
    
    success_count = 0
    error_count = 0
    errors = []
    
    # Processar cada linha
    for line_num, row in enumerate(csv_reader, start=2):  # Começa em 2 (linha 1 é header)
        try:
            # Validar dados obrigatórios
            name = row.get('name', '').strip()
            email = row.get('email', '').strip().lower()
            matricula = row.get('matricula', '').strip()
            curso = row.get('curso', '').strip() or None
            class_name = row.get('class', '').strip() or row.get('turma', '').strip()
            
            if not name or not email or not matricula:
                errors.append({
                    "line": line_num,
                    "error": "Missing required fields: name, email, or matricula",
                    "data": row
                })
                error_count += 1
                continue
            
            # Validar email
            if '@' not in email:
                errors.append({
                    "line": line_num,
                    "error": "Invalid email format",
                    "data": row
                })
                error_count += 1
                continue
            
            # Verificar se email já existe
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                errors.append({
                    "line": line_num,
                    "error": f"Email already exists: {email}",
                    "data": row
                })
                error_count += 1
                continue
            
            # Verificar se matrícula já existe
            existing_student = db.query(Student).filter(Student.matricula == matricula).first()
            if existing_student:
                errors.append({
                    "line": line_num,
                    "error": f"Matrícula already exists: {matricula}",
                    "data": row
                })
                error_count += 1
                continue
            
            # Buscar turma se fornecida
            class_id = None
            if class_name:
                class_obj = db.query(Class).filter(Class.name == class_name).first()
                if class_obj:
                    class_id = class_obj.id
                else:
                    errors.append({
                        "line": line_num,
                        "error": f"Class not found: {class_name}",
                        "data": row,
                        "warning": True  # Aviso, mas continua
                    })
            
            # Criar usuário
            user = User(
                id=uuid.uuid4(),
                name=name,
                email=email,
                role=UserRole.STUDENT,
                password_hash=get_password_hash("senha123"),  # Senha padrão
                is_active="true"
            )
            db.add(user)
            db.flush()
            
            # Criar estudante
            student = Student(
                id=uuid.uuid4(),
                user_id=user.id,
                matricula=matricula,
                curso=curso,
                class_id=class_id
            )
            db.add(student)
            db.commit()
            
            success_count += 1
            
        except Exception as e:
            db.rollback()
            errors.append({
                "line": line_num,
                "error": f"Error processing line: {str(e)}",
                "data": row
            })
            error_count += 1
            continue
    
    return {
        "total_processed": success_count + error_count,
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors,
        "message": f"Processed {success_count} students successfully, {error_count} errors"
    }



