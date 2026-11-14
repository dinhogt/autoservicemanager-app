CREATE TABLE `SagaInstance` (
  `id` VARCHAR(191) NOT NULL,
  `ordemServicoId` VARCHAR(191) NOT NULL,
  `correlationId` VARCHAR(191) NOT NULL,
  `status` ENUM(
    'AWAITING_DIAGNOSIS',
    'AWAITING_BUDGET_APPROVAL',
    'AWAITING_PAYMENT',
    'AWAITING_EXECUTION',
    'AWAITING_REFUND',
    'COMPLETED',
    'COMPENSATED',
    'FAILED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'AWAITING_DIAGNOSIS',
  `version` INTEGER NOT NULL DEFAULT 0,
  `paymentId` VARCHAR(191) NULL,
  `failureReason` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `SagaInstance_ordemServicoId_key`(`ordemServicoId`),
  UNIQUE INDEX `SagaInstance_correlationId_key`(`correlationId`),
  INDEX `SagaInstance_status_updatedAt_idx`(`status`, `updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SagaProcessedEvent` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `sagaId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `SagaProcessedEvent_eventId_key`(`eventId`),
  INDEX `SagaProcessedEvent_sagaId_processedAt_idx`(`sagaId`, `processedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SagaProcessedEvent`
  ADD CONSTRAINT `SagaProcessedEvent_sagaId_fkey`
  FOREIGN KEY (`sagaId`) REFERENCES `SagaInstance`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `SagaOutboxMessage` (
  `id` VARCHAR(191) NOT NULL,
  `sagaId` VARCHAR(191) NOT NULL,
  `destination` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `SagaOutboxMessage_sagaId_publishedAt_createdAt_idx`(
    `sagaId`, `publishedAt`, `createdAt`
  ),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SagaOutboxMessage`
  ADD CONSTRAINT `SagaOutboxMessage_sagaId_fkey`
  FOREIGN KEY (`sagaId`) REFERENCES `SagaInstance`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
