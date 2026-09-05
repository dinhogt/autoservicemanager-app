-- Add soft-delete `ativo` flag to Cliente, Veiculo, ServicoCatalogo and PecaEstoque
ALTER TABLE `Cliente` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Veiculo` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `ServicoCatalogo` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `PecaEstoque` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- Indexes to keep filtering by ativo cheap
CREATE INDEX `Cliente_ativo_idx` ON `Cliente`(`ativo`);
CREATE INDEX `Veiculo_ativo_idx` ON `Veiculo`(`ativo`);
CREATE INDEX `ServicoCatalogo_ativo_idx` ON `ServicoCatalogo`(`ativo`);
CREATE INDEX `PecaEstoque_ativo_idx` ON `PecaEstoque`(`ativo`);
