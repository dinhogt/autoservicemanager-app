export const MESSAGE_SCHEMA_VERSION = '1.0' as const;

export const SagaEventType = {
  DiagnosisCompleted: 'diagnosis.completed',
  DiagnosisFailed: 'diagnosis.failed',
  BudgetApproved: 'budget.approved',
  BudgetRejected: 'budget.rejected',
  PaymentAuthorized: 'payment.authorized',
  PaymentFailed: 'payment.failed',
  PaymentTimedOut: 'payment.timed-out',
  ExecutionCompleted: 'execution.completed',
  ExecutionFailed: 'execution.failed',
  RefundCompleted: 'refund.completed',
  RefundFailed: 'refund.failed',
} as const;

export type SagaEventTypeName =
  (typeof SagaEventType)[keyof typeof SagaEventType];

export const SagaCommandType = {
  StartDiagnosis: 'diagnosis.start',
  StartExecution: 'execution.start',
  CancelExecution: 'execution.cancel',
  AuthorizePayment: 'payment.authorize',
  RefundPayment: 'payment.refund',
} as const;

export type SagaCommandTypeName =
  (typeof SagaCommandType)[keyof typeof SagaCommandType];

export interface MessageEnvelope<TType extends string, TPayload> {
  schemaVersion: typeof MESSAGE_SCHEMA_VERSION;
  messageId: string;
  messageType: TType;
  occurredAt: string;
  correlationId: string;
  sagaId?: string;
  aggregateId: string;
  causationId?: string;
  source: string;
  payload: TPayload;
}

export type SagaEventEnvelope<TPayload = Record<string, unknown>> =
  MessageEnvelope<SagaEventTypeName, TPayload>;

export type SagaCommandEnvelope<TPayload = Record<string, unknown>> =
  MessageEnvelope<SagaCommandTypeName, TPayload>;

const eventTypes = new Set<string>(Object.values(SagaEventType));
const commandTypes = new Set<string>(Object.values(SagaCommandType));

export function parseSagaEventEnvelope(input: unknown): SagaEventEnvelope {
  const envelope = parseEnvelope(input);
  if (!eventTypes.has(envelope.messageType)) {
    throw new Error(`Unsupported saga event type: ${envelope.messageType}`);
  }
  return envelope as SagaEventEnvelope;
}

export function parseSagaCommandEnvelope(input: unknown): SagaCommandEnvelope {
  const envelope = parseEnvelope(input);
  if (!commandTypes.has(envelope.messageType)) {
    throw new Error(`Unsupported saga command type: ${envelope.messageType}`);
  }
  return envelope as SagaCommandEnvelope;
}

function parseEnvelope(
  input: unknown,
): MessageEnvelope<string, Record<string, unknown>> {
  if (!isRecord(input)) {
    throw new Error('Message envelope must be an object');
  }
  requireString(input, 'messageId');
  requireString(input, 'messageType');
  requireString(input, 'occurredAt');
  requireString(input, 'correlationId');
  requireString(input, 'aggregateId');
  requireString(input, 'source');
  if (input.schemaVersion !== MESSAGE_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version: ${String(input.schemaVersion)}`,
    );
  }
  if (Number.isNaN(Date.parse(input.occurredAt as string))) {
    throw new Error('occurredAt must be an ISO-8601 date');
  }
  if (!isRecord(input.payload)) {
    throw new Error('payload must be an object');
  }
  return input as unknown as MessageEnvelope<string, Record<string, unknown>>;
}

function requireString(value: Record<string, unknown>, field: string): void {
  if (typeof value[field] !== 'string' || value[field].length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
