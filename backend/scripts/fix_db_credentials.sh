#!/bin/bash

# Script para corrigir credenciais do PostgreSQL
# Este script ajuda a verificar e corrigir problemas de autenticação

echo "=== Verificando PostgreSQL ==="

# Verificar se está rodando via Docker
if docker ps --format "{{.Names}}" | grep -q "frequencia_db"; then
    echo "✓ PostgreSQL está rodando via Docker"
    echo ""
    echo "Para redefinir a senha no container Docker, execute:"
    echo "  docker-compose down"
    echo "  docker volume rm backend_postgres_data  # CUIDADO: apaga todos os dados!"
    echo "  docker-compose up -d db"
    echo ""
    echo "OU, se quiser manter os dados, conecte-se ao container e altere a senha:"
    echo "  docker exec -it frequencia_db psql -U frequencia_user -d frequencia_db"
    echo "  ALTER USER frequencia_user WITH PASSWORD 'frequencia_pass';"
else
    echo "PostgreSQL não está rodando via Docker"
    echo ""
    echo "Verificando se está rodando localmente..."
    
    # Tentar conectar como postgres (usuário padrão)
    if command -v psql &> /dev/null; then
        echo ""
        echo "Para corrigir as credenciais, você pode:"
        echo ""
        echo "Opção 1: Criar/atualizar o usuário no PostgreSQL local"
        echo "  sudo -u postgres psql"
        echo "  CREATE USER frequencia_user WITH PASSWORD 'frequencia_pass';"
        echo "  CREATE DATABASE frequencia_db OWNER frequencia_user;"
        echo "  GRANT ALL PRIVILEGES ON DATABASE frequencia_db TO frequencia_user;"
        echo "  \\q"
        echo ""
        echo "Opção 2: Alterar a senha do usuário existente"
        echo "  sudo -u postgres psql"
        echo "  ALTER USER frequencia_user WITH PASSWORD 'frequencia_pass';"
        echo "  \\q"
        echo ""
        echo "Opção 3: Usar Docker Compose (recomendado)"
        echo "  docker-compose up -d db"
    fi
fi

echo ""
echo "=== Verificando arquivo .env ==="
if [ -f .env ]; then
    echo "✓ Arquivo .env encontrado"
    echo ""
    echo "Credenciais configuradas:"
    grep -E "POSTGRES_|DATABASE_URL" .env | sed 's/PASSWORD=.*/PASSWORD=***/'
else
    echo "✗ Arquivo .env não encontrado!"
fi

echo ""
echo "=== Testando conexão ==="
echo "Tentando conectar com as credenciais do .env..."

# Extrair credenciais do .env
if [ -f .env ]; then
    source .env
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    if psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" &> /dev/null; then
        echo "✓ Conexão bem-sucedida!"
    else
        echo "✗ Falha na conexão"
        echo ""
        echo "Erro: As credenciais no .env não correspondem ao PostgreSQL"
        echo ""
        echo "Soluções possíveis:"
        echo "1. Verifique se o usuário e senha estão corretos no PostgreSQL"
        echo "2. Atualize o arquivo .env com as credenciais corretas"
        echo "3. Recrie o banco de dados usando Docker Compose"
    fi
fi

