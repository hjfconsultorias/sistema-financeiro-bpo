-- ============================================================================
-- BACKUP SQL - SISTEMA FINANCEIRO EK-EMPREENDIMENTO
-- ============================================================================
-- Data: 09 de dezembro de 2025
-- Hora: 13:34 GMT-3
-- Banco de Dados: sistema_financeiro
-- Versão: 1.0
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- TABELA: COMPANIES (Empresas/CNPJs)
-- ============================================================================

DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `companies` VALUES
('gp1', '63.111.417/0001-41', 'GESTAO COMPARTILHADA DE PARQUES E EMPREENDIMENTOS INFANTIS LTDA', 'administracao@eventoskids.com.br', '(31) 3143-0281', 'Endereço GP1', 'PEDRO LEOPOLDO', 'MG', true, NOW(), NOW()),
('gp2', '00.000.000/0002-00', 'ARENA COLORPARQUE', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP2', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp3', '42.741.123/0001-23', 'BJF EMPREENDIMENTOS EM ENTRETENIMENTO E COMERCIO LTDA', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP3', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp4', '12.041.951/0001-98', 'HJF EMPREENDIMENTOS EM JOGOS DESPORTIVOS COMERCIO E SERVICOS EM CONSULTORIA LTDA', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP4', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp5', '30.008.109/0001-36', 'HJA EMPREENDIMENTOS COMERCIAIS E SERVICOS LTDA', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP5', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp6', '42.877.487/0001-35', 'HJJC EMPREENDIMENTOS EM ENTRETENIMENTO E COMERCIO LTDA', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP6', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp7', '32.040.648/0001-88', 'JJHTC EMPREENDIMENTOS EM JOGOS DESPORTIVOS E COMERCIO LTDA', 'administracao@eventokids.com.br', '(31) 3143-0281', 'Endereço GP7', 'BELO HORIZONTE', 'MG', true, NOW(), NOW()),
('gp8', '54.728.831/0001-03', 'JM ENTRETENIMENTO INFANTIL LTDA', 'joaoarthurcastilho@gmail.com', '(31) 9792-7904', 'Endereço GP8', 'VALINHOS', 'SP', true, NOW(), NOW()),
('gp9', '50.103.398/0001-60', 'CLUB KIDS LTDA', 'solucaoemconsultoria@gmail.com', '(37) 3413-0141', 'Endereço GP9', 'SAO GONCALO DO PARA', 'MG', true, NOW(), NOW());

-- ============================================================================
-- TABELA: COST_CENTERS (Eventos/Centros de Custo)
-- ============================================================================

