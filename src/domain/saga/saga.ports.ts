import type { SagaCommandEnvelope } from '@dinhogt/domain-shared';
import type {
  SagaEventInput,
  SagaInstance,
  SagaTransition,
} from './saga.types';

export const SAGA_REPOSITORY = Symbol('SAGA_REPOSITORY');
export const EXECUTION_COMMAND_PORT = Symbol('EXECUTION_COMMAND_PORT');
export const BILLING_COMMAND_PORT = Symbol('BILLING_COMMAND_PORT');
export const SAGA_METRICS_PORT = Symbol('SAGA_METRICS_PORT');

export interface SagaMetricsPort {
  journey(input: {
    event: string;
    metric: string;
    unit?: 'Count' | 'Milliseconds';
    value: number;
    operation: string;
    outcome: string;
    correlationId: string;
    sagaId: string;
    messageId: string;
    aggregateId: string;
    durationMs?: number;
    service?: string;
  }): void;
}

export interface SagaRepository {
  create(input: {
    ordemServicoId: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }): Promise<SagaInstance>;
  findByCorrelationId(correlationId: string): Promise<SagaInstance | null>;
  findByOrdemServicoId(ordemServicoId: string): Promise<SagaInstance | null>;
  hasProcessed(eventId: string): Promise<boolean>;
  applyEvent(
    saga: SagaInstance,
    event: SagaEventInput,
    transition: SagaTransition,
  ): Promise<'applied' | 'duplicate' | 'conflict'>;
  enqueue(sagaId: string, commands: SagaCommandEnvelope[]): Promise<void>;
  pendingCommands(correlationId: string): Promise<SagaCommandEnvelope[]>;
  markPublished(messageId: string): Promise<void>;
}

export interface CommandPublisherPort {
  publish(command: SagaCommandEnvelope): Promise<void>;
}
