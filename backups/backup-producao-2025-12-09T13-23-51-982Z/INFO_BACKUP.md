# Backup do Sistema Financeiro Ek-Empreendimento
## 09/12/2025, 08:23:51

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
```
backup-producao-2025-12-09T13-23-51-982Z/
├── INFO_BACKUP.md          ← Este arquivo
├── companies.json          ← 9 empresas
├── cost_centers.json       ← 47 eventos
├── categories.json         ← Categorias
├── users.json              ← Usuários do sistema
├── clients.json            ← Clientes
├── suppliers.json          ← Fornecedores
└── schema.sql              ← Schema do banco de dados
```

### 🔄 Como Restaurar
```bash
# 1. Copiar arquivo de backup
cp -r backup-producao-2025-12-09T13-23-51-982Z /caminho/do/projeto/backups/

# 2. Importar dados
node scripts/import-backup.mjs backup-producao-2025-12-09T13-23-51-982Z

# 3. Verificar importação
node scripts/verify-installation.mjs
```

### ⚠️ Importante
- Este backup contém apenas dados críticos
- Receitas e contas a pagar foram removidas conforme solicitado
- Dados de teste foram removidos
- Novo domínio: bpoekgps.manus.space

---
**Backup criado em:** 2025-12-09T13:23:52.008Z
