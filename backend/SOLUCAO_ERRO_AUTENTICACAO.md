# Solução para Erro de Autenticação PostgreSQL

## Problema
```
psycopg2.OperationalError: password authentication failed for user "frequencia_user"
```

**OU**

```
ModuleNotFoundError: No module named 'pydantic_settings'
```

## Causa

### Erro de Autenticação
O PostgreSQL está rejeitando as credenciais configuradas no arquivo `.env`. Isso pode acontecer porque:
1. O usuário `frequencia_user` não existe no PostgreSQL
2. A senha do usuário está diferente de `frequencia_pass`
3. O banco de dados `frequencia_db` não existe

### Erro de Módulo Não Encontrado
O ambiente virtual (`venv`) não está ativado. As dependências estão instaladas no `venv`, mas o comando está usando o Python/alembic do sistema.

## ⚠️ IMPORTANTE: Sempre Ative o Ambiente Virtual

**ANTES de executar qualquer comando Python/alembic, sempre ative o venv:**

```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend
source venv/bin/activate
```

Você saberá que está ativado quando ver `(venv)` no início do prompt.

## Soluções

### ⚡ Solução Rápida (Recomendada)

Execute o script automatizado que configura tudo:

```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend
./scripts/setup_postgres.sh
```

Depois, com o venv ativado:

```bash
source venv/bin/activate
alembic upgrade head
```

### Opção 1: Usar Docker Compose (Recomendado)

Se você quer usar o PostgreSQL via Docker:

```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend

# Parar containers existentes
docker-compose down

# Se quiser recriar do zero (CUIDADO: apaga todos os dados!)
docker volume rm backend_postgres_data

# Iniciar o PostgreSQL
docker-compose up -d db

# Aguardar alguns segundos para o banco inicializar
sleep 5

# Testar a conexão
alembic upgrade head
```

### Opção 2: Corrigir PostgreSQL Local

Se você está usando PostgreSQL instalado localmente:

#### Passo 1: Conectar como superusuário
```bash
sudo -u postgres psql
```

#### Passo 2: Executar o script SQL
No prompt do psql, execute:
```sql
\i scripts/fix_postgres_user.sql
```

Ou execute manualmente:
```sql
-- Criar/atualizar usuário
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'frequencia_user') THEN
        CREATE USER frequencia_user WITH PASSWORD 'frequencia_pass';
    ELSE
        ALTER USER frequencia_user WITH PASSWORD 'frequencia_pass';
    END IF;
END
$$;

-- Criar banco de dados
CREATE DATABASE frequencia_db OWNER frequencia_user;

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE frequencia_db TO frequencia_user;
```

#### Passo 3: Sair do psql
```sql
\q
```

#### Passo 4: Conectar ao banco e conceder privilégios no schema
```bash
sudo -u postgres psql -d frequencia_db
```

```sql
GRANT ALL ON SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO frequencia_user;
\q
```

### Opção 3: Usar Script Automatizado (Mais Fácil)

Execute o script que configura tudo automaticamente:
```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend
./scripts/setup_postgres.sh
```

Este script:
- Cria/atualiza o usuário `frequencia_user`
- Cria o banco de dados `frequencia_db` se não existir
- Concede todos os privilégios necessários
- Testa a conexão

### Opção 4: Script de Diagnóstico

Para apenas diagnosticar problemas:
```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend
./scripts/fix_db_credentials.sh
```

## Verificar se Funcionou

Após aplicar uma das soluções acima, teste a conexão:

```bash
cd /mnt/dados/projetos/Sistema-Escolar/backend
source venv/bin/activate
alembic upgrade head
```

Se ainda houver erro, verifique:

1. **PostgreSQL está rodando?**
   ```bash
   sudo systemctl status postgresql
   # ou
   pg_isready -h localhost -p 5432
   ```

2. **Credenciais no .env estão corretas?**
   ```bash
   cat .env | grep POSTGRES
   ```

3. **Testar conexão manualmente:**
   ```bash
   PGPASSWORD=frequencia_pass psql -h localhost -U frequencia_user -d frequencia_db -c "SELECT 1;"
   ```

## Notas Importantes

- **SEMPRE ative o ambiente virtual antes de executar comandos Python/alembic:**
  ```bash
  source venv/bin/activate
  ```

- Se você recriar o banco de dados, **todos os dados serão perdidos**
- Se você já tem dados importantes, use a Opção 2 para apenas atualizar a senha
- O arquivo `.env` já está configurado corretamente com:
  - `POSTGRES_USER=frequencia_user`
  - `POSTGRES_PASSWORD=frequencia_pass`
  - `POSTGRES_DB=frequencia_db`

## Comandos Completos (Copy & Paste)

```bash
# 1. Ir para o diretório do backend
cd /mnt/dados/projetos/Sistema-Escolar/backend

# 2. Configurar PostgreSQL (execute apenas uma vez)
./scripts/setup_postgres.sh

# 3. Ativar ambiente virtual
source venv/bin/activate

# 4. Executar migrations
alembic upgrade head
```

