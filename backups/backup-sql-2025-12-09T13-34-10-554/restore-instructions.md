# Instruções de Restauração do Backup

## Pré-requisitos
- MySQL 8.0+ instalado
- Acesso ao terminal/console
- Arquivo database.sql disponível

## Passos para Restaurar

### 1. Criar Banco de Dados
```bash
mysql -u root -p
CREATE DATABASE sistema_financeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Restaurar Dados
```bash
mysql -u root -p sistema_financeiro < database.sql
```

### 3. Verificar Restauração
```bash
mysql -u root -p sistema_financeiro
SHOW TABLES;
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM cost_centers;
SELECT COUNT(*) FROM system_users;
EXIT;
```

### 4. Configurar Aplicação
Atualizar arquivo .env:
```
DATABASE_URL=mysql://root:senha@localhost:3306/sistema_financeiro
```

### 5. Instalar e Testar
```bash
pnpm install
pnpm dev
```

## Troubleshooting

### Erro: "Access denied for user"
Verificar credenciais MySQL e permissões

### Erro: "Database already exists"
Dropar banco existente:
```bash
mysql -u root -p
DROP DATABASE sistema_financeiro;
CREATE DATABASE sistema_financeiro;
EXIT;
```

### Erro: "Table already exists"
Usar opção de drop:
```bash
mysql -u root -p sistema_financeiro < database.sql --force
```

## Suporte
Para problemas, consulte a documentação técnica ou entre em contato com o administrador.
