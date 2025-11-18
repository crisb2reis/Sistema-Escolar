#!/bin/bash

# Script para configurar o usuário e banco de dados PostgreSQL

echo "=== Configurando PostgreSQL ==="

# Criar/atualizar usuário
sudo -u postgres psql -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'frequencia_user') THEN
        CREATE USER frequencia_user WITH PASSWORD 'frequencia_pass';
        RAISE NOTICE 'Usuário frequencia_user criado';
    ELSE
        ALTER USER frequencia_user WITH PASSWORD 'frequencia_pass';
        RAISE NOTICE 'Senha do usuário frequencia_user atualizada';
    END IF;
END
\$\$;
"

# Criar banco de dados se não existir
# CREATE DATABASE não pode ser executado dentro de DO, então verificamos primeiro
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='frequencia_db'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "Banco de dados frequencia_db já existe"
else
    echo "Criando banco de dados frequencia_db..."
    sudo -u postgres psql -c "CREATE DATABASE frequencia_db OWNER frequencia_user;"
    echo "✓ Banco de dados criado"
fi

# Conceder privilégios no banco de dados
echo "Concedendo privilégios no banco de dados..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE frequencia_db TO frequencia_user;" 2>/dev/null || true

# Conceder privilégios no schema public
echo "Concedendo privilégios no schema public..."
sudo -u postgres psql -d frequencia_db << 'EOF'
GRANT ALL ON SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO frequencia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO frequencia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO frequencia_user;
EOF

echo ""
echo "=== Testando conexão ==="
export PGPASSWORD='frequencia_pass'
if psql -h localhost -U frequencia_user -d frequencia_db -c "SELECT 1;" &> /dev/null; then
    echo "✓ Conexão bem-sucedida!"
    echo ""
    echo "Agora você pode executar:"
    echo "  cd /mnt/dados/projetos/Sistema-Escolar/backend"
    echo "  source venv/bin/activate"
    echo "  alembic upgrade head"
else
    echo "✗ Falha na conexão. Verifique se o PostgreSQL está rodando."
fi

