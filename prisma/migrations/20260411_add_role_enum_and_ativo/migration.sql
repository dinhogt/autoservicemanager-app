-- AlterTable: add `ativo` column to UsuarioAdmin
ALTER TABLE `UsuarioAdmin` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: convert `role` from VARCHAR to ENUM
ALTER TABLE `UsuarioAdmin` MODIFY COLUMN `role` ENUM('ADMIN', 'GERENTE', 'MECANICO', 'ATENDENTE') NOT NULL DEFAULT 'ATENDENTE';

-- Update existing rows with old 'admin' string value to new ADMIN enum
UPDATE `UsuarioAdmin` SET `role` = 'ADMIN' WHERE `role` = 'admin' OR `role` = 'ADMIN';
