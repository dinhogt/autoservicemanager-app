import { StatusOs } from '../../../../domain/atendimento/value-objects/status-os.enum';
import { statusOsToPrisma } from '../mappers/status-os.mapper';
import { PrismaService } from '../prisma.service';
import { PrismaOrdemServicoReadAdapter } from './prisma-ordem-servico-read.adapter';

describe('PrismaOrdemServicoReadAdapter', () => {
  function makeAdapter(handlers: Record<string, jest.Mock>) {
    const emptyFases = jest.fn().mockResolvedValue([]);
    const prisma = {
      ordemServico: {
        findUnique: handlers.findUnique ?? jest.fn(),
        count: handlers.count ?? jest.fn(),
        findMany: handlers.findMany ?? jest.fn(),
      },
      itemServicoOs: {
        count: handlers.itemServicoCount ?? jest.fn(),
      },
      itemPecaOs: {
        count: handlers.itemPecaCount ?? jest.fn(),
      },
      ordemServicoStatusHistorico: {
        findMany: handlers.historicoFindMany ?? emptyFases,
        findFirst: handlers.historicoFindFirst ?? jest.fn(),
      },
    } as unknown as PrismaService;
    return { adapter: new PrismaOrdemServicoReadAdapter(prisma), prisma };
  }

  it('existsById retorna true quando OS existe', async () => {
    const { adapter, prisma } = makeAdapter({
      findUnique: jest.fn().mockResolvedValue({ id: 'os-1' }),
    });
    await expect(adapter.existsById('os-1')).resolves.toBe(true);
    expect(prisma.ordemServico.findUnique).toHaveBeenCalledWith({
      where: { id: 'os-1' },
      select: { id: true },
    });
  });

  it('existsById retorna false quando OS não existe', async () => {
    const { adapter } = makeAdapter({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    await expect(adapter.existsById('x')).resolves.toBe(false);
  });

  it('countAtivasByClienteId filtra status não terminais', async () => {
    const count = jest.fn().mockResolvedValue(2);
    const { adapter } = makeAdapter({ count });
    await expect(adapter.countAtivasByClienteId('c1')).resolves.toBe(2);
    expect(count).toHaveBeenCalledWith({
      where: {
        clienteId: 'c1',
        status: {
          in: expect.arrayContaining([statusOsToPrisma(StatusOs.RECEBIDA)]),
        },
      },
    });
  });

  it('countAtivasByVeiculoId filtra por veículo', async () => {
    const count = jest.fn().mockResolvedValue(1);
    const { adapter } = makeAdapter({ count });
    await expect(adapter.countAtivasByVeiculoId('v1')).resolves.toBe(1);
    expect(count).toHaveBeenCalledWith({
      where: expect.objectContaining({ veiculoId: 'v1' }),
    });
  });

  it('countAtivasUsandoServico consulta itens de serviço ativos', async () => {
    const itemServicoCount = jest.fn().mockResolvedValue(3);
    const { adapter } = makeAdapter({ itemServicoCount });
    await expect(adapter.countAtivasUsandoServico('svc-1')).resolves.toBe(3);
    expect(itemServicoCount).toHaveBeenCalledWith({
      where: {
        servicoCatalogoId: 'svc-1',
        ordemServico: {
          status: { in: expect.any(Array) },
        },
      },
    });
  });

  it('countReservasAtivasPeca consulta reservas não baixadas', async () => {
    const itemPecaCount = jest.fn().mockResolvedValue(5);
    const { adapter } = makeAdapter({ itemPecaCount });
    await expect(adapter.countReservasAtivasPeca('peca-1')).resolves.toBe(5);
    expect(itemPecaCount).toHaveBeenCalledWith({
      where: {
        pecaEstoqueId: 'peca-1',
        reservado: true,
        baixado: false,
      },
    });
  });

  it('obterTempoMedioExecucao retorna vazio sem ordens finalizadas', async () => {
    const { adapter } = makeAdapter({
      findMany: jest.fn().mockResolvedValue([]),
    });
    await expect(adapter.obterTempoMedioExecucao()).resolves.toEqual({
      totalOs: 0,
      globalMinutos: null,
      porServico: [],
      porFase: [
        {
          fase: 'Diagnostico',
          status: 'EM_DIAGNOSTICO',
          totalTransicoes: 0,
          mediaMinutos: null,
        },
        {
          fase: 'Execucao',
          status: 'EM_EXECUCAO',
          totalTransicoes: 0,
          mediaMinutos: null,
        },
        {
          fase: 'Finalizacao',
          status: 'FINALIZADA',
          totalTransicoes: 0,
          mediaMinutos: null,
        },
      ],
    });
  });

  it('obterTempoMedioExecucao ignora ordens sem dataConclusao no loop', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'os-sem-fim',
        dataCriacao: new Date('2026-01-01T10:00:00.000Z'),
        dataConclusao: null,
        itensServico: [],
      },
    ]);
    const { adapter } = makeAdapter({ findMany });
    const result = await adapter.obterTempoMedioExecucao();
    expect(result.totalOs).toBe(1);
    expect(result.globalMinutos).toBe(0);
  });

  it('obterTempoMedioExecucao calcula médias global e por serviço', async () => {
    const inicio = new Date('2026-01-01T10:00:00.000Z');
    const fim = new Date('2026-01-01T11:30:00.000Z');
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'os-1',
        dataCriacao: inicio,
        dataConclusao: fim,
        itensServico: [
          {
            servicoCatalogoId: 'svc-b',
            servicoCatalogo: { descricao: 'Balanceamento' },
          },
          {
            servicoCatalogoId: 'svc-a',
            servicoCatalogo: { descricao: 'Alinhamento' },
          },
        ],
      },
    ]);
    const { adapter } = makeAdapter({ findMany });
    const result = await adapter.obterTempoMedioExecucao();

    expect(result.totalOs).toBe(1);
    expect(result.globalMinutos).toBe(90);
    expect(result.porServico).toHaveLength(2);
    expect(result.porServico[0].descricao).toBe('Alinhamento');
    expect(result.porServico[1].descricao).toBe('Balanceamento');
    expect(result.porServico[0].mediaMinutos).toBe(90);
  });
});
