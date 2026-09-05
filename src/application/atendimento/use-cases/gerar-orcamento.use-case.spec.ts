import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type {
  OrcamentoNotifierPort,
  OsMongoAuditPort,
} from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { GerarOrcamentoUseCase } from './gerar-orcamento.use-case';

describe('GerarOrcamentoUseCase', () => {
  const recordOsTransition = jest.fn().mockResolvedValue(undefined);
  const audit: OsMongoAuditPort = {
    recordDomainEvent: jest.fn(),
    recordStatusChange: jest.fn(),
    recordNotification: jest.fn(),
    recordOsTransition,
    listHistorico: jest.fn(),
  };
  const enviarOrcamento = jest.fn().mockResolvedValue(undefined);
  const notifier: OrcamentoNotifierPort = { enviar: enviarOrcamento };
  const statusNotifier: OsStatusNotifierPort = {
    notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
  };
  const orderStatusService = new OrderStatusService();

  const osComItens = {
    id: 'os-1',
    status: StatusOs.RECEBIDA,
    itensServico: [
      {
        quantidade: 2,
        servicoCatalogo: { precoBase: new Prisma.Decimal(50) },
      },
    ],
    itensPeca: [
      {
        quantidade: 1,
        pecaEstoque: { precoUnitario: new Prisma.Decimal(30) },
      },
    ],
    cliente: { id: 'c1', nome: 'Maria', contato: 'maria@example.com' },
    veiculo: { id: 'v1' },
  };

  const atualizada = {
    ...osComItens,
    status: StatusOs.AGUARDANDO_APROVACAO,
  };

  beforeEach(() => jest.clearAllMocks());

  it('404 quando OS não existe', async () => {
    const ordens = mockOrdemServicoRepository({
      findForGerarOrcamento: jest.fn().mockResolvedValue(null),
    });
    const uc = new GerarOrcamentoUseCase(
      ordens,
      orderStatusService,
      audit,
      notifier,
      statusNotifier,
    );
    await expect(uc.execute('missing')).rejects.toThrow(NotFoundException);
  });

  it('409 quando status não permite gerar orçamento', async () => {
    const ordens = mockOrdemServicoRepository({
      findForGerarOrcamento: jest.fn().mockResolvedValue({
        ...osComItens,
        status: StatusOs.ENTREGUE,
      }),
    });
    const uc = new GerarOrcamentoUseCase(
      ordens,
      orderStatusService,
      audit,
      notifier,
      statusNotifier,
    );
    await expect(uc.execute('os-1')).rejects.toThrow(ConflictException);
  });

  it('calcula total, atualiza status, audita e dispara notificação', async () => {
    const gerarOrcamento = jest.fn().mockResolvedValue(atualizada);
    const ordens = mockOrdemServicoRepository({
      findForGerarOrcamento: jest.fn().mockResolvedValue(osComItens),
      gerarOrcamento,
    });
    const uc = new GerarOrcamentoUseCase(
      ordens,
      orderStatusService,
      audit,
      notifier,
      statusNotifier,
    );
    const result = await uc.execute('os-1');
    expect(gerarOrcamento).toHaveBeenCalledWith('os-1', 130);
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        domainEvent: expect.objectContaining({
          eventType: OsDomainEventType.OrcamentoGerado,
        }),
      }),
    );
    expect(enviarOrcamento).toHaveBeenCalled();
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
    expect(result.status).toBe(StatusOs.AGUARDANDO_APROVACAO);
  });
});
