import { OsDomainEventType } from '../events/os-domain-events';
import { StatusOs } from '../value-objects/status-os.enum';
import { mapWebhookStatusToDomainEvent } from './webhook-status-event.mapper';

describe('mapWebhookStatusToDomainEvent', () => {
  it.each([
    [StatusOs.EM_DIAGNOSTICO, OsDomainEventType.OsEmDiagnostico],
    [StatusOs.AGUARDANDO_APROVACAO, OsDomainEventType.OrcamentoGerado],
    [StatusOs.EM_EXECUCAO, OsDomainEventType.OrcamentoAprovado],
    [StatusOs.REJEITADA, OsDomainEventType.OrcamentoRejeitado],
    [StatusOs.FINALIZADA, OsDomainEventType.OsFinalizada],
    [StatusOs.ENTREGUE, OsDomainEventType.VeiculoEntregue],
  ])('mapeia %s para %s', (status, expected) => {
    expect(mapWebhookStatusToDomainEvent(status)).toBe(expected);
  });
});
