-- ================================================
-- MIGRATION 0003: MÓDULO AGENDA
-- ================================================
-- Descrição: Módulo completo de gestão de agenda de eventos
-- Data: 2025-12-10
-- Autor: Manus AI
-- ================================================

-- Tabela: AGENDA
-- Descrição: Gerencia eventos da agenda por empresa e centro de custo
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` varchar(191) NOT NULL,
  `company_id` varchar(191) NOT NULL,
  `cost_center_id` varchar(191) NOT NULL,
  `year` int NOT NULL,
  `period` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `shopping` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `network` varchar(191) DEFAULT NULL,
  `classification` varchar(191) DEFAULT NULL,
  `rent` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_agenda_entry` (`company_id`, `cost_center_id`, `year`, `period`),
  KEY `idx_agenda_company` (`company_id`),
  KEY `idx_agenda_cost_center` (`cost_center_id`),
  KEY `idx_agenda_year` (`year`),
  KEY `idx_agenda_status` (`status`),
  KEY `idx_agenda_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- FIM DA MIGRATION 0003
-- ================================================
