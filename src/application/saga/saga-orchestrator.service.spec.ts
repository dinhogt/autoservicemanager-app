import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  type SagaCommandEnvelope,
} from '@dinhogt/domain-shared';
import type {
  CommandPublisherPort,
  SagaRepository,
} from '../../domain/saga/saga.ports';
import { SagaStateMachine } from '../../domain/saga/saga-state-machine';
import { SagaStatus, type SagaInstance } from '../../domain/saga/saga.types';
import {
  SagaOrchestratorService,
  unwrapAwsMessage,
} from './saga-orchestrator.service';

const saga: SagaInstance = {
  id: 'saga-1',
  ordemServicoId: 'os-1',
  correlationId: 'corr-1',
  status: SagaStatus.AwaitingDiagnosis,
  version: 0,
  paymentId: null,
  failureReason: null,
  metadata: {},
};

const diagnosisEvent = {
  schemaVersion: MESSAGE_SCHEMA_VERSION,
  messageId: 'evt-1',
  messageType: SagaEventType.DiagnosisCompleted,
  occurredAt: '2026-09-22T20:00:00.000Z',
  correlationId: 'corr-1',
  aggregateId: 'os-1',
  source: 'execution',
  payload: {},
};

describe('SagaOrchestratorService', () => {
  let repository: jest.Mocked<SagaRepository>;
  let execution: jest.Mocked<CommandPublisherPort>;
  let billing: jest.Mocked<CommandPublisherPort>;
  let service: SagaOrchestratorService;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(saga),
      findByCorrelationId: jest.fn().mockResolvedValue(saga),
      findByOrdemServicoId: jest.fn().mockResolvedValue(saga),
      hasProcessed: jest.fn().mockResolvedValue(false),
      applyEvent: jest.fn().mockResolvedValue('applied'),
      enqueue: jest.fn().mockResolvedValue(undefined),
      pendingCommands: jest.fn().mockResolvedValue([]),
      markPublished: jest.fn().mockResolvedValue(undefined),
    };
    execution = { publish: jest.fn().mockResolvedValue(undefined) };
    billing = { publish: jest.fn().mockResolvedValue(undefined) };
    service = new SagaOrchestratorService(
      repository,
      execution,
      billing,
      new SagaStateMachine(),
    );
  });

  it('starts a correlated saga and dispatches diagnosis', async () => {
    const command = { messageType: SagaCommandType.StartDiagnosis };
    repository.pendingCommands.mockResolvedValue([
      command as SagaCommandEnvelope,
    ]);

    await expect(
      service.start({ ordemServicoId: 'os-1', correlationId: 'corr-1' }),
    ).resolves.toBe(saga);

    expect(repository.enqueue).toHaveBeenCalledWith(
      'saga-1',
      expect.arrayContaining([
        expect.objectContaining({ correlationId: 'corr-1' }),
      ]),
    );
    expect(execution.publish).toHaveBeenCalled();
    expect(repository.markPublished).toHaveBeenCalled();
  });

  it('generates a correlation id when one is omitted', async () => {
    await service.start({ ordemServicoId: 'os-1' });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        correlationId: expect.any(String),
      }),
    );
  });

  it('applies an event from an SNS-over-SQS body', async () => {
    const wrapped = {
      body: JSON.stringify({ Message: JSON.stringify(diagnosisEvent) }),
    };
    await expect(service.consume(wrapped)).resolves.toEqual({
      outcome: 'applied',
      correlationId: 'corr-1',
    });
    expect(repository.applyEvent).toHaveBeenCalled();
  });

  it('acknowledges duplicate events and retries pending outbox', async () => {
    repository.hasProcessed.mockResolvedValue(true);
    const billingCommand = {
      ...diagnosisEvent,
      messageId: 'cmd-1',
      messageType: SagaCommandType.RefundPayment,
    } as SagaCommandEnvelope;
    repository.pendingCommands.mockResolvedValue([billingCommand]);

    await expect(service.consume(diagnosisEvent)).resolves.toEqual({
      outcome: 'duplicate',
      correlationId: 'corr-1',
    });
    expect(billing.publish).toHaveBeenCalledWith(billingCommand);
    expect(repository.applyEvent).not.toHaveBeenCalled();
  });

  it('rejects unknown correlation and aggregate mismatch', async () => {
    repository.findByCorrelationId.mockResolvedValueOnce(null);
    await expect(service.consume(diagnosisEvent)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    repository.findByCorrelationId.mockResolvedValueOnce({
      ...saga,
      ordemServicoId: 'other',
    });
    await expect(service.consume(diagnosisEvent)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('turns optimistic concurrency conflicts into retryable conflicts', async () => {
    repository.applyEvent.mockResolvedValue('conflict');
    await expect(service.consume(diagnosisEvent)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('records budget decisions and finds saga status', async () => {
    repository.findByCorrelationId.mockResolvedValue({
      ...saga,
      status: SagaStatus.AwaitingBudgetApproval,
    });
    repository.findByOrdemServicoId.mockResolvedValue({
      ...saga,
      status: SagaStatus.AwaitingBudgetApproval,
    });
    await service.budgetDecision({
      ordemServicoId: 'os-1',
      approved: true,
      amount: 100,
    });
    expect(repository.applyEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        envelope: expect.objectContaining({
          messageType: SagaEventType.BudgetApproved,
        }),
      }),
      expect.anything(),
    );
    await expect(service.findByCorrelationId('corr-1')).resolves.toBeDefined();
  });

  it('rejects missing sagas for decisions and lookup', async () => {
    repository.findByOrdemServicoId.mockResolvedValue(null);
    await expect(
      service.budgetDecision({ ordemServicoId: 'missing', approved: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
    repository.findByCorrelationId.mockResolvedValue(null);
    await expect(service.findByCorrelationId('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('unwrapAwsMessage', () => {
  it('unwraps JSON, SQS and SNS payloads up to three layers', () => {
    expect(
      unwrapAwsMessage({
        body: JSON.stringify({ Message: JSON.stringify(diagnosisEvent) }),
      }),
    ).toEqual(diagnosisEvent);
  });

  it('keeps an already decoded envelope unchanged', () => {
    expect(unwrapAwsMessage(diagnosisEvent)).toBe(diagnosisEvent);
  });
});
