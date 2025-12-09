# Guia de Instalação e Restauração - BPO EK Sistema Financeiro v1.0

**Autor:** Manus AI  
**Data:** 05 de dezembro de 2024  
**Versão do Sistema:** 1.0  
**Nível de Dificuldade:** ⭐ Iniciante

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Método 1: Restauração via Manus (Recomendado)](#método-1-restauração-via-manus-recomendado)
4. [Método 2: Instalação Manual](#método-2-instalação-manual)
5. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
6. [Populando Dados Iniciais](#populando-dados-iniciais)
7. [Verificação e Testes](#verificação-e-testes)
8. [Solução de Problemas](#solução-de-problemas)
9. [Credenciais de Acesso](#credenciais-de-acesso)

---

## 🎯 Visão Geral

Este guia foi criado para permitir que desenvolvedores júnior consigam restaurar o sistema BPO EK Sistema Financeiro v1.0 de forma completa e funcional. O sistema é uma aplicação web full-stack construída com React 19, Express 4, tRPC 11 e MySQL/TiDB, com sistema de autenticação e permissões granulares.

**Tempo estimado de instalação:** 15-30 minutos

---

## 🛠️ Pré-requisitos

Antes de iniciar a restauração, certifique-se de ter:

### Opção A: Usando Manus (Recomendado)
- ✅ Conta ativa no Manus (https://manus.im)
- ✅ Arquivo ZIP do backup v1.0

### Opção B: Instalação Manual
- ✅ Node.js 22.x ou superior
- ✅ pnpm 9.x ou superior
- ✅ MySQL 8.0+ ou TiDB Cloud
- ✅ Git instalado

---

## 🚀 Método 1: Restauração via Manus (Recomendado)

Este é o método mais simples e rápido. O Manus cuidará automaticamente da infraestrutura, banco de dados e deploy.

### Passo 1: Fazer Upload do Projeto

1. Acesse https://manus.im e faça login
2. Clique em "Novo Projeto" ou "Upload Project"
3. Faça upload do arquivo `sistema-financeiro-v1.0.zip`
4. Aguarde o Manus processar o projeto (1-2 minutos)

### Passo 2: Configurar Banco de Dados

O Manus criará automaticamente um banco de dados MySQL/TiDB para o projeto. Não é necessário configurar manualmente.

### Passo 3: Executar Migração do Schema

Após o upload, execute no terminal do Manus:

```bash
cd sistema-financeiro
pnpm install
pnpm db:push
```

Este comando criará todas as tabelas no banco de dados baseado no schema do Drizzle.

### Passo 4: Popular Dados Iniciais

Execute o script de seed para criar usuários, módulos e permissões iniciais:

```bash
pnpm seed
```

### Passo 5: Iniciar o Servidor

```bash
pnpm dev
```

O sistema estará disponível em `https://[seu-projeto].manus.space`

**✅ Pronto! O sistema está restaurado e funcionando!**

---

## 🔧 Método 2: Instalação Manual

Use este método se preferir hospedar o sistema em sua própria infraestrutura.

### Passo 1: Clonar ou Extrair o Código

```bash
# Se tiver o ZIP
unzip sistema-financeiro-v1.0.zip
cd sistema-financeiro

# Ou clonar do repositório (se disponível)
git clone [URL_DO_REPOSITORIO]
cd sistema-financeiro
```

### Passo 2: Instalar Dependências

```bash
# Instalar pnpm globalmente (se não tiver)
npm install -g pnpm

# Instalar dependências do projeto
pnpm install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL=mysql://usuario:senha@host:3306/nome_banco

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres

# OAuth (se usar Manus OAuth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Aplicação
VITE_APP_ID=seu_app_id
VITE_APP_TITLE=Sistema Financeiro Ek-Empreendimento
VITE_APP_LOGO=/logo.png

# APIs Manus (opcional)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Proprietário
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=Seu Nome

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

**⚠️ IMPORTANTE:** Substitua todos os valores de exemplo pelos seus valores reais.

### Passo 4: Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE sistema_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Passo 5: Executar Migração do Schema

```bash
# Gerar e aplicar migrações
pnpm db:push
```

### Passo 6: Popular Dados Iniciais

```bash
pnpm seed
```

### Passo 7: Iniciar o Servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

O sistema estará disponível em `http://localhost:3000`

---

## 🗄️ Configuração do Banco de Dados

### Estrutura do Banco

O sistema utiliza 11 tabelas principais:

| Tabela | Descrição | Registros Iniciais |
|--------|-----------|-------------------|
| `system_users` | Usuários do sistema | 5 usuários |
| `modules` | Módulos do sistema | 8 módulos |
| `user_module_permissions` | Permissões granulares | Variável |
| `companies` | Empresas cadastradas | 9 empresas |
| `cost_centers` | Centros de custo (Eventos) | 50 eventos |
| `clients` | Clientes (Shoppings) | Variável |
| `suppliers` | Fornecedores | Variável |
| `categories` | Categorias financeiras | Variável |
| `accounts_payable` | Contas a pagar | 712 registros |
| `accounts_receivable` | Contas a receber | Variável |
| `daily_revenues` | Receitas diárias | 302 lançamentos |

### Diagrama Entidade-Relacionamento

Consulte o arquivo `database/diagrama-er.png` para visualizar o relacionamento completo entre as tabelas.

**Principais relacionamentos:**

- Cada **usuário** pode ter permissões em múltiplos **módulos**
- Cada **empresa** possui múltiplos **centros de custo** (eventos)
- **Contas a pagar** estão associadas a **fornecedores**
- **Contas a receber** estão associadas a **clientes**
- **Receitas diárias** estão associadas a **clientes** e **eventos**

### Schema do Drizzle

O schema completo está disponível em `database/schema.ts`. Este arquivo TypeScript define todas as tabelas, colunas, tipos e relacionamentos do banco de dados.

Para aplicar o schema:

```bash
pnpm db:push
```

---

## 📊 Populando Dados Iniciais

O sistema requer alguns dados iniciais para funcionar corretamente.

### Script de Seed Automático

Execute o script de seed incluído no backup:

```bash
node scripts/seed-database.mjs
```

Este script criará:

1. **Usuário Administrador**
   - Email: `admin@bpoek.com`
   - Senha: `admin123`
   - Perfil: Administrador

2. **8 Módulos do Sistema**
   - FINANCEIRO (ativo)
   - AGENDA (em breve)
   - IA - SOPHIA (em breve)
   - RH (em breve)
   - DEPARTAMENTO PESSOAL (em breve)
   - PROCESSOS (em breve)
   - OPERAÇÕES (em breve)
   - COMPRAS (em breve)

3. **Permissões do Administrador**
   - Acesso total a todos os módulos

### Seed Manual (Alternativa)

Se preferir popular manualmente, execute os seguintes SQLs na ordem:

```sql
-- 1. Criar usuário administrador
INSERT INTO system_users (email, password_hash, name, profile) 
VALUES ('admin@bpoek.com', '$2b$10$hash_aqui', 'Administrador', 'admin');

-- 2. Criar módulos
INSERT INTO modules (name, description, icon, is_active, display_order) VALUES
('FINANCEIRO', 'Gestão financeira completa', 'receipt', 1, 1),
('AGENDA', 'Gestão de eventos e logística', 'calendar', 0, 2),
-- ... outros módulos
;

-- 3. Criar permissões
-- (Administradores têm permissões automáticas, não precisa inserir)
```

---

## ✅ Verificação e Testes

Após a instalação, execute os seguintes testes para garantir que tudo está funcionando:

### 1. Verificar Servidor

```bash
# O servidor deve estar rodando na porta 3000
curl http://localhost:3000/health
```

**Resposta esperada:** `{"status": "ok"}`

### 2. Verificar Banco de Dados

```bash
# Conectar ao banco
mysql -u usuario -p sistema_financeiro

# Verificar tabelas
SHOW TABLES;

# Verificar usuários
SELECT id, email, name, profile FROM system_users;
```

**Resultado esperado:** Deve listar 5 usuários, incluindo o administrador.

### 3. Testar Login

1. Acesse `http://localhost:3000/login`
2. Use as credenciais:
   - Email: `admin@bpoek.com`
   - Senha: `admin123`
3. Resolva o CAPTCHA
4. Clique em "Entrar"

**Resultado esperado:** Redirecionamento para `/modules` com mensagem "Bem-vindo, Administrador!"

### 4. Testar Permissões

1. Faça login como administrador
2. Clique no módulo "FINANCEIRO"
3. Navegue para "Clientes"
4. Verifique se os botões "Novo Cliente", "Importar" e "Exportar" estão visíveis

**Resultado esperado:** Todos os botões devem estar visíveis para o administrador.

### 5. Testar Usuário com Permissões Limitadas

1. Faça logout
2. Faça login com:
   - Email: `chcfonseca@gmail.com`
   - Senha: `123456`
3. Navegue para "Clientes"

**Resultado esperado:** Nenhum botão de ação deve estar visível (apenas visualização).

---

## 🐛 Solução de Problemas

### Problema: Erro ao conectar no banco de dados

**Sintoma:** `Error: connect ECONNREFUSED` ou `Access denied for user`

**Solução:**
1. Verifique se o MySQL está rodando: `systemctl status mysql`
2. Confirme as credenciais no arquivo `.env`
3. Teste a conexão manualmente: `mysql -u usuario -p -h host`
4. Verifique se o banco de dados existe: `SHOW DATABASES;`

### Problema: Tabelas não foram criadas

**Sintoma:** `Table 'sistema_financeiro.system_users' doesn't exist`

**Solução:**
```bash
# Forçar recriação das tabelas
pnpm db:push

# Verificar se as tabelas foram criadas
mysql -u usuario -p sistema_financeiro -e "SHOW TABLES;"
```

### Problema: Erro ao fazer login

**Sintoma:** "Email ou senha incorretos"

**Solução:**
1. Verifique se o seed foi executado: `SELECT * FROM system_users;`
2. Se não houver usuários, execute: `pnpm seed`
3. Tente usar as credenciais padrão: `admin@bpoek.com` / `admin123`

### Problema: Permissões não funcionam

**Sintoma:** Usuário com apenas visualização consegue editar

**Solução:**
1. Verifique se o código está na versão v1.0 (com sistema de permissões)
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Faça logout e login novamente
4. Verifique as permissões no banco: `SELECT * FROM user_module_permissions WHERE user_id = X;`

### Problema: Porta 3000 já está em uso

**Sintoma:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar o processo
kill -9 [PID]

# Ou usar outra porta
PORT=3001 pnpm dev
```

### Problema: Dependências não instalam

**Sintoma:** Erros durante `pnpm install`

**Solução:**
```bash
# Limpar cache do pnpm
pnpm store prune

# Deletar node_modules e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Se persistir, use npm
npm install
```

---

## 🔑 Credenciais de Acesso

### Usuários Padrão do Sistema

| Email | Senha | Perfil | Permissões |
|-------|-------|--------|------------|
| `admin@bpoek.com` | `admin123` | Administrador | Acesso total a todos os módulos |
| `chcfonseca@gmail.com` | `123456` | Usuário | Apenas visualização em todos os módulos |
| `teste@exemplo.com` | `123456` | Usuário | Variável (configurar no banco) |

**⚠️ IMPORTANTE DE SEGURANÇA:**

1. **Altere todas as senhas padrão** imediatamente após a instalação
2. Use senhas fortes (mínimo 12 caracteres, letras, números e símbolos)
3. Nunca compartilhe credenciais de administrador
4. Revise periodicamente as permissões dos usuários
5. Mantenha o JWT_SECRET seguro e nunca o exponha publicamente

### Como Alterar Senhas

**Via Interface:**
1. Faça login como administrador
2. Vá em "Usuários" no menu lateral
3. Clique em "Editar" no usuário desejado
4. Digite a nova senha
5. Salve as alterações

**Via SQL:**
```sql
-- Gerar hash bcrypt da nova senha (use um gerador online ou Node.js)
-- Exemplo: bcrypt.hash('nova_senha_forte', 10)

UPDATE system_users 
SET password_hash = '$2b$10$novo_hash_aqui' 
WHERE email = 'admin@bpoek.com';
```

---

## 📞 Suporte e Contato

Se encontrar problemas não cobertos neste guia:

1. **Consulte a documentação técnica:** `docs/DOCUMENTACAO_TECNICA.md`
2. **Verifique o diagrama ER:** `database/diagrama-er.png`
3. **Revise o código-fonte:** Todos os arquivos estão comentados
4. **Entre em contato:** Forneça detalhes do erro, logs e ambiente

---

## 📝 Checklist de Instalação

Use este checklist para garantir que todos os passos foram executados:

- [ ] Pré-requisitos instalados (Node.js, pnpm, MySQL)
- [ ] Código extraído ou clonado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados criado
- [ ] Migração executada (`pnpm db:push`)
- [ ] Dados iniciais populados (`pnpm seed`)
- [ ] Servidor iniciado (`pnpm dev`)
- [ ] Login testado com administrador
- [ ] Permissões verificadas
- [ ] Senhas padrão alteradas
- [ ] Backup do banco de dados criado

---

**Documento criado por:** Manus AI  
**Última atualização:** 05/12/2024  
**Versão do guia:** 1.0
