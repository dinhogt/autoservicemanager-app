import { Prisma } from '@prisma/client';
import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  type SagaCommandEnvelope,
  type SagaEventEnvelope,
} from '@dinhogt/domain-shared';
import {
  SagaStatus,
  type SagaInstance,
} from '../../../../domain/saga/saga.types';
import { PrismaSagaRepository } from './prisma-saga.repository';

const row = {
  id: 'saga-1',
  ordemServicoId: 'os-1',
  correlationId: 'corr-1',
  status: SagaStatus.AwaitingDiagnosis,
  version: 0,
  paymentId: null,
  failureReason: null,
  metadata: {},
};

const command: SagaCommandEnvelope = {
  schemaVersion: MESSAGE_SCHEMA_VERSION,
  messageId: 'cmd-1',
  messageType: SagaCommandType.AuthorizePayment,
  occurredAt: '2026-09-22T20:00:00.000Z',
  correlationId: 'corr-1',
  aggregateId: 'os-1',
  source: 'app',
  payload: {},
};

const envelope: SagaEventEnvelope = {
  ...command,
  messageId: 'evt-1',
  messageType: SagaEventType.DiagnosisCompleted,
};

describe('PrismaSagaRepository', () => {
  const sagaInstance = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const sagaProcessedEvent = {
    count: jest.fn(),
    create: jest.fn(),
  };
  const sagaOutboxMessage = {
    createMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };
  const ordemServico = { update: jest.fn() };
  const prisma = {
    sagaInstance,
    sagaProcessedEvent,
    sagaOutboxMessage,
    ordemServico,
    $transaction: jest.fn(),
  };
  const repository = new PrismaSagaRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) =>
        Promise.resolve(callback(prisma)),
    );
    sagaInstance.updateMany.mockResolvedValue({ count: 1 });
    sagaProcessedEvent.create.mockResolvedValue({});
    sagaOutboxMessage.createMany.mockResolvedValue({ count: 1 });
  });

  it('creates, finds and maps sagas', async () => {
    sagaInstance.create.mockResolvedValue(row);
    sagaInstance.findUnique
      .mockResolvedValueOnce({ ...row, metadata: null })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(row);
    await expect(
      repository.create({
        ordemServicoId: 'os-1',
        correlationId: 'corr-1',
      }),
    ).resolves.toEqual(row);
    await expect(repository.findByCorrelationId('corr-1')).resolves.toEqual({
      ...row,
      metadata: {},
    });
    await expect(repository.findByCorrelationId('missing')).resolves.toBeNull();
    await expect(repository.findByOrdemServicoId('os-1')).resolves.toEqual(row);
  });

  it('checks whether an event was processed', async () => {
    sagaProcessedEvent.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(repository.hasProcessed('evt-1')).resolves.toBe(true);
    await expect(repository.hasProcessed('evt-2')).resolves.toBe(false);
  });

  it('atomically applies a transition and writes its outbox', async () => {
    await expect(
      repository.applyEvent(
        row as SagaInstance,
        { envelope },
        {
          status: SagaStatus.AwaitingPayment,
          commands: [command],
        },
      ),
    ).resolves.toBe('applied');
    expect(sagaOutboxMessage.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ destination: 'billing' }),
        ]),
      }),
    );
    expect(ordemServico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'AGUARDANDO_APROVACAO' }),
      }),
    );
  });

  it.each([
    [SagaEventType.BudgetRejected, 'REJEITADA'],
    [SagaEventType.PaymentAuthorized, 'EM_EXECUCAO'],
    [SagaEventType.ExecutionCompleted, 'FINALIZADA'],
  ])('projects %s onto the order', async (messageType, status) => {
    await repository.applyEvent(
      row as SagaInstance,
      { envelope: { ...envelope, messageType } },
      { status: SagaStatus.Completed, commands: [] },
    );
    expect(ordemServico.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status }),
      }),
    );
  });

  it('returns conflict on optimistic lock and duplicate on P2002', async () => {
    sagaInstance.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      repository.applyEvent(
        row as SagaInstance,
        { envelope },
        {
          status: SagaStatus.Failed,
          commands: [],
        },
      ),
    ).resolves.toBe('conflict');

    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.8.2',
      }),
    );
    await expect(
      repository.applyEvent(
        row as SagaInstance,
        { envelope },
        {
          status: SagaStatus.Failed,
          commands: [],
        },
      ),
    ).resolves.toBe('duplicate');
  });

  it('rethrows unexpected persistence errors', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('database down'));
    await expect(
      repository.applyEvent(
        row as SagaInstance,
        { envelope },
        {
          status: SagaStatus.Failed,
          commands: [],
        },
      ),
    ).rejects.toThrow('database down');
  });

  it('enqueues, reads and marks outbox commands', async () => {
    await repository.enqueue('saga-1', []);
    expect(sagaOutboxMessage.createMany).not.toHaveBeenCalled();

    await repository.enqueue('saga-1', [
      { ...command, messageType: SagaCommandType.StartExecution },
    ]);
    expect(sagaOutboxMessage.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ destination: 'execution' }),
        ]),
      }),
    );

    sagaOutboxMessage.findMany.mockResolvedValue([{ payload: command }]);
    await expect(repository.pendingCommands('corr-1')).resolves.toEqual([
      command,
    ]);
    await repository.markPublished('cmd-1');
    expect(sagaOutboxMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cmd-1' } }),
    );
  });
});
