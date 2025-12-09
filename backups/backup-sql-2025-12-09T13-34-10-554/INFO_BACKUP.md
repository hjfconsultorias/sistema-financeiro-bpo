# Backup SQL - Sistema Financeiro Ek-Empreendimento
## 09/12/2025, 08:34:10

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
```bash
# 1. Acessar o terminal do Manus
cd /home/ubuntu/sistema-financeiro

# 2. Restaurar o banco de dados
mysql -u usuario -p nome_banco < database.sql

# 3. Verificar restauração
node scripts/verify-installation.mjs
```

#### Em Servidor Local:
```bash
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
```

### ⚠️ Importante
- Este backup contém TODOS os dados, incluindo receitas e contas a pagar
- Para deploy permanente, remover dados desnecessários antes de usar
- Manter em local seguro
- Fazer backup deste backup regularmente

### 📋 Estrutura do Backup
```
backup-sql-2025-12-09T13-34-10-554/
├── INFO_BACKUP.md          ← Este arquivo
├── database.sql            ← Dump SQL completo
└── restore-instructions.md ← Instruções de restauração
```

---
**Backup criado em:** 2025-12-09T13:34:10.581Z
**Tamanho estimado:** Depende do banco de dados
**Tempo de restauração:** 2-5 minutos
