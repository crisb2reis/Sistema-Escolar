# Sistema de Controle de Frequência Escolar com QR Code

Sistema completo para controle de frequência escolar utilizando QR Code, composto por:

- **Backend**: API FastAPI (Python)
- **Frontend Web**: Interface React para admin/professor
- **Mobile**: App React Native para alunos

## Estrutura do Projeto

```
frequencia_escolhar/
├── backend/          # API FastAPI
├── frontend-web/     # Interface React
└── mobile/          # App React Native
```

## Instalação e Execução

### Backend

1. Entre no diretório:
```bash
cd backend
```

2. Crie ambiente virtual e instale dependências:
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. Execute migrations:
```bash
alembic upgrade head
```

5. Inicie o servidor:
```bash
uvicorn app.main:app --reload
```

Ou use Docker:
```bash
docker-compose up -d
```

### Frontend Web

1. Entre no diretório:
```bash
cd frontend-web
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis:
```bash
cp .env.example .env
```

4. Inicie o servidor:
```bash
npm run dev
```

### Mobile

1. Entre no diretório:
```bash
cd mobile
```

2. Instale dependências:
```bash
npm install
```

3. Configure a URL da API:
   - Edite `src/services/api.ts`
   - Altere `API_BASE_URL` para o IP do seu servidor backend (não use `localhost`)
   - Exemplo: `http://192.168.15.9:9080/api/v1`
   - **Nota**: Porta padrão configurada: 9080 (altere se necessário)

4. Instale o Expo Go no seu celular:
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

5. Inicie o servidor:
```bash
npm start
```

6. Escaneie o QR code exibido:
   - **Android**: Use o app Expo Go para escanear
   - **iOS**: Use a câmera nativa (o Expo Go abrirá automaticamente)

**Nota**: Certifique-se de que o celular e o computador estão na mesma rede Wi-Fi.

Para mais detalhes, consulte [mobile/README.md](mobile/README.md).

## Funcionalidades Principais

- Autenticação JWT (aluno, professor, admin)
- CRUD de alunos, turmas, cursos
- Upload de alunos via CSV
- Geração de QR Code por sessão
- Check-in via QR Code (mobile)
- Relatórios de frequência (CSV, XLSX, PDF)
- Logs de auditoria
- Prevenção de fraude (tokens temporários, nonce)

## Documentação da API

Acesse http://localhost:8000/docs para documentação interativa (Swagger UI).

## Tecnologias

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend Web**: React, TypeScript, Material-UI
- **Mobile**: React Native, Expo, TypeScript

