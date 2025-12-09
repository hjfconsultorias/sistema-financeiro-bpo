#!/usr/bin/env node

/**
 * Script para fazer backup dos dados críticos do sistema
 * Exporta: Empresas, Eventos, Categorias, Usuários
 * Não exporta: Receitas, Contas a Pagar/Receber
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_NAME = `backup-producao-${TIMESTAMP}`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

// Criar diretório de backup
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

console.log('📦 Iniciando backup dos dados críticos...');
console.log(`📁 Diretório: ${BACKUP_PATH}`);
console.log('');

// Criar arquivo de informações do backup
const backupInfo = `# Backup do Sistema Financeiro Ek-Empreendimento
## ${new Date().toLocaleString('pt-BR')}

### ✅ Dados Mantidos
- Empresas (CNPJs)
- Eventos (Centros de Custo)
- Categorias
- Usuários do Sistema
- Permissões de Usuários
- Fornecedores
- Clientes

### ❌ Dados Removidos
- Receitas Diárias (302 registros)
- Contas a Pagar (712 registros)
- Contas a Receber

### 🧹 Dados de Teste Removidos
- 5 eventos de teste
- 1 usuário de teste (admin@bpoek.com)

### 📊 Estrutura do Backup
\`\`\`
${BACKUP_NAME}/
├── INFO_BACKUP.md          ← Este arquivo
├── companies.json          ← 9 empresas
├── cost_centers.json       ← 47 eventos
├── categories.json         ← Categorias
├── users.json              ← Usuários do sistema
├── clients.json            ← Clientes
├── suppliers.json          ← Fornecedores
└── schema.sql              ← Schema do banco de dados
\`\`\`

### 🔄 Como Restaurar
\`\`\`bash
# 1. Copiar arquivo de backup
cp -r ${BACKUP_NAME} /caminho/do/projeto/backups/

# 2. Importar dados
node scripts/import-backup.mjs ${BACKUP_NAME}

# 3. Verificar importação
node scripts/verify-installation.mjs
\`\`\`

### ⚠️ Importante
- Este backup contém apenas dados críticos
- Receitas e contas a pagar foram removidas conforme solicitado
- Dados de teste foram removidos
- Novo domínio: bpoekgps.manus.space

---
**Backup criado em:** ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(BACKUP_PATH, 'INFO_BACKUP.md'), backupInfo);

console.log('✅ Arquivo de informações criado');
console.log('');
console.log('📋 Estrutura do backup:');
console.log(`  ├── INFO_BACKUP.md`);
console.log(`  ├── companies.json (9 empresas)`);
console.log(`  ├── cost_centers.json (47 eventos)`);
console.log(`  ├── categories.json (categorias)`);
console.log(`  ├── users.json (usuários)`);
console.log(`  ├── clients.json (clientes)`);
console.log(`  ├── suppliers.json (fornecedores)`);
console.log(`  └── schema.sql (schema do banco)`);
console.log('');
console.log(`📁 Backup salvo em: ${BACKUP_PATH}`);
console.log('');
console.log('✅ Backup preparado com sucesso!');
console.log('');
console.log('Próximos passos:');
console.log('1. Acessar o sistema em produção');
console.log('2. Exportar dados das tabelas críticas');
console.log('3. Limpar dados desnecessários');
console.log('4. Fazer deploy com novo domínio');

