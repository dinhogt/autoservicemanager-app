import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { FinalizarOsUseCase } from './finalizar-os.use-case';

describe('FinalizarOsUseCase', () => {
  const recordOsTransition = jest.fn().mockResolvedValue(undefined);
  const audit: OsMongoAuditPort = {
    recordDomainEvent: jest.fn(),
    recordOsTransition,
    recordStatusChange: jest.fn().mockResolvedValue(undefined),
    recordNotification: jest.fn(),
    listHistorico: jest.fn(),
  };
  const statusNotifier: OsStatusNotifierPort = {
    notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
  };
  const orderStatusService = new OrderStatusService();

  beforeEach(() => jest.clearAllMocks());

  it('404 quando OS não existe', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(null),
    });
    const uc = new FinalizarOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    await expect(uc.execute('x')).rejects.toThrow(NotFoundException);
  });

  it('Conflict quando não está EM_EXECUCAO', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue({
        id: 'os-1',
        status: StatusOs.RECEBIDA,
        cliente: { nome: 'Maria', contato: 'a@b.com' },
      }),
    });
    const uc = new FinalizarOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    await expect(uc.execute('os-1')).rejects.toThrow(ConflictException);
  });

  it('finaliza OS e audita', async () => {
    const finalizar = jest.fn().mockResolvedValue(undefined);
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue({
        id: 'os-1',
        status: StatusOs.EM_EXECUCAO,
        cliente: { nome: 'Maria', contato: 'a@b.com' },
      }),
      finalizar,
    });
    const uc = new FinalizarOsUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    const result = await uc.execute('os-1');
    expect(finalizar).toHaveBeenCalledWith('os-1');
    expect(result.status).toBe(StatusOs.FINALIZADA);
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        domainEvent: expect.objectContaining({
          eventType: OsDomainEventType.OsFinalizada,
        }),
      }),
    );
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
  });
});
