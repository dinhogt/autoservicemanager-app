import type {
  SagaCommandEnvelope,
  SagaEventEnvelope,
} from '@dinhogt/domain-shared';

export const SagaStatus = {
  AwaitingDiagnosis: 'AWAITING_DIAGNOSIS',
  AwaitingBudgetApproval: 'AWAITING_BUDGET_APPROVAL',
  AwaitingPayment: 'AWAITING_PAYMENT',
  AwaitingExecution: 'AWAITING_EXECUTION',
  AwaitingRefund: 'AWAITING_REFUND',
  Completed: 'COMPLETED',
  Compensated: 'COMPENSATED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const;

export type SagaStatusName = (typeof SagaStatus)[keyof typeof SagaStatus];

export interface SagaInstance {
  id: string;
  ordemServicoId: string;
  correlationId: string;
  status: SagaStatusName;
  version: number;
  paymentId: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
  createdAt?: Date;
}

export interface SagaTransition {
  status: SagaStatusName;
  paymentId?: string;
  failureReason?: string;
  commands: SagaCommandEnvelope[];
}

export interface SagaEventInput {
  envelope: SagaEventEnvelope;
  rawMessage?: unknown;
}
