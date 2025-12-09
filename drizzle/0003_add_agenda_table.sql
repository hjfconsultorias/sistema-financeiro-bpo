-- Migration: Add AGENDA table
-- Description: Create AGENDA table for event scheduling and management
-- Date: 2025-12-09

CREATE TABLE IF NOT EXISTS `agenda` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_center_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `period` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shopping` varchar(191) COLLATE utf8mb4_unicode_ci,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci,
  `network` varchar(191) COLLATE utf8mb4_unicode_ci,
  `classification` varchar(191) COLLATE utf8mb4_unicode_ci,
  `rent` decimal(10,2),
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`),
  UNIQUE KEY `unique_agenda` (`company_id`, `cost_center_id`, `year`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_agenda_company ON agenda(company_id);
CREATE INDEX idx_agenda_cost_center ON agenda(cost_center_id);
CREATE INDEX idx_agenda_year ON agenda(year);
CREATE INDEX idx_agenda_status ON agenda(status);
CREATE INDEX idx_agenda_is_active ON agenda(is_active);

-- Insert sample data
INSERT INTO `agenda` (`id`, `company_id`, `cost_center_id`, `year`, `period`, `status`, `shopping`, `state`, `network`, `classification`, `rent`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
('ag1', 'gp1', 'cc24', 2026, 'Janeiro a Fevereiro', 'Fase de Contrato', 'PRUDEM', 'SP', 'ARGOPLAN', 'Excelente', 1000.00, NULL, true, NOW(), NOW()),
('ag2', 'gp1', 'cc25', 2026, 'Março a Abril', 'Proposto - Aguardando envio de documentacao', 'ILHA PLAZA', 'RJ', 'SOLL MALS', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag3', 'gp1', 'cc26', 2026, 'Maio e Junho', 'Proposto - Aguardando envio de documentacao', 'ILHA PLAZA', 'RJ', 'SOLL MALS', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag4', 'gp1', 'cc27', 2026, 'Julho e Agosto', 'Proposto - Aguardando envio de documentacao', 'ILHA PLAZA', 'RJ', 'SOLL MALS', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag5', 'gp1', 'cc28', 2026, 'setembro e Outubro', 'Proposto - Aguardando envio de documentacao', 'ILHA PLAZA', 'RJ', 'SOLL MALS', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag6', 'gp1', 'cc29', 2026, 'novembro e Dezembro', 'LIBERADO (Natal)', NULL, NULL, NULL, NULL, 1000.00, NULL, true, NOW(), NOW()),
('ag7', 'gp2', 'cc30', 2026, 'Janeiro a Fevereiro', 'Fase de Contrato', 'Shopping Sul', 'GO', 'Terral', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag8', 'gp2', 'cc31', 2026, 'Março a Abril', 'Proposto - Aguardando envio de documentacao', 'Sinop/ Macae', 'GO', 'ADMALL', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag9', 'gp3', 'cc32', 2026, 'Maio e Junho', 'Fase de Contrato', 'Shopping Madureira', 'RJ', 'ANCAR', 'Medio', 1000.00, NULL, true, NOW(), NOW()),
('ag10', 'gp3', 'cc33', 2026, 'Julho e Agosto', 'LIBERADO', NULL, NULL, NULL, NULL, 1000.00, NULL, true, NOW(), NOW());