DROP TABLE IF EXISTS `cost_centers`;
CREATE TABLE `cost_centers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cost_centers` VALUES
('cc1', 'Animais Mágicos', 'Evento Animais Mágicos', true, NOW(), NOW()),
('cc2', 'ARENA PARK POCKET 3', 'Evento Arena Park Pocket 3', true, NOW(), NOW()),
('cc3', 'COLOR PARK POCKET 4', 'Evento Color Park Pocket 4', true, NOW(), NOW()),
('cc4', 'Av na Neve', 'Evento Av na Neve', true, NOW(), NOW()),
('cc5', 'Fabrica de Chocolate', 'Evento Fabrica de Chocolate', true, NOW(), NOW()),
('cc6', 'Aladin', 'Evento Aladin', true, NOW(), NOW()),
('cc7', 'Jurassic Kids', 'Evento Jurassic Kids', true, NOW(), NOW()),
('cc8', 'COLOR PARK POCKET 2', 'Evento Color Park Pocket 2', true, NOW(), NOW()),
('cc9', 'COLOR PARK POCKET 5', 'Evento Color Park Pocket 5', true, NOW(), NOW()),
('cc10', 'ARENA PARK POCKET 2', 'Evento Arena Park Pocket 2', true, NOW(), NOW()),
('cc11', 'PASSEIO NAS ESTRELAS', 'Evento PASSEIO NAS ESTRELAS', true, NOW(), NOW()),
('cc12', 'Dino Word', 'Evento Dino Word', true, NOW(), NOW()),
('cc13', 'Av Congelante - Bp', 'Evento Av Congelante - Bp', true, NOW(), NOW()),
('cc14', 'Universo Inseto', 'Evento Universo Inseto', true, NOW(), NOW()),
('cc15', 'Brinquedolandia', 'Evento Brinquedolandia', true, NOW(), NOW()),
('cc16', 'ARENA PARK POCKET 1', 'Evento ARENA PARK POCKET 1', true, NOW(), NOW()),
('cc17', 'Tarzan', 'Evento Tarzan', true, NOW(), NOW()),
('cc18', 'PATRULHA KIDS', 'Evento PATRULHA KIDS', true, NOW(), NOW()),
('cc19', 'Heroes Pete', 'Evento Heroes Pete', true, NOW(), NOW()),
('cc20', 'Duelo de Titãns', 'Evento Duelo de Titãns', true, NOW(), NOW()),
('cc21', 'COLOR PARK POCKET 3', 'Evento COLOR PARK POCKET 3', true, NOW(), NOW()),
('cc22', 'Peter Pan', 'Evento Peter Pan', true, NOW(), NOW()),
('cc23', 'Floresta Bp', 'Evento Floresta Bp', true, NOW(), NOW()),
('cc24', 'Fazendinha-Bp', 'Evento Fazendinha-Bp', true, NOW(), NOW()),
('cc25', 'Galaxia Kids - Bp', 'Evento Galaxia Kids - Bp', true, NOW(), NOW()),
('cc26', 'Magic Park PARK MEGA', 'Evento Magic Park PARK MEGA', true, NOW(), NOW()),
('cc27', 'Circo 1', 'Evento Circo 1', true, NOW(), NOW()),
('cc28', 'COLOR PARK MEGA', 'Evento COLOR PARK MEGA', true, NOW(), NOW()),
('cc29', 'Magic Park pocket', 'Evento Magic Park pocket', true, NOW(), NOW()),
('cc30', 'Turma AeroKkids - Bp', 'Evento Turma AeroKkids - Bp', true, NOW(), NOW()),
('cc31', 'Sitio Kids', 'Evento Sitio Kids', true, NOW(), NOW()),
('cc32', 'Praia Kids Bp', 'Evento Praia Kids Bp', true, NOW(), NOW()),
('cc33', 'Pnoquio', 'Evento Pnoquio', true, NOW(), NOW()),
('cc34', 'Os Piratas - Bp', 'Evento Os Piratas - Bp', true, NOW(), NOW()),
('cc35', 'Mundo Ninja', 'Evento Mundo Ninja', true, NOW(), NOW()),
('cc36', 'Inseto -Bp', 'Evento Inseto -Bp', true, NOW(), NOW()),
('cc37', 'ARENA PARK MEGA', 'Evento ARENA PARK MEGA', true, NOW(), NOW()),
('cc38', 'Fundo Do Mar', 'Evento Fundo Do Mar', true, NOW(), NOW()),
('cc39', 'Av em Alto Mar - Bp', 'Evento Av em Alto Mar - Bp', true, NOW(), NOW()),
('cc40', 'Fabrica de Chocolate -Bp', 'Evento Fabrica de Chocolate -Bp', true, NOW(), NOW()),
('cc41', 'Era Glacial', 'Evento Era Glacial', true, NOW(), NOW()),
('cc42', 'Dino Baby - Bp', 'Evento Dino Baby - Bp', true, NOW(), NOW()),
('cc43', 'SITIO Kids 1', 'Evento SITIO Kids 1', true, NOW(), NOW()),
('cc44', 'COLOR PARK POCKET 1', 'Evento COLOR PARK POCKET 1', true, NOW(), NOW()),
('cc45', 'Circo -Bp', 'Evento Circo -Bp', true, NOW(), NOW()),
('cc46', 'Evento Teste Final Shopping', 'Evento de teste', false, NOW(), NOW()),
('cc47', 'Evento Sem Empresa', 'Este evento não deveria ser criado', false, NOW(), NOW()),
('cc48', 'Galaxia Shopping Sul', 'Evento itinerante no Shopping Norte', false, NOW(), NOW()),
('cc49', 'Galaxia Shopping Norte', 'Evento itinerante no Shopping Norte', false, NOW(), NOW()),
('cc50', 'Test Cost Center', 'For testing', false, NOW(), NOW());

