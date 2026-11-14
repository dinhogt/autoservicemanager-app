import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  type SagaCommandEnvelope,
  type SagaEventEnvelope,
} from '@dinhogt/domain-shared';
import { randomUUID } from 'crypto';
import {
  SagaStatus,
  type SagaInstance,
  type SagaTransition,
} from './saga.types';

export class SagaStateMachine {
  transition(saga: SagaInstance, event: SagaEventEnvelope): SagaTransition {
    switch (event.messageType) {
      case SagaEventType.DiagnosisCompleted:
        return this.fromDiagnosis(saga, event);
      case SagaEventType.DiagnosisFailed:
        return this.expect(saga, SagaStatus.AwaitingDiagnosis, {
          status: SagaStatus.Failed,
          failureReason: reason(event, 'diagnosis failed'),
          commands: [],
        });
      case SagaEventType.BudgetApproved:
        return this.expect(saga, SagaStatus.AwaitingBudgetApproval, {
          status: SagaStatus.AwaitingPayment,
          commands: [
            command(saga, event, SagaCommandType.AuthorizePayment, {
              amount: event.payload.amount,
              customerEmail: saga.metadata.customerEmail,
              description: saga.metadata.description,
            }),
          ],
        });
      case SagaEventType.BudgetRejected:
        return this.expect(saga, SagaStatus.AwaitingBudgetApproval, {
          status: SagaStatus.Cancelled,
          failureReason: reason(event, 'budget rejected'),
          commands: [
            command(saga, event, SagaCommandType.CancelExecution, {
              reason: reason(event, 'budget rejected'),
            }),
          ],
        });
      case SagaEventType.PaymentAuthorized:
        return this.expect(saga, SagaStatus.AwaitingPayment, {
          status: SagaStatus.AwaitingExecution,
          paymentId: stringPayload(event, 'paymentId'),
          commands: [
            command(saga, event, SagaCommandType.StartExecution, {
              paymentId: event.payload.paymentId,
              ...(saga.metadata.executionForceFailure
                ? {
                    forceFailure: true,
                    reason: saga.metadata.executionFailureReason,
                  }
                : {}),
            }),
          ],
        });
      case SagaEventType.PaymentFailed:
        return this.expect(saga, SagaStatus.AwaitingPayment, {
          status: SagaStatus.Cancelled,
          failureReason: reason(event, event.messageType),
          commands: [],
        });
      case SagaEventType.PaymentTimedOut:
        return this.expect(saga, SagaStatus.AwaitingPayment, {
          status: SagaStatus.AwaitingPayment,
          failureReason: reason(event, event.messageType),
          commands: [],
        });
      case SagaEventType.ExecutionCompleted:
        return this.expect(saga, SagaStatus.AwaitingExecution, {
          status: SagaStatus.Completed,
          commands: [],
        });
      case SagaEventType.ExecutionFailed:
        return this.expect(saga, SagaStatus.AwaitingExecution, {
          status: SagaStatus.AwaitingRefund,
          failureReason: reason(event, 'execution failed'),
          commands: [
            command(saga, event, SagaCommandType.RefundPayment, {
              paymentId: saga.paymentId,
              reason: reason(event, 'execution failed'),
            }),
          ],
        });
      case SagaEventType.RefundCompleted:
        return this.expect(saga, SagaStatus.AwaitingRefund, {
          status: SagaStatus.Compensated,
          commands: [],
        });
      case SagaEventType.RefundFailed:
        return this.expect(saga, SagaStatus.AwaitingRefund, {
          status: SagaStatus.Failed,
          failureReason: reason(event, 'refund failed'),
          commands: [],
        });
    }
  }

  private fromDiagnosis(
    saga: SagaInstance,
    _event: SagaEventEnvelope,
  ): SagaTransition {
    return this.expect(saga, SagaStatus.AwaitingDiagnosis, {
      status: SagaStatus.AwaitingBudgetApproval,
      commands: [],
    });
  }

  private expect(
    saga: SagaInstance,
    expected: string,
    transition: SagaTransition,
  ): SagaTransition {
    if (saga.status !== expected) {
      throw new Error(
        `Invalid saga transition from ${saga.status}; expected ${expected}`,
      );
    }
    return transition;
  }
}

export function initialDiagnosisCommand(
  saga: Pick<
    SagaInstance,
    'id' | 'ordemServicoId' | 'correlationId' | 'metadata'
  >,
): SagaCommandEnvelope {
  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    messageId: randomUUID(),
    messageType: SagaCommandType.StartDiagnosis,
    occurredAt: new Date().toISOString(),
    correlationId: saga.correlationId,
    sagaId: saga.id,
    aggregateId: saga.ordemServicoId,
    source: 'autoservicemanager-app',
    payload: {
      ...(saga.metadata.diagnosisForceFailure
        ? {
            forceFailure: true,
            reason: saga.metadata.diagnosisFailureReason,
          }
        : {}),
    },
  };
}

function command(
  saga: SagaInstance,
  event: SagaEventEnvelope,
  messageType: SagaCommandEnvelope['messageType'],
  payload: Record<string, unknown>,
): SagaCommandEnvelope {
  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    messageId: randomUUID(),
    messageType,
    occurredAt: new Date().toISOString(),
    correlationId: saga.correlationId,
    sagaId: saga.id,
    aggregateId: saga.ordemServicoId,
    causationId: event.messageId,
    source: 'autoservicemanager-app',
    payload,
  };
}

function reason(event: SagaEventEnvelope, fallback: string): string {
  return typeof event.payload.reason === 'string'
    ? event.payload.reason
    : fallback;
}

function stringPayload(event: SagaEventEnvelope, key: string): string {
  const value = event.payload[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}
