import { PrismaOsAuditRepository } from './prisma-os-audit.repository';
import * as metrics from '../../../observability/business-metrics';

jest.mock('../../../observability/business-metrics', () => ({
  emitOsCriadaMetric: jest.fn(),
  emitOsFaseDuracaoMetric: jest.fn(),
}));

describe('PrismaOsAuditRepository', () => {
  function makeRepo(handlers: Record<string, jest.Mock> = {}) {
    const prisma = {
      ordemServicoStatusHistorico: {
        create: handlers.create ?? jest.fn().mockResolvedValue({}),
        findFirst: handlers.findFirst ?? jest.fn().mockResolvedValue(null),
        findMany: handlers.findMany ?? jest.fn().mockResolvedValue([]),
      },
    };
    return {
      repo: new PrismaOsAuditRepository(prisma as never),
      prisma,
    };
  }

  it('recordOsTransition persiste histórico e emite OsCriada', async () => {
    const { repo, prisma } = makeRepo();
    await repo.recordOsTransition({
      ordemServicoId: 'os-1',
      domainEvent: { eventType: 'OsCriada' },
      fromStatus: null,
      toStatus: 'RECEBIDA',
      context: 'CriarOrdemServico',
    });
    expect(prisma.ordemServicoStatusHistorico.create).toHaveBeenCalled();
    expect(metrics.emitOsCriadaMetric).toHaveBeenCalledWith('os-1');
  });

  it('recordOsTransition emite OsFaseDuracao ao sair de fase', async () => {
    const entered = new Date('2026-01-01T10:00:00.000Z');
    const { repo } = makeRepo({
      findFirst: jest.fn().mockResolvedValue({ enteredAt: entered }),
    });
    await repo.recordOsTransition({
      ordemServicoId: 'os-1',
      domainEvent: { eventType: 'OsEmExecucao' },
      fromStatus: 'EM_DIAGNOSTICO',
      toStatus: 'AGUARDANDO_APROVACAO',
      context: 'GerarOrcamento',
    });
    expect(metrics.emitOsFaseDuracaoMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os-1',
        fromStatus: 'EM_DIAGNOSTICO',
        toStatus: 'AGUARDANDO_APROVACAO',
      }),
    );
  });

  it('listHistorico mapeia linhas MySQL', async () => {
    const { repo } = makeRepo({
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'h1',
          fromStatus: null,
          toStatus: 'RECEBIDA',
          eventType: 'OsCriada',
          context: 'Criar',
          enteredAt: new Date('2026-01-01T10:00:00.000Z'),
        },
      ]),
    });
    await expect(repo.listHistorico('os-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'h1',
        kind: 'status',
        toStatus: 'RECEBIDA',
        eventType: 'OsCriada',
      }),
    ]);
  });
});
