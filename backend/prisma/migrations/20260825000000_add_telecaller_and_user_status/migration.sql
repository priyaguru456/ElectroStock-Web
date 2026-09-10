-- Add TELECALLER to the Role enum
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'SALES_MANAGER', 'SALES_STAFF', 'TELECALLER') NOT NULL;

-- Add status column (temporary default so backfill can run)
ALTER TABLE `users` ADD COLUMN `status` ENUM('ACTIVE', 'ON_LEAVE', 'RESIGNED') NOT NULL DEFAULT 'ACTIVE';

-- Backfill status from the old is_active flag
UPDATE `users` SET `status` = 'RESIGNED' WHERE `is_active` = false;

-- Drop the old is_active column
ALTER TABLE `users` DROP COLUMN `is_active`;
