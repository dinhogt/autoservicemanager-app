import { OsDomainEventType } from '../events/os-domain-events';
import { StatusOs } from '../value-objects/status-os.enum';

const WEBHOOK_STATUS_TO_EVENT: Partial<
  Record<StatusOs, (typeof OsDomainEventType)[keyof typeof OsDomainEventType]>
> = {
  [StatusOs.EM_DIAGNOSTICO]: OsDomainEventType.OsEmDiagnostico,
  [StatusOs.AGUARDANDO_APROVACAO]: OsDomainEventType.OrcamentoGerado,
  [StatusOs.EM_EXECUCAO]: OsDomainEventType.OrcamentoAprovado,
  [StatusOs.REJEITADA]: OsDomainEventType.OrcamentoRejeitado,
  [StatusOs.FINALIZADA]: OsDomainEventType.OsFinalizada,
  [StatusOs.ENTREGUE]: OsDomainEventType.VeiculoEntregue,
};

export function mapWebhookStatusToDomainEvent(
  status: StatusOs,
): (typeof OsDomainEventType)[keyof typeof OsDomainEventType] {
  return WEBHOOK_STATUS_TO_EVENT[status] ?? OsDomainEventType.OsEmDiagnostico;
}
