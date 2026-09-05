import { Injectable } from '@nestjs/common';
import {
  HistoricoOsItem,
  OsMongoAuditPort,
  RecordDomainEventInput,
  RecordNotificationInput,
  RecordOsTransitionInput,
  RecordStatusChangeInput,
} from '../../../domain/atendimento/ports';

@Injectable()
export class NoopOsMongoAuditRepository implements OsMongoAuditPort {
  recordDomainEvent(input: RecordDomainEventInput): Promise<void> {
    void input;
    return Promise.resolve();
  }

  recordStatusChange(input: RecordStatusChangeInput): Promise<void> {
    void input;
    return Promise.resolve();
  }

  recordNotification(input: RecordNotificationInput): Promise<void> {
    void input;
    return Promise.resolve();
  }

  recordOsTransition(input: RecordOsTransitionInput): Promise<void> {
    void input;
    return Promise.resolve();
  }

  listHistorico(ordemServicoId: string): Promise<HistoricoOsItem[]> {
    void ordemServicoId;
    return Promise.resolve([]);
  }
}
