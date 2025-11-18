-- Script SQL para criar/atualizar o usuário do PostgreSQL
-- Execute este script como usuário postgres (superusuário)

-- Criar usuário se não existir (ou atualizar senha se existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'frequencia_user') THEN
        CREATE USER frequencia_user WITH PASSWORD 'frequencia_pass';
        RAISE NOTICE 'Usuário frequencia_user criado';
    ELSE
        ALTER USER frequencia_user WITH PASSWORD 'frequencia_pass';
        RAISE NOTICE 'Senha do usuário frequencia_user atualizada';
    END IF;
END
$$;

-- Criar banco de dados se não existir
SELECT 'CREATE DATABASE frequencia_db OWNER frequencia_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'frequencia_db')\gexec

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE frequencia_db TO frequencia_user;

-- Conectar ao banco e conceder privilégios no schema public
\c frequencia_db
GRANT ALL ON SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO frequencia_user;

