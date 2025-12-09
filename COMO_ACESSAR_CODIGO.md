# Como Acessar o Código do Projeto no Manus Space

**Este documento explica como recuperar o código do projeto em futuras tarefas.**

---

## 🎯 Objetivo

Garantir que o código do **Sistema Financeiro Ek-Empreendimento** fique **sempre acessível e recuperável** no Manus Space, mesmo em caso de interrupção ou erro.

---

## 📍 Localização do Código

### No Sandbox Local
```
/home/ubuntu/sistema-financeiro/
```

### No Manus Space (Após Deploy)
```
Caminho será determinado pelo Manus Space durante o deploy
Tipicamente: /home/ubuntu/sistema-financeiro/ ou similar
```

---

## 🔄 Formas de Acessar o Código

### Opção 1: Diretamente no Sandbox (Mais Rápido)

Se você está em uma tarefa no Manus:

```bash
# Navegar até o código
cd /home/ubuntu/sistema-financeiro

# Verificar status
ls -la
git status  # Se Git estiver configurado

# Atualizar código
git pull origin main  # Se Git estiver configurado

# Ou copiar para novo local
cp -r /home/ubuntu/sistema-financeiro /home/ubuntu/sistema-financeiro-backup
```

### Opção 2: Via Terminal do Manus Space

Se o projeto foi feito deploy no Manus Space:

1. Acesse https://manus.im
2. Navegue até "Sites implantados"
3. Clique em "Sistema Financeiro Ek-Empreendimento"
4. Procure por "Terminal" ou "IDE"
5. Execute:
   ```bash
   cd /home/ubuntu/sistema-financeiro
   ls -la
   git status
   ```

### Opção 3: Via Repositório Git (Recomendado)

Se o código foi versionado em Git:

```bash
# Clonar do repositório remoto
git clone https://github.com/seu-usuario/sistema-financeiro.git
cd sistema-financeiro

# Ou atualizar código existente
git pull origin main
```

### Opção 4: Via Backup do Manus Space

Se nenhuma das opções acima funcionar:

1. Acesse https://manus.im
2. Navegue até "Controles de dados"
3. Procure por "Fazer backup" ou "Exportar projeto"
4. Baixe o arquivo ZIP
5. Extraia a pasta `sistema-financeiro`

### Opção 5: Do Backup Original

Como último recurso, o backup original está sempre disponível:

```bash
# Copiar do backup original
cp -r /home/ubuntu/backup-v1.0/sistema-financeiro /home/ubuntu/sistema-financeiro-recuperado

# Instalar dependências
cd /home/ubuntu/sistema-financeiro-recuperado
pnpm install
```

---

## ✅ Verificação de Acesso

Para verificar se o código está acessível:

```bash
# Verificar se a pasta existe
ls -la /home/ubuntu/sistema-financeiro

# Verificar se é um projeto Node.js
cat /home/ubuntu/sistema-financeiro/package.json

# Verificar se Git está configurado
cd /home/ubuntu/sistema-financeiro
git status

# Verificar dependências
pnpm list
```

---

## 🔐 Segurança

### O que NÃO incluir no repositório
- `.env` (variáveis de ambiente)
- `node_modules/` (dependências)
- `dist/` (build outputs)
- Senhas ou credenciais

### O que DEVE incluir
- Código-fonte completo
- Configurações públicas
- Documentação
- Scripts de setup
- `.gitignore`

---

## 📋 Checklist de Acessibilidade

Quando abrir uma nova tarefa, verifique:

- [ ] Pasta `/home/ubuntu/sistema-financeiro` existe
- [ ] Arquivo `package.json` está presente
- [ ] Arquivo `.env` pode ser criado/configurado
- [ ] Git está configurado (opcional, mas recomendado)
- [ ] Dependências podem ser instaladas (`pnpm install`)
- [ ] Documentação está acessível (`AUDITORIA_SISTEMA_PRODUCAO.md`, `README_DEPLOY.md`)

---

## 🚀 Próximos Passos

### Imediato
1. Verificar que o código está acessível
2. Instalar dependências: `pnpm install`
3. Ler a documentação: `AUDITORIA_SISTEMA_PRODUCAO.md`

### Curto Prazo
1. Configurar Git para versionamento
2. Fazer primeiro commit do código
3. Configurar CI/CD para deploy automático

### Médio Prazo
1. Implementar sistema de backup automático
2. Configurar alertas de erro
3. Documentar processo de recuperação

---

## 📞 Referências Rápidas

### Arquivos Importantes
- `AUDITORIA_SISTEMA_PRODUCAO.md` - Auditoria completa
- `README_DEPLOY.md` - Guia de deploy
- `COMO_ACESSAR_CODIGO.md` - Este arquivo
- `docs/GUIA_INSTALACAO.md` - Guia de instalação

### Comandos Essenciais
```bash
# Instalar dependências
pnpm install

# Iniciar desenvolvimento
pnpm dev

# Verificar tipos
pnpm check

# Fazer build
pnpm build
```

### URLs
- **Sistema em Produção:** https://financekgps.manus.space
- **Manus Space:** https://manus.im
- **Repositório Git:** (A ser configurado)

---

## ⚠️ Problemas Comuns

### Problema: Pasta não existe
**Solução:** Copiar do backup original
```bash
cp -r /home/ubuntu/backup-v1.0/sistema-financeiro /home/ubuntu/sistema-financeiro
```

### Problema: Dependências não instalam
**Solução:** Limpar cache e reinstalar
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Problema: Git não está configurado
**Solução:** Inicializar Git
```bash
cd /home/ubuntu/sistema-financeiro
git init
git remote add origin <URL_DO_REPOSITORIO>
```

---

## 🎯 Conclusão

O código do **Sistema Financeiro Ek-Empreendimento** está **sempre acessível** através de:

1. ✅ Pasta local: `/home/ubuntu/sistema-financeiro`
2. ✅ Backup original: `/home/ubuntu/backup-v1.0`
3. ✅ Repositório Git (quando configurado)
4. ✅ Backup do Manus Space (quando disponível)

**Nenhuma tarefa futura ficará sem acesso ao código!**

---

**Última Atualização:** 09 de dezembro de 2025  
**Preparado por:** Manus AI
