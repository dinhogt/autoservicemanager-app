/** Nest injection token for OS audit / Mongo sidecar. */
export const OS_MONGO_AUDIT = Symbol('OS_MONGO_AUDIT');

export interface RecordDomainEventInput {
  ordemServicoId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}

export interface RecordStatusChangeInput {
  ordemServicoId: string;
  fromStatus: string | null;
  toStatus: string;
  /** Short human-readable context (e.g. use case name). */
  context?: string;
}

export interface RecordNotificationInput {
  ordemServicoId: string;
  kind: string;
  message: string;
  channel?: 'email' | 'sms' | 'internal';
}

/**
 * Agrupa evento de domínio + mudança de status (+ intenção de notificação opcional).
 * O evento de domínio é o fato de negócio; `notificationIntent` é só registro de
 * intenção de contato (MVP audit-only), podendo reusar os mesmos nomes dos
 * eventos de domínio sem gravar segunda linha em `os_event_logs`.
 */
export interface RecordOsTransitionInput {
  ordemServicoId: string;
  domainEvent: {
    eventType: string;
    payload?: Record<string, unknown>;
  };
  fromStatus: string | null;
  toStatus: string;
  context: string;
  notificationIntent?: Omit<RecordNotificationInput, 'ordemServicoId'>;
}

export interface HistoricoOsItem {
  id: string;
  kind: 'domain_event' | 'status' | 'notification';
  at: string;
  eventType?: string;
  payload?: Record<string, unknown>;
  fromStatus?: string | null;
  toStatus?: string;
  /** Status change note (e.g. use case). */
  context?: string;
  notificationKind?: string;
  message?: string;
  channel?: string;
}

export interface OsMongoAuditPort {
  recordDomainEvent(input: RecordDomainEventInput): Promise<void>;
  recordStatusChange(input: RecordStatusChangeInput): Promise<void>;
  recordNotification(input: RecordNotificationInput): Promise<void>;
  recordOsTransition(input: RecordOsTransitionInput): Promise<void>;
  listHistorico(ordemServicoId: string): Promise<HistoricoOsItem[]>;
}
