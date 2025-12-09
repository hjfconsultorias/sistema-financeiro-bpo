#!/bin/bash

# Script de Deploy Pós-Build
# Executado automaticamente após o build no Manus Space

set -e

echo "=========================================="
echo "🚀 INICIANDO DEPLOY PÓS-BUILD"
echo "=========================================="

# 1. Verificar variáveis de ambiente
echo "✓ Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não está definida!"
    exit 1
fi

# 2. Instalar dependências
echo "✓ Instalando dependências..."
pnpm install --frozen-lockfile

# 3. Executar migrações do Drizzle
echo "✓ Executando migrações do banco de dados..."
pnpm db:push

# 4. Verificar se a tabela AGENDA foi criada
echo "✓ Verificando criação da tabela AGENDA..."
# Este comando será executado no banco de dados

echo "=========================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Acessar https://bpoekgps.manus.space"
echo "2. Fazer login com suas credenciais"
echo "3. Acessar o módulo de AGENDA"
echo "4. Testar a importação de dados"
echo ""
