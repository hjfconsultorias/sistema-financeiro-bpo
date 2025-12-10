-- Migration: Fix AGENDA table structure
-- Description: Correct foreign key reference from cost_centers to events
-- Date: 2025-12-09
-- Author: Manus AI

-- Step 1: Drop existing foreign key constraint
ALTER TABLE `agenda` DROP FOREIGN KEY `agenda_ibfk_2`;

-- Step 2: Drop existing index
DROP INDEX `idx_agenda_cost_center` ON `agenda`;

-- Step 3: Rename column from cost_center_id to event_id
ALTER TABLE `agenda` CHANGE COLUMN `cost_center_id` `event_id` int NOT NULL;

-- Step 4: Add new foreign key constraint referencing events table
ALTER TABLE `agenda` ADD CONSTRAINT `fk_agenda_event` 
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Create new index for event_id
CREATE INDEX `idx_agenda_event` ON `agenda`(`event_id`);

-- Step 6: Update unique key to use event_id instead of cost_center_id
ALTER TABLE `agenda` DROP INDEX `unique_agenda`;
ALTER TABLE `agenda` ADD UNIQUE KEY `unique_agenda` (`company_id`, `event_id`, `year`, `period`);

-- Step 7: Clear sample data (will be re-imported with correct structure)
DELETE FROM `agenda`;
