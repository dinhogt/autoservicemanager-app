import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { ProcessarWebhookStatusOsUseCase } from './processar-webhook-status-os.use-case';

describe('ProcessarWebhookStatusOsUseCase', () => {
  const audit: OsMongoAuditPort = {
    recordDomainEvent: jest.fn(),
    recordOsTransition: jest.fn().mockResolvedValue(undefined),
    recordStatusChange: jest.fn(),
    recordNotification: jest.fn().mockResolvedValue(undefined),
    listHistorico: jest.fn(),
  };
  const statusNotifier: OsStatusNotifierPort = {
    notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
  };
  const orderStatusService = new OrderStatusService();

  beforeEach(() => jest.clearAllMocks());

  const osBase = {
    id: 'os-1',
    status: StatusOs.RECEBIDA,
    cliente: { nome: 'Maria', contato: 'maria@test.com' },
    veiculo: { placa: 'ABC1D23' },
  };

  it('404 quando OS não existe', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(null),
    });
    const uc = new ProcessarWebhookStatusOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    await expect(
      uc.execute('x', { status: StatusOs.EM_DIAGNOSTICO }),
    ).rejects.toThrow(NotFoundException);
  });

  it('409 para transição inválida', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osBase),
    });
    const uc = new ProcessarWebhookStatusOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    await expect(
      uc.execute('os-1', { status: StatusOs.ENTREGUE }),
    ).rejects.toThrow(ConflictException);
  });

  it('atualiza status via webhook quando transição é válida', async () => {
    const updateStatus = jest.fn().mockResolvedValue({
      ...osBase,
      status: StatusOs.EM_DIAGNOSTICO,
    });
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest
        .fn()
        .mockResolvedValueOnce(osBase)
        .mockResolvedValueOnce({
          ...osBase,
          status: StatusOs.EM_DIAGNOSTICO,
        }),
      updateStatus,
    });
    const uc = new ProcessarWebhookStatusOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    const result = await uc.execute('os-1', {
      status: StatusOs.EM_DIAGNOSTICO,
    });
    expect(result.status).toBe(StatusOs.EM_DIAGNOSTICO);
    expect(updateStatus).toHaveBeenCalled();
    expect(audit.recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        domainEvent: expect.objectContaining({
          eventType: OsDomainEventType.OsEmDiagnostico,
        }),
      }),
    );
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
  });
});
