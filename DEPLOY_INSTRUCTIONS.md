# Instruções de Deploy - Sistema Financeiro EK-Empreendimento

## 🚀 Deploy Permanente em bpoekgps.manus.space

### 📋 Pré-requisitos

- ✅ Código do projeto preparado
- ✅ Backup SQL realizado
- ✅ Variáveis de ambiente configuradas
- ✅ Novo domínio registrado: `bpoekgps.manus.space`

### 🔧 Passos para Deploy

#### 1. Preparar o Repositório

```bash
cd /home/ubuntu/sistema-financeiro

# Verificar status do projeto
pnpm install
pnpm build

# Verificar se tudo está funcionando
pnpm dev
```

#### 2. Configurar Variáveis de Ambiente

O arquivo `.env.production` já foi criado com as configurações:

```bash
cat .env.production
```

**Importante:** Atualizar as credenciais do banco de dados antes do deploy:
- `DATABASE_URL` - Credenciais do banco de dados do Manus Space
- `JWT_SECRET` - Gerar uma chave segura

#### 3. Fazer Deploy no Manus Space

**Opção A: Via Interface do Manus (Recomendado)**

1. Acessar o Manus Space
2. Ir para "Meus Projetos"
3. Selecionar "Sistema Financeiro Ek-Empreendimento"
4. Clicar em "Deploy"
5. Selecionar branch/versão
6. Confirmar deploy

**Opção B: Via Terminal/CLI**

```bash
# Login no Manus
manus login

# Deploy do projeto
manus deploy --project sistema-financeiro-bpo \
  --domain bpoekgps.manus.space \
  --env production

# Acompanhar o deploy
manus logs --follow
```

#### 4. Configurar Banco de Dados

Após o deploy:

```bash
# Restaurar backup
mysql -u usuario -p sistema_financeiro_bpo < backup-sql-2025-12-09.zip

# Ou manualmente
unzip backup-sql-2025-12-09.zip
mysql -u usuario -p sistema_financeiro_bpo < database.sql
```

#### 5. Validar Deploy

```bash
# Verificar se o site está online
curl https://bpoekgps.manus.space

# Verificar logs
manus logs --project sistema-financeiro-bpo

# Testar login
# Acessar https://bpoekgps.manus.space/login
# Email: helbert@hjfconsultorias.com.br
# Senha: Ab460401
```

### 📊 Checklist de Deploy

- [ ] Código preparado e testado
- [ ] Backup SQL realizado e salvo
- [ ] Variáveis de ambiente configuradas
- [ ] Novo domínio registrado
- [ ] Certificado SSL configurado
- [ ] Banco de dados restaurado
- [ ] Login testado
- [ ] Dados críticos verificados
- [ ] Monitoramento ativado
- [ ] Backup automático configurado

### 🔄 Rollback (Se Necessário)

Se algo der errado:

```bash
# Voltar para versão anterior
manus rollback --project sistema-financeiro-bpo --version anterior

# Ou restaurar do backup
mysql -u usuario -p sistema_financeiro_bpo < backup-sql-anterior.sql
```

### 📞 Suporte

**Administrador:** Helbert Costa Fonseca  
**Email:** helbert@hjfconsultorias.com.br  
**Telefone:** (31) 99899-9999

### 📝 Notas Importantes

1. **Domínio Antigo:** O domínio `financekgps.manus.space` será descontinuado após o deploy bem-sucedido
2. **Backup:** Manter backup local seguro
3. **Monitoramento:** Ativar alertas para uptime e performance
4. **Atualizações:** Planejar atualizações em horários de baixa demanda
5. **Documentação:** Manter documentação atualizada

---

**Status:** ✅ PRONTO PARA DEPLOY  
**Data:** 09 de dezembro de 2025  
**Versão:** 1.0