-- ============================================================================
-- TABELA: CATEGORIES (Categorias)
-- ============================================================================

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('EXPENSE', 'REVENUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` VALUES
('cat1', '01 - Despesas FIXA', 'EXPENSE', 1, true, NOW(), NOW()),
('cat2', '02 - Despesas MOVIMENTACAO', 'EXPENSE', 2, true, NOW(), NOW()),
('cat3', '03 - Despesas OPERACIONAL', 'EXPENSE', 3, true, NOW(), NOW()),
('cat4', '05 - Despesas COM PESSOAL', 'EXPENSE', 5, true, NOW(), NOW()),
('cat5', '06 - Despesas VARIAVEL', 'EXPENSE', 6, true, NOW(), NOW()),
('cat6', '07 - DESPESAS RET. DISTR DE VALORES EBITIDA', 'EXPENSE', 7, true, NOW(), NOW()),
('cat7', 'Marketing', 'EXPENSE', 8, true, NOW(), NOW()),
('cat8', 'Operacional', 'EXPENSE', 9, true, NOW(), NOW()),
('cat9', 'Pessoal', 'EXPENSE', 10, true, NOW(), NOW()),
('cat10', 'Receitas Diretas', 'REVENUE', 1, true, NOW(), NOW()),
('cat11', 'Receitas Indiretas', 'REVENUE', 2, true, NOW(), NOW()),
('cat12', 'Receitas Outras Entradas', 'REVENUE', 3, true, NOW(), NOW()),
('cat13', 'Serviços', 'REVENUE', 4, true, NOW(), NOW()),
('cat14', 'Vendas', 'REVENUE', 5, true, NOW(), NOW());

-- ============================================================================
-- TABELA: SYSTEM_USERS (Usuários do Sistema)
-- ============================================================================

DROP TABLE IF EXISTS `system_users`;
CREATE TABLE `system_users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci,
  `role` enum('ADMIN', 'MANAGER', 'USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `is_active` boolean NOT NULL DEFAULT true,
  `last_login` datetime(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_users` VALUES
('user1', 'helbert@hjfconsultorias.com.br', 'Helbert Costa Fonseca', '$2b$10$hash_helbert', '31989899050', 'ADMIN', true, NOW(), NOW(), NOW()),
('user2', 'chcfonseca@gmail.com', 'Carlos Fonseca', '$2b$10$hash_carlos', '31987654321', 'MANAGER', true, NOW(), NOW(), NOW()),
('user3', 'barcelosjuliano@hotmail.com', 'Juliano Barcelos', '$2b$10$hash_juliano', '31987654322', 'MANAGER', true, NOW(), NOW(), NOW()),
('user4', 'contato@franquiakids.com.br', 'Antonio Lucio', '$2b$10$hash_antonio', '31987654323', 'MANAGER', true, NOW(), NOW(), NOW()),
('user5', 'laura950santos@gmail.com', 'Laura Santos', '$2b$10$hash_laura', '31987654324', 'MANAGER', true, NOW(), NOW(), NOW());

-- ============================================================================
-- TABELA: DAILY_REVENUES (Receitas Diárias)
-- ============================================================================

DROP TABLE IF EXISTS `daily_revenues`;
CREATE TABLE `daily_revenues` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_center_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revenue_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir 302 receitas diárias (amostra)
-- Nota: Dados reais foram removidos conforme solicitado

-- ============================================================================
-- TABELA: ACCOUNTS_PAYABLE (Contas a Pagar)
-- ============================================================================

DROP TABLE IF EXISTS `accounts_payable`;
CREATE TABLE `accounts_payable` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_center_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `payment_date` date,
  `status` enum('PENDING', 'PAID', 'OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir 712 contas a pagar (amostra)
-- Nota: Dados reais foram removidos conforme solicitado

-- ============================================================================
-- TABELA: ACCOUNTS_RECEIVABLE (Contas a Receber)
-- ============================================================================

DROP TABLE IF EXISTS `accounts_receivable`;
CREATE TABLE `accounts_receivable` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(191) COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `payment_date` date,
  `status` enum('PENDING', 'PAID', 'OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: CLIENTS (Clientes)
-- ============================================================================

DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj_cpf` varchar(191) COLLATE utf8mb4_unicode_ci,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: SUPPLIERS (Fornecedores)
-- ============================================================================

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj_cpf` varchar(191) COLLATE utf8mb4_unicode_ci,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÍNDICES ADICIONAIS
-- ============================================================================

CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_cost_centers_is_active ON cost_centers(is_active);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_system_users_email ON system_users(email);
CREATE INDEX idx_system_users_is_active ON system_users(is_active);
CREATE INDEX idx_daily_revenues_date ON daily_revenues(revenue_date);
CREATE INDEX idx_daily_revenues_company ON daily_revenues(company_id);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_company ON accounts_payable(company_id);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- ============================================================================
-- ATIVAR VERIFICAÇÃO DE CHAVE ESTRANGEIRA
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- FIM DO BACKUP
-- ============================================================================
-- Total de Registros:
-- - Companies: 9
-- - Cost Centers: 50
-- - Categories: 14
-- - System Users: 5 (1 teste removido)
-- - Daily Revenues: 302 (estrutura preservada)
-- - Accounts Payable: 712 (estrutura preservada)
-- - Accounts Receivable: estrutura preservada
-- - Clients: estrutura preservada
-- - Suppliers: estrutura preservada
--
-- Data do Backup: 2025-12-09
-- Versão do Sistema: 1.0
-- Status: PRONTO PARA DEPLOY
-- ============================================================================

