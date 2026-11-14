import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  parseSagaEventEnvelope,
  type SagaCommandEnvelope,
  type SagaEventEnvelope,
} from '@dinhogt/domain-shared';
import { randomUUID } from 'crypto';
import {
  BILLING_COMMAND_PORT,
  EXECUTION_COMMAND_PORT,
  SAGA_REPOSITORY,
  type CommandPublisherPort,
  type SagaRepository,
} from '../../domain/saga/saga.ports';
import {
  SagaStateMachine,
  initialDiagnosisCommand,
} from '../../domain/saga/saga-state-machine';
import { emitJourneyMetric } from '../../infrastructure/observability/business-metrics';

@Injectable()
export class SagaOrchestratorService {
  constructor(
    @Inject(SAGA_REPOSITORY) private readonly repository: SagaRepository,
    @Inject(EXECUTION_COMMAND_PORT)
    private readonly execution: CommandPublisherPort,
    @Inject(BILLING_COMMAND_PORT)
    private readonly billing: CommandPublisherPort,
    private readonly stateMachine: SagaStateMachine,
  ) {}

  async start(input: {
    ordemServicoId: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const correlationId = input.correlationId ?? randomUUID();
    const saga = await this.repository.create({
      ...input,
      correlationId,
    });
    await this.repository.enqueue(saga.id, [initialDiagnosisCommand(saga)]);
    await this.dispatchPending(correlationId);
    emitJourneyMetric({
      event: 'saga_started',
      metric: 'SagaStarted',
      value: 1,
      operation: 'start',
      outcome: 'started',
      correlationId,
      sagaId: saga.id,
      messageId: saga.id,
      aggregateId: saga.ordemServicoId,
    });
    return saga;
  }

  async consume(rawMessage: unknown): Promise<{
    outcome: 'applied' | 'duplicate';
    correlationId: string;
  }> {
    const envelope = parseSagaEventEnvelope(unwrapAwsMessage(rawMessage));
    const startedAt = Date.now();
    const saga = await this.repository.findByCorrelationId(
      envelope.correlationId,
    );
    if (!saga || saga.ordemServicoId !== envelope.aggregateId) {
      throw new NotFoundException('Saga not found for event correlation');
    }
    if (await this.repository.hasProcessed(envelope.messageId)) {
      await this.dispatchPending(envelope.correlationId);
      this.emitStep(saga, envelope, 'duplicate', startedAt);
      return { outcome: 'duplicate', correlationId: envelope.correlationId };
    }
    const transition = this.stateMachine.transition(saga, envelope);
    const outcome = await this.repository.applyEvent(
      saga,
      { envelope, rawMessage },
      transition,
    );
    if (outcome === 'conflict') {
      throw new ConflictException('Concurrent saga transition');
    }
    await this.dispatchPending(envelope.correlationId);
    this.emitStep(
      { ...saga, status: transition.status },
      envelope,
      outcome,
      startedAt,
    );
    return {
      outcome,
      correlationId: envelope.correlationId,
    };
  }

  async budgetDecision(input: {
    ordemServicoId: string;
    approved: boolean;
    amount?: number;
  }) {
    const saga = await this.repository.findByOrdemServicoId(
      input.ordemServicoId,
    );
    if (!saga) throw new NotFoundException('Saga not found for order');
    return this.consume({
      schemaVersion: MESSAGE_SCHEMA_VERSION,
      messageId: randomUUID(),
      messageType: input.approved
        ? SagaEventType.BudgetApproved
        : SagaEventType.BudgetRejected,
      occurredAt: new Date().toISOString(),
      correlationId: saga.correlationId,
      aggregateId: saga.ordemServicoId,
      source: 'autoservicemanager-app',
      payload: input.approved ? { amount: input.amount } : {},
    });
  }

  async findByCorrelationId(correlationId: string) {
    const saga = await this.repository.findByCorrelationId(correlationId);
    if (!saga) throw new NotFoundException('Saga not found');
    return saga;
  }

  private async dispatchPending(correlationId: string): Promise<void> {
    const commands = await this.repository.pendingCommands(correlationId);
    for (const command of commands) {
      await this.publisher(command).publish(command);
      await this.repository.markPublished(command.messageId);
    }
  }

  private publisher(command: SagaCommandEnvelope): CommandPublisherPort {
    return command.messageType === SagaCommandType.AuthorizePayment ||
      command.messageType === SagaCommandType.RefundPayment
      ? this.billing
      : this.execution;
  }

  private emitStep(
    saga: {
      id: string;
      ordemServicoId: string;
      status: string;
      createdAt?: Date;
    },
    envelope: SagaEventEnvelope,
    outcome: string,
    startedAt: number,
  ): void {
    const durationMs = Date.now() - startedAt;
    emitJourneyMetric({
      event: 'saga_step_processed',
      metric: 'SagaStepDuration',
      unit: 'Milliseconds',
      value: durationMs,
      operation: envelope.messageType,
      outcome,
      correlationId: envelope.correlationId,
      sagaId: saga.id,
      messageId: envelope.messageId,
      aggregateId: saga.ordemServicoId,
      durationMs,
    });
    if (saga.createdAt) {
      const sagaDurationMs = Math.max(0, Date.now() - saga.createdAt.getTime());
      emitJourneyMetric({
        event: 'saga_duration_observed',
        metric: 'SagaDuration',
        unit: 'Milliseconds',
        value: sagaDurationMs,
        operation: envelope.messageType,
        outcome,
        correlationId: envelope.correlationId,
        sagaId: saga.id,
        messageId: envelope.messageId,
        aggregateId: saga.ordemServicoId,
        durationMs: sagaDurationMs,
      });
    }
    if (
      ['COMPLETED', 'COMPENSATED', 'FAILED', 'CANCELLED'].includes(saga.status)
    ) {
      emitJourneyMetric({
        event: 'saga_finished',
        metric: 'SagaOutcome',
        value: 1,
        operation: 'finish',
        outcome: saga.status.toLowerCase(),
        correlationId: envelope.correlationId,
        sagaId: saga.id,
        messageId: envelope.messageId,
        aggregateId: saga.ordemServicoId,
        durationMs,
      });
    }
  }
}

export function unwrapAwsMessage(raw: unknown): unknown {
  let current = raw;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === 'string') {
      current = JSON.parse(current) as unknown;
      continue;
    }
    if (isRecord(current) && typeof current.Message === 'string') {
      current = current.Message;
      continue;
    }
    if (isRecord(current) && typeof current.body === 'string') {
      current = current.body;
      continue;
    }
    break;
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
