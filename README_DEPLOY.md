# Sistema Financeiro Ek-Empreendimento - Guia de Deploy e Recuperação

**Data da Última Atualização:** 09 de dezembro de 2025  
**Versão do Sistema:** 1.0 (Atualizada)  
**Status:** ✅ Pronto para Deploy no Manus Space

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Alterações Realizadas](#alterações-realizadas)
3. [Como Fazer Deploy](#como-fazer-deploy)
4. [Como Recuperar o Código em Futuras Tarefas](#como-recuperar-o-código-em-futuras-tarefas)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este é o **Sistema Financeiro Ek-Empreendimento v1.0 atualizado**, que foi:

1. ✅ Recuperado do backup v1.0 (05 de dezembro de 2024)
2. ✅ Auditado em produção (09 de dezembro de 2025)
3. ✅ Documentado com todas as alterações encontradas
4. ✅ Preparado para deploy no Manus Space com código acessível

### Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Banco de Dados:** MySQL 8.0+ ou TiDB
- **ORM:** Drizzle ORM
- **Autenticação:** Manus OAuth + JWT

---

## 📝 Alterações Realizadas

### Alterações Encontradas em Produção (Além do Backup v1.0)

**ALTA PRIORIDADE:**
1. ✅ **Relatório DRE** - Demonstração do Resultado
   - Análise completa de receitas, despesas e resultado operacional
   - Filtros: Empresa, Evento, Categoria, Subcategoria
   - Localização: `/relatorios/dre`

2. ✅ **Relatório de Receitas Diárias**
   - Análise detalhada por empresa, evento e formas de pagamento
   - Localização: `/relatorios`

3. 📊 **302 Lançamentos de Receitas**
   - Dados financeiros críticos do negócio
   - Período: Novembro-Dezembro de 2025

**MÉDIA PRIORIDADE:**
1. ✅ **Exportação Empresas x Eventos (Excel)**
   - Novo botão na seção de Eventos
   - Permite exportar relacionamento entre empresas e eventos

2. ✅ **Filtros Avançados em Receitas Diárias**
   - Novo filtro: Dia da Semana
   - Novo filtro: Dia do Mês

3. 👤 **Novos Usuários**
   - Helbert Costa Fonseca (helbert@hjfconsultorias.com.br) - Administrador
   - Laura Santos (laura950santos@gmail.com) - Líder Financeiro

### Dados Cadastrados
- **9 Empresas (CNPJs)** - Todas ativas
- **47 Eventos** - 45 ativos, 2 inativos (de teste)
- **6 Usuários** - Incluindo 2 novos usuários
- **712 Contas a Pagar** - Dados financeiros completos
- **302 Receitas Diárias** - Lançamentos de receitas

### Problemas Identificados (Recomenda-se Corrigir)
- ⚠️ 5 eventos de teste em produção (recomenda-se remover)
- ⚠️ 1 usuário de teste em produção (recomenda-se desativar)

**Para mais detalhes, consulte:** `AUDITORIA_SISTEMA_PRODUCAO.md`

---

## 🚀 Como Fazer Deploy

### Pré-requisitos
- Conta ativa no Manus (https://manus.im)
- Acesso ao projeto no Manus Space

### Opção 1: Deploy via Manus Space (Recomendado)

**Tempo estimado:** 15-20 minutos

#### Passo 1: Preparar o Projeto
```bash
# Verificar se todas as dependências estão instaladas
cd /home/ubuntu/sistema-financeiro
pnpm install

# Verificar se não há erros de compilação
pnpm check
```

#### Passo 2: Fazer Upload para o Manus Space
1. Acesse https://manus.im
2. Navegue até "Sites implantados"
3. Clique no projeto "Sistema Financeiro Ek-Empreendimento"
4. Procure por uma opção de "Atualizar código" ou "Deploy"
5. Faça upload da pasta `/home/ubuntu/sistema-financeiro`

#### Passo 3: Executar Migração do Banco de Dados
No terminal do Manus Space:
```bash
cd sistema-financeiro
pnpm db:push
```

#### Passo 4: Verificar Instalação
```bash
node scripts/verify-installation.mjs
```

#### Passo 5: Iniciar o Servidor
```bash
pnpm dev
```

O sistema estará disponível em: `https://financekgps.manus.space`

### Opção 2: Deploy Manual em Servidor Próprio

**Tempo estimado:** 30-45 minutos

#### Passo 1: Preparar Ambiente
```bash
# Instalar Node.js 22+
# Instalar pnpm
npm install -g pnpm

# Instalar MySQL 8.0+
```

#### Passo 2: Clonar/Extrair Código
```bash
# Se tiver repositório Git
git clone <URL_DO_REPOSITORIO>
cd sistema-financeiro

# Ou extrair do ZIP
unzip sistema-financeiro.zip
cd sistema-financeiro
```

#### Passo 3: Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env
cat > .env << EOF
DATABASE_URL=mysql://usuario:senha@localhost:3306/sistema_financeiro
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=sistema-financeiro-ek
VITE_APP_TITLE=Sistema Financeiro Ek-Empreendimento
NODE_ENV=production
EOF
```

#### Passo 4: Instalar Dependências
```bash
pnpm install
```

#### Passo 5: Criar Banco de Dados
```bash
mysql -u root -p
CREATE DATABASE sistema_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Passo 6: Aplicar Schema
```bash
pnpm db:push
```

#### Passo 7: Popular Dados Iniciais (se necessário)
```bash
node scripts/seed-database.mjs
```

#### Passo 8: Build para Produção
```bash
pnpm build
```

#### Passo 9: Iniciar Servidor
```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm start
```

---

## 🔄 Como Recuperar o Código em Futuras Tarefas

### Cenário 1: Acessar o Código Hospedado no Manus Space

Se o projeto foi feito deploy no Manus Space, você pode recuperar o código assim:

#### Opção A: Via Interface do Manus
1. Acesse https://manus.im
2. Navegue até "Sites implantados"
3. Clique no projeto "Sistema Financeiro Ek-Empreendimento"
4. Procure por uma opção como "Acessar Código", "IDE", "Repositório" ou "Terminal"
5. Acesse o terminal e navegue até `/home/ubuntu/sistema-financeiro`
6. Use `git clone` ou `git pull` para obter o código mais recente

#### Opção B: Via Git (Se Repositório Estiver Configurado)
```bash
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd sistema-financeiro

# Ou atualizar código existente
git pull origin main
```

#### Opção C: Via Backup do Manus Space
1. Acesse https://manus.im
2. Navegue até "Controles de dados"
3. Procure por uma opção de "Fazer backup" ou "Exportar projeto"
4. Baixe o arquivo ZIP do projeto
5. Extraia e navegue até a pasta `sistema-financeiro`

### Cenário 2: Recuperar do Backup Original

Se nenhuma das opções acima funcionar, você sempre tem o backup original:

```bash
# Copiar do backup
cp -r /home/ubuntu/backup-v1.0/sistema-financeiro /home/ubuntu/sistema-financeiro-recuperado

# Ou extrair do ZIP original
unzip sistema-financeiro-v1.0.zip
```

### Cenário 3: Recuperar do Git (Recomendado)

**Melhor prática:** Sempre manter o código em um repositório Git (GitHub, GitLab, etc.)

```bash
# Clonar do repositório remoto
git clone https://github.com/seu-usuario/sistema-financeiro.git
cd sistema-financeiro

# Instalar dependências
pnpm install

# Iniciar desenvolvimento
pnpm dev
```

---

## 📂 Estrutura do Projeto

```
sistema-financeiro/
├── README.md                           ← Documentação principal
├── README_DEPLOY.md                    ← Este arquivo
├── AUDITORIA_SISTEMA_PRODUCAO.md       ← Auditoria completa do sistema
├── package.json                        ← Dependências do projeto
├── tsconfig.json                       ← Configuração TypeScript
├── vite.config.ts                      ← Configuração Vite
├── drizzle.config.ts                   ← Configuração Drizzle
│
├── client/                             ← Frontend React
│   ├── src/
│   │   ├── pages/                      ← Páginas do sistema
│   │   ├── components/                 ← Componentes React
│   │   ├── hooks/                      ← Custom hooks
│   │   ├── styles/                     ← Estilos Tailwind
│   │   └── main.tsx                    ← Entrada do frontend
│   └── index.html
│
├── server/                             ← Backend Express + tRPC
│   ├── _core/
│   │   └── index.ts                    ← Entrada do servidor
│   ├── routers/                        ← Rotas tRPC
│   ├── middleware/                     ← Middlewares Express
│   └── utils/                          ← Funções utilitárias
│
├── drizzle/                            ← Schema e migrações Drizzle
│   ├── schema.ts                       ← Schema do banco de dados
│   ├── migrations/                     ← Migrações SQL
│   └── relations.ts                    ← Relacionamentos
│
├── database/                           ← Documentação do banco
│   ├── schema.ts                       ← Schema completo
│   ├── diagrama-er.png                 ← Diagrama visual
│   └── diagrama-er.mmd                 ← Diagrama Mermaid
│
├── docs/                               ← Documentação técnica
│   ├── GUIA_INSTALACAO.md              ← Guia de instalação
│   └── ARQUITETURA_SISTEMA.md          ← Documentação técnica
│
├── scripts/                            ← Scripts automatizados
│   ├── seed-database.mjs               ← Popular dados iniciais
│   └── verify-installation.mjs         ← Verificar instalação
│
└── shared/                             ← Código compartilhado
    └── types.ts                        ← Tipos TypeScript
```

---

## 🔧 Comandos Úteis

```bash
# Instalação
pnpm install                    # Instalar dependências

# Desenvolvimento
pnpm dev                        # Iniciar servidor de desenvolvimento
pnpm check                      # Verificar tipos TypeScript

# Banco de Dados
pnpm db:push                    # Aplicar schema ao banco
pnpm db:studio                  # Abrir interface gráfica do banco

# Scripts
node scripts/seed-database.mjs  # Popular dados iniciais
node scripts/verify-installation.mjs  # Verificar instalação

# Produção
pnpm build                      # Build para produção
pnpm start                      # Iniciar servidor de produção

# Testes
pnpm test                       # Rodar testes
pnpm test:watch                 # Modo watch para testes

# Formatação
pnpm format                     # Formatar código com Prettier
```

---

## 🔐 Credenciais Padrão

### Usuários de Teste
- **Email:** admin@bpoek.com
- **Senha:** admin123
- **Perfil:** Administrador

### Usuário Principal
- **Email:** helbert@hjfconsultorias.com.br
- **Senha:** Ab460401 (Alterada em produção)
- **Perfil:** Administrador

⚠️ **IMPORTANTE:** Altere as senhas padrão imediatamente após a instalação!

---

## 🐛 Troubleshooting

### Problema: "DATABASE_URL is required"
**Solução:** Certifique-se de que o arquivo `.env` existe e contém `DATABASE_URL`

### Problema: "Tabelas não existem"
**Solução:** Execute `pnpm db:push` para criar as tabelas

### Problema: "Nenhum usuário cadastrado"
**Solução:** Execute `node scripts/seed-database.mjs` para popular dados iniciais

### Problema: "Porta 3000 já está em uso"
**Solução:** Execute `PORT=3001 pnpm dev` para usar outra porta

### Problema: "Erro ao conectar no banco de dados"
**Solução:**
1. Verifique se MySQL está rodando
2. Confirme DATABASE_URL no arquivo `.env`
3. Teste a conexão: `mysql -u usuario -p`

---

## 📞 Suporte

Se encontrar problemas:

1. Consulte a documentação: `docs/GUIA_INSTALACAO.md`
2. Verifique a auditoria: `AUDITORIA_SISTEMA_PRODUCAO.md`
3. Execute o script de verificação: `node scripts/verify-installation.mjs`
4. Revise os logs no console do navegador e terminal

---

## ✅ Checklist de Deploy

- [ ] Verificar se todas as dependências estão instaladas
- [ ] Confirmar variáveis de ambiente (`.env`)
- [ ] Executar `pnpm check` para verificar tipos
- [ ] Fazer backup do banco de dados (se aplicável)
- [ ] Executar `pnpm db:push` para aplicar schema
- [ ] Executar `node scripts/verify-installation.mjs`
- [ ] Testar login com credenciais padrão
- [ ] Verificar todas as funcionalidades principais
- [ ] Alterar senhas padrão
- [ ] Configurar SSL/HTTPS (se em produção)
- [ ] Configurar backup automático do banco de dados

---

## 📊 Próximos Passos

1. ✅ **Deploy no Manus Space** - Fazer upload do código
2. ✅ **Verificar Funcionamento** - Testar todas as funcionalidades
3. ⏳ **Remover Dados de Teste** - Deletar eventos e usuários de teste
4. ⏳ **Implementar Módulos Faltantes** - RH, AGENDA, etc.
5. ⏳ **Melhorias de Performance** - Otimizações e cache

---

**Última Atualização:** 09 de dezembro de 2025  
**Preparado por:** Manus AI  
**Status:** ✅ Pronto para Deploy
