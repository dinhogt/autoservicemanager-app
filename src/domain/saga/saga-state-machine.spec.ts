import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  type SagaEventEnvelope,
} from '@dinhogt/domain-shared';
import {
  SagaStateMachine,
  initialDiagnosisCommand,
} from './saga-state-machine';
import { SagaStatus, type SagaInstance } from './saga.types';

const machine = new SagaStateMachine();

function saga(status: SagaInstance['status']): SagaInstance {
  return {
    id: 'saga-1',
    ordemServicoId: 'os-1',
    correlationId: 'corr-1',
    status,
    version: 0,
    paymentId: status === SagaStatus.AwaitingExecution ? 'pay-1' : null,
    failureReason: null,
    metadata: {},
  };
}

function event(
  messageType: SagaEventEnvelope['messageType'],
  payload: Record<string, unknown> = {},
): SagaEventEnvelope {
  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    messageId: 'evt-1',
    messageType,
    occurredAt: '2026-09-22T20:00:00.000Z',
    correlationId: 'corr-1',
    aggregateId: 'os-1',
    source: 'test',
    payload,
  };
}

describe('SagaStateMachine', () => {
  it('creates the initial diagnosis command with correlation', () => {
    expect(initialDiagnosisCommand(saga(SagaStatus.AwaitingDiagnosis))).toEqual(
      expect.objectContaining({
        messageType: SagaCommandType.StartDiagnosis,
        correlationId: 'corr-1',
        aggregateId: 'os-1',
      }),
    );
  });

  it('propagates injected failure controls for executable BDD adapters', () => {
    const controlled = {
      ...saga(SagaStatus.AwaitingDiagnosis),
      metadata: {
        diagnosisForceFailure: true,
        diagnosisFailureReason: 'scanner offline',
      },
    };
    expect(initialDiagnosisCommand(controlled).payload).toEqual({
      forceFailure: true,
      reason: 'scanner offline',
    });

    const executionSaga = {
      ...saga(SagaStatus.AwaitingPayment),
      metadata: {
        executionForceFailure: true,
        executionFailureReason: 'engine failed',
      },
    };
    const transition = machine.transition(
      executionSaga,
      event(SagaEventType.PaymentAuthorized, { paymentId: 'pay-2' }),
    );
    expect(transition.commands[0].payload).toEqual(
      expect.objectContaining({
        forceFailure: true,
        reason: 'engine failed',
      }),
    );
  });

  it.each([
    [
      SagaStatus.AwaitingDiagnosis,
      SagaEventType.DiagnosisCompleted,
      {},
      SagaStatus.AwaitingBudgetApproval,
      undefined,
    ],
    [
      SagaStatus.AwaitingDiagnosis,
      SagaEventType.DiagnosisFailed,
      { reason: 'scanner offline' },
      SagaStatus.Failed,
      undefined,
    ],
    [
      SagaStatus.AwaitingBudgetApproval,
      SagaEventType.BudgetRejected,
      {},
      SagaStatus.Cancelled,
      SagaCommandType.CancelExecution,
    ],
    [
      SagaStatus.AwaitingPayment,
      SagaEventType.PaymentFailed,
      {},
      SagaStatus.Cancelled,
      undefined,
    ],
    [
      SagaStatus.AwaitingPayment,
      SagaEventType.PaymentTimedOut,
      { reason: 'timeout' },
      SagaStatus.AwaitingPayment,
      undefined,
    ],
    [
      SagaStatus.AwaitingExecution,
      SagaEventType.ExecutionCompleted,
      {},
      SagaStatus.Completed,
      undefined,
    ],
    [
      SagaStatus.AwaitingRefund,
      SagaEventType.RefundCompleted,
      {},
      SagaStatus.Compensated,
      undefined,
    ],
    [
      SagaStatus.AwaitingRefund,
      SagaEventType.RefundFailed,
      {},
      SagaStatus.Failed,
      undefined,
    ],
  ] as const)(
    'transitions %s on %s',
    (from, eventType, payload, expected, commandType) => {
      const result = machine.transition(saga(from), event(eventType, payload));
      expect(result.status).toBe(expected);
      expect(result.commands[0]?.messageType).toBe(commandType);
    },
  );

  it('requests payment after budget approval', () => {
    const result = machine.transition(
      saga(SagaStatus.AwaitingBudgetApproval),
      event(SagaEventType.BudgetApproved, { amount: 150 }),
    );
    expect(result.commands[0]).toEqual(
      expect.objectContaining({
        messageType: SagaCommandType.AuthorizePayment,
        causationId: 'evt-1',
        payload: { amount: 150 },
      }),
    );
  });

  it('starts execution after payment authorization', () => {
    const result = machine.transition(
      saga(SagaStatus.AwaitingPayment),
      event(SagaEventType.PaymentAuthorized, { paymentId: 'pay-2' }),
    );
    expect(result.paymentId).toBe('pay-2');
    expect(result.commands[0].messageType).toBe(SagaCommandType.StartExecution);
  });

  it('requests refund when execution fails after payment', () => {
    const result = machine.transition(
      saga(SagaStatus.AwaitingExecution),
      event(SagaEventType.ExecutionFailed, { reason: 'engine failed' }),
    );
    expect(result.status).toBe(SagaStatus.AwaitingRefund);
    expect(result.commands[0]).toEqual(
      expect.objectContaining({
        messageType: SagaCommandType.RefundPayment,
        payload: { paymentId: 'pay-1', reason: 'engine failed' },
      }),
    );
  });

  it('rejects out-of-order events and missing payment id', () => {
    expect(() =>
      machine.transition(
        saga(SagaStatus.Completed),
        event(SagaEventType.DiagnosisCompleted),
      ),
    ).toThrow('Invalid saga transition');
    expect(() =>
      machine.transition(
        saga(SagaStatus.AwaitingPayment),
        event(SagaEventType.PaymentAuthorized),
      ),
    ).toThrow('paymentId');
  });
});
