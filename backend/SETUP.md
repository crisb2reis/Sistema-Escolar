# Guia de Setup - Backend

## Status Atual

✅ Arquivo `.env` criado  
✅ PostgreSQL rodando via Docker  
✅ Migrations criadas e aplicadas  
⚠️ Redis: porta 6379 já está em uso (pode estar rodando em outro container)

## Próximos Passos

### 1. Verificar Redis

Se você já tem Redis rodando em outra porta ou container, pode usar. Caso contrário:

```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não estiver, você pode:
# Opção 1: Usar Redis existente (ajustar REDIS_URL no .env)
# Opção 2: Parar o Redis existente e iniciar o do docker-compose
docker-compose up -d redis
```

### 2. Iniciar o Servidor

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

O servidor estará disponível em: http://localhost:8000

### 3. Acessar Documentação

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Criar Usuário Admin Inicial

Você pode criar um usuário admin via Python:

```python
from app.db.base import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import uuid

db = SessionLocal()
admin = User(
    id=uuid.uuid4(),
    name="Admin",
    email="admin@example.com",
    role=UserRole.ADMIN,
    password_hash=get_password_hash("senha123"),
    is_active="true"
)
db.add(admin)
db.commit()
print(f"Admin criado: admin@example.com / senha123")
```

Ou usar o endpoint POST `/api/v1/students` após criar um admin manualmente no banco.

## Troubleshooting

### PostgreSQL não conecta
```bash
# Verificar se está rodando
docker-compose ps

# Reiniciar se necessário
docker-compose restart db
```

### Redis não conecta
- Verifique se há outro Redis rodando: `redis-cli ping`
- Ajuste `REDIS_URL` no `.env` se necessário
- Ou pare o Redis existente e use o do docker-compose

### Erro de migrations
```bash
# Recriar migrations (CUIDADO: apaga dados existentes)
alembic downgrade base
alembic upgrade head
```



