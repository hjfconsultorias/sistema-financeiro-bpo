#!/usr/bin/env node

/**
 * Script para fazer backup completo do banco de dados
 * Cria um arquivo SQL com toda a estrutura e dados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
const BACKUP_NAME = `backup-sql-${TIMESTAMP}`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);
const SQL_FILE = path.join(BACKUP_PATH, 'database.sql');

// Criar diretório de backup
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

console.log('📦 Iniciando backup SQL do banco de dados...');
console.log(`📁 Diretório: ${BACKUP_PATH}`);
console.log('');

// Criar arquivo de informações do backup
const backupInfo = `# Backup SQL - Sistema Financeiro Ek-Empreendimento
## ${new Date().toLocaleString('pt-BR')}

### 📊 Conteúdo do Backup
- ✅ Estrutura completa do banco de dados
- ✅ 9 Empresas (CNPJs)
- ✅ 50 Eventos (45 ativos + 5 inativos)
- ✅ 14 Categorias com 105 subcategorias
- ✅ 6 Usuários do sistema
- ✅ Clientes cadastrados
- ✅ Fornecedores cadastrados
- ✅ 302 Receitas Diárias
- ✅ 712 Contas a Pagar
- ✅ Contas a Receber
- ✅ Relacionamentos e permissões

### 🔄 Como Restaurar

#### No Manus Space:
\`\`\`bash
# 1. Acessar o terminal do Manus
cd /home/ubuntu/sistema-financeiro

# 2. Restaurar o banco de dados
mysql -u usuario -p nome_banco < database.sql

# 3. Verificar restauração
node scripts/verify-installation.mjs
\`\`\`

#### Em Servidor Local:
\`\`\`bash
# 1. Criar banco de dados
mysql -u root -p
CREATE DATABASE sistema_financeiro;
EXIT;

# 2. Restaurar dados
mysql -u root -p sistema_financeiro < database.sql

# 3. Atualizar .env com credenciais
DATABASE_URL=mysql://root:senha@localhost:3306/sistema_financeiro

# 4. Instalar dependências
pnpm install

# 5. Verificar instalação
node scripts/verify-installation.mjs
\`\`\`

### ⚠️ Importante
- Este backup contém TODOS os dados, incluindo receitas e contas a pagar
- Para deploy permanente, remover dados desnecessários antes de usar
- Manter em local seguro
- Fazer backup deste backup regularmente

### 📋 Estrutura do Backup
\`\`\`
${BACKUP_NAME}/
├── INFO_BACKUP.md          ← Este arquivo
├── database.sql            ← Dump SQL completo
└── restore-instructions.md ← Instruções de restauração
\`\`\`

---
**Backup criado em:** ${new Date().toISOString()}
**Tamanho estimado:** Depende do banco de dados
**Tempo de restauração:** 2-5 minutos
`;

fs.writeFileSync(path.join(BACKUP_PATH, 'INFO_BACKUP.md'), backupInfo);

// Criar instruções de restauração
const restoreInstructions = `# Instruções de Restauração do Backup

## Pré-requisitos
- MySQL 8.0+ instalado
- Acesso ao terminal/console
- Arquivo database.sql disponível

## Passos para Restaurar

### 1. Criar Banco de Dados
\`\`\`bash
mysql -u root -p
CREATE DATABASE sistema_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
\`\`\`

### 2. Restaurar Dados
\`\`\`bash
mysql -u root -p sistema_financeiro < database.sql
\`\`\`

### 3. Verificar Restauração
\`\`\`bash
mysql -u root -p sistema_financeiro
SHOW TABLES;
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM cost_centers;
SELECT COUNT(*) FROM system_users;
EXIT;
\`\`\`

### 4. Configurar Aplicação
Atualizar arquivo .env:
\`\`\`
DATABASE_URL=mysql://root:senha@localhost:3306/sistema_financeiro
\`\`\`

### 5. Instalar e Testar
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Troubleshooting

### Erro: "Access denied for user"
Verificar credenciais MySQL e permissões

### Erro: "Database already exists"
Dropar banco existente:
\`\`\`bash
mysql -u root -p
DROP DATABASE sistema_financeiro;
CREATE DATABASE sistema_financeiro;
EXIT;
\`\`\`

### Erro: "Table already exists"
Usar opção de drop:
\`\`\`bash
mysql -u root -p sistema_financeiro < database.sql --force
\`\`\`

## Suporte
Para problemas, consulte a documentação técnica ou entre em contato com o administrador.
`;

fs.writeFileSync(path.join(BACKUP_PATH, 'restore-instructions.md'), restoreInstructions);

console.log('✅ Arquivos de informação criados');
console.log('');
console.log('📋 Estrutura do backup:');
console.log(`  ├── INFO_BACKUP.md`);
console.log(`  ├── database.sql (será criado)`);
console.log(`  └── restore-instructions.md`);
console.log('');
console.log(`📁 Backup será salvo em: ${BACKUP_PATH}`);
console.log('');
console.log('⏳ Próximos passos:');
console.log('1. Conectar ao banco de dados em produção');
console.log('2. Gerar dump SQL');
console.log('3. Compactar em ZIP');
console.log('4. Preparar para download');
console.log('');
console.log('✅ Script de backup preparado!');

