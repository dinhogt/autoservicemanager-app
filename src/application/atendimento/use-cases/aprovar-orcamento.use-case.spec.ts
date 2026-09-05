import { ConflictException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { AprovarOrcamentoUseCase } from './aprovar-orcamento.use-case';

describe('AprovarOrcamentoUseCase', () => {
  const osPublica = {
    id: 'os-1',
    status: StatusOs.AGUARDANDO_APROVACAO,
    cliente: { cpfCnpj: '52998224725', nome: 'Maria', contato: 'a@b.com' },
    veiculo: { placa: 'ABC1D23' },
  };

  const recordDomainEvent = jest.fn().mockResolvedValue(undefined);
  const recordOsTransition = jest.fn().mockResolvedValue(undefined);
  const audit: OsMongoAuditPort = {
    recordDomainEvent,
    recordStatusChange: jest.fn(),
    recordNotification: jest.fn(),
    recordOsTransition,
    listHistorico: jest.fn(),
  };
  const statusNotifier: OsStatusNotifierPort = {
    notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
  };
  const orderStatusService = new OrderStatusService();

  beforeEach(() => jest.clearAllMocks());

  function makeUseCase(ordensOverrides: Record<string, jest.Mock> = {}) {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osPublica),
      ...ordensOverrides,
    });
    return new AprovarOrcamentoUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
  }

  it('Conflict quando status não é AGUARDANDO_APROVACAO', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue({
        ...osPublica,
        status: StatusOs.RECEBIDA,
      }),
    });
    const uc = new AprovarOrcamentoUseCase(
      ordens,
      orderStatusService,
      audit,
      statusNotifier,
    );
    await expect(
      uc.execute('os-1', { cpfCnpj: '52998224725' }, { aprovado: true }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejeição: atualiza para REJEITADA e audita', async () => {
    const rejeitarOrcamento = jest.fn().mockResolvedValue({
      id: 'os-1',
      status: StatusOs.REJEITADA,
      cliente: { nome: 'Maria', contato: 'a@b.com' },
    });
    const uc = makeUseCase({ rejeitarOrcamento });
    const result = await uc.execute(
      'os-1',
      { cpfCnpj: '52998224725' },
      { aprovado: false },
    );
    expect(result.status).toBe(StatusOs.REJEITADA);
    expect(rejeitarOrcamento).toHaveBeenCalledWith('os-1');
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        domainEvent: { eventType: OsDomainEventType.OrcamentoRejeitado },
      }),
    );
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
  });

  it('aprovação: reserva peças, atualiza status e audita', async () => {
    const aprovarOrcamentoComReserva = jest.fn().mockResolvedValue({
      resultado: {
        id: 'os-1',
        status: StatusOs.EM_EXECUCAO,
        cliente: { nome: 'Maria', contato: 'a@b.com' },
      },
      pecasReservadas: [{ pecaEstoqueId: 'p1', quantidade: 2 }],
    });
    const uc = makeUseCase({ aprovarOrcamentoComReserva });
    const result = await uc.execute(
      'os-1',
      { cpfCnpj: '52998224725' },
      { aprovado: true },
    );
    expect(result.status).toBe(StatusOs.EM_EXECUCAO);
    expect(recordDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OsDomainEventType.PecaReservadaNoEstoque,
      }),
    );
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        domainEvent: { eventType: OsDomainEventType.OrcamentoAprovado },
      }),
    );
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
  });
});
