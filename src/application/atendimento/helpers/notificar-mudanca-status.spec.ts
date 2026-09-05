import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { notificarMudancaStatus } from './notificar-mudanca-status';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';

describe('notificarMudancaStatus', () => {
  it('registra audit e chama notifier', async () => {
    const audit: OsMongoAuditPort = {
      recordDomainEvent: jest.fn(),
      recordStatusChange: jest.fn(),
      recordNotification: jest.fn().mockResolvedValue(undefined),
      recordOsTransition: jest.fn(),
      listHistorico: jest.fn(),
    };
    const notifier: OsStatusNotifierPort = {
      notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
    };

    await notificarMudancaStatus({
      audit,
      notifier,
      ordemServicoId: 'os-1',
      clienteNome: 'Maria',
      clienteContato: 'maria@test.com',
      fromStatus: StatusOs.RECEBIDA,
      toStatus: StatusOs.EM_DIAGNOSTICO,
      context: 'Teste',
    });

    expect(audit.recordNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        kind: 'OsStatusAlterado',
        channel: 'email',
      }),
    );
    expect(notifier.notificarMudancaStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        clienteNome: 'Maria',
        statusAnterior: StatusOs.RECEBIDA,
        statusNovo: StatusOs.EM_DIAGNOSTICO,
      }),
    );
  });
});
