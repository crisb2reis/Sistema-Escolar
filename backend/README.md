# Sistema de Frequência Escolar - Backend API

API FastAPI para controle de frequência escolar com QR Code.

## Requisitos

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

## Instalação

1. Clone o repositório
2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Execute as migrations:
```bash
alembic upgrade head
```

6. Inicie o servidor:
```bash
uvicorn app.main:app --reload
```

## Docker

Para executar com Docker:

```bash
docker-compose up -d
```

## Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/me` - Informações do usuário atual

### Alunos
- `GET /api/v1/students` - Listar alunos
- `POST /api/v1/students` - Criar aluno
- `POST /api/v1/students/upload-csv` - Upload CSV de alunos

### Sessões
- `POST /api/v1/sessions/classes/{class_id}/sessions` - Criar sessão
- `POST /api/v1/sessions/{session_id}/qrcode` - Gerar QR Code
- `PUT /api/v1/sessions/{session_id}/close` - Encerrar sessão

### Check-in
- `POST /api/v1/checkin` - Registrar presença via QR Code

### Relatórios
- `GET /api/v1/reports/sessions/{session_id}/attendances` - Presenças da sessão
- `GET /api/v1/reports/attendance/csv` - Exportar CSV
- `GET /api/v1/reports/attendance/xlsx` - Exportar XLSX
- `GET /api/v1/reports/attendance/pdf` - Exportar PDF

## Documentação

Acesse a documentação interativa em:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc



