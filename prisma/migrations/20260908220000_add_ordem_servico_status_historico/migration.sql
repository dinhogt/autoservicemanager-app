-- CreateTable
CREATE TABLE `OrdemServicoStatusHistorico` (
    `id` VARCHAR(191) NOT NULL,
    `ordemServicoId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'EM_EXECUCAO', 'FINALIZADA', 'ENTREGUE', 'REJEITADA') NULL,
    `toStatus` ENUM('RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'EM_EXECUCAO', 'FINALIZADA', 'ENTREGUE', 'REJEITADA') NOT NULL,
    `eventType` VARCHAR(191) NULL,
    `context` VARCHAR(191) NULL,
    `enteredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrdemServicoStatusHistorico_ordemServicoId_enteredAt_idx`(`ordemServicoId`, `enteredAt`),
    INDEX `OrdemServicoStatusHistorico_toStatus_enteredAt_idx`(`toStatus`, `enteredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrdemServicoStatusHistorico` ADD CONSTRAINT `OrdemServicoStatusHistorico_ordemServicoId_fkey` FOREIGN KEY (`ordemServicoId`) REFERENCES `OrdemServico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
