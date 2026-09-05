-- CreateIndex
CREATE INDEX `OrdemServico_dataCriacao_idx` ON `OrdemServico`(`dataCriacao`);

-- CreateIndex
CREATE INDEX `OrdemServico_status_idx` ON `OrdemServico`(`status`);

-- RenameIndex
ALTER TABLE `OrdemServico` RENAME INDEX `OrdemServico_clienteId_fkey` TO `OrdemServico_clienteId_idx`;

-- RenameIndex
ALTER TABLE `OrdemServico` RENAME INDEX `OrdemServico_veiculoId_fkey` TO `OrdemServico_veiculoId_idx`;
