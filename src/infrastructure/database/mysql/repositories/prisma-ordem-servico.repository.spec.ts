import { Prisma, StatusOs as PrismaStatusOs } from '@prisma/client';
import { StatusOs } from '../../../../domain/atendimento/value-objects/status-os.enum';
import { OrdemServico } from '../../../../domain/atendimento/entities/ordem-servico.entity';
import { statusOsToPrisma } from '../mappers/status-os.mapper';
import { PrismaService } from '../prisma.service';
import { PrismaOrdemServicoRepository } from './prisma-ordem-servico.repository';
import { reservarPecasNaoReservadasDaOs } from '../reservar-pecas-aprovacao-orcamento';

jest.mock('../reservar-pecas-aprovacao-orcamento');

const now = new Date('2026-01-15T10:00:00.000Z');

const cliente = {
  id: 'c1',
  nome: 'Roberto',
  cpfCnpj: '52998224725',
  contato: 'roberto@demo.local',
  ativo: true,
};

const veiculo = {
  id: 'v1',
  placa: 'ABC1D23',
  modelo: 'Gol',
  clienteId: 'c1',
  ativo: true,
};

const row = {
  id: 'os-1',
  clienteId: 'c1',
  veiculoId: 'v1',
  status: PrismaStatusOs.RECEBIDA,
  total: null as unknown,
  dataCriacao: now,
  dataConclusao: null as Date | null,
  dataEntrega: null as Date | null,
};

const rowWithRelations = {
  ...row,
  cliente,
  veiculo,
};

type PrismaHandlers = {
  findUnique: jest.Mock;
  findUniqueOrThrow: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
  updateMany: jest.Mock;
};

function makePrisma(overrides: Partial<PrismaHandlers> = {}) {
  const ordemServico: PrismaHandlers = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    ...overrides,
  };

  const itemServicoOs = {
    createMany: jest.fn(),
  };

  const itemPecaOs = {
    createMany: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  };

  const prisma = {
    ordemServico,
    itemServicoOs,
    itemPecaOs,
    $queryRaw: jest.fn(),
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        ordemServico,
        itemServicoOs,
        itemPecaOs,
        pecaEstoque: { update: jest.fn() },
      }),
    ),
  } as unknown as PrismaService;

  return { prisma, ordemServico, itemServicoOs, itemPecaOs };
}

describe('PrismaOrdemServicoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findById retorna entidade quando encontrado', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.findById('os-1');
    expect(result).toBeInstanceOf(OrdemServico);
    expect(result!.id).toBe('os-1');
    expect(result!.status).toBe(StatusOs.RECEBIDA);
  });

  it('findById retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    expect(await repo.findById('x')).toBeNull();
  });

  it('map converte total Decimal para Number', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue({
        ...row,
        total: '1500.50',
      }),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.findById('os-1');
    expect(result!.total).toBe(1500.5);
  });

  it('findWithClienteVeiculoById retorna agregado com cliente e veículo', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(rowWithRelations),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.findWithClienteVeiculoById('os-1');
    expect(result).toMatchObject({
      id: 'os-1',
      status: StatusOs.RECEBIDA,
      cliente: { nome: 'Roberto' },
      veiculo: { placa: 'ABC1D23' },
    });
  });

  it('findDetailedById delega include completo ao Prisma', async () => {
    const detailed = { id: 'os-1', itensServico: [], itensPeca: [] };
    const { prisma, ordemServico } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(detailed),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.findDetailedById('os-1');
    expect(result).toEqual(detailed);
    expect(ordemServico.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'os-1' },
        include: expect.objectContaining({
          itensServico: expect.any(Object),
          itensPeca: expect.any(Object),
        }),
      }),
    );
  });

  it('listarAtivasParaPainel preserva ordenação do queryRaw', async () => {
    const os2 = {
      ...rowWithRelations,
      id: 'os-2',
      status: PrismaStatusOs.EM_EXECUCAO,
    };
    const os3 = {
      ...rowWithRelations,
      id: 'os-3',
      status: PrismaStatusOs.AGUARDANDO_APROVACAO,
    };
    const { prisma, ordemServico } = makePrisma({
      findMany: jest.fn().mockResolvedValue([os3, os2]),
    });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { id: 'os-2' },
      { id: 'os-3' },
    ]);

    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.listarAtivasParaPainel({ skip: 0, take: 10 });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(ordemServico.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['os-2', 'os-3'] } },
      }),
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('os-2');
    expect(result[1].id).toBe('os-3');
    expect(result[0].cliente.nome).toBe('Roberto');
  });

  it('listarAtivasParaPainel retorna vazio quando queryRaw não encontra ids', async () => {
    const { prisma, ordemServico } = makePrisma();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.listarAtivasParaPainel({ skip: 0, take: 10 });
    expect(result).toEqual([]);
    expect(ordemServico.findMany).not.toHaveBeenCalled();
  });

  it('countAtivasParaPainel exclui finalizadas e entregues', async () => {
    const { prisma, ordemServico } = makePrisma({
      count: jest.fn().mockResolvedValue(4),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const total = await repo.countAtivasParaPainel();
    expect(total).toBe(4);
    expect(ordemServico.count).toHaveBeenCalledWith({
      where: {
        status: {
          notIn: [
            statusOsToPrisma(StatusOs.FINALIZADA),
            statusOsToPrisma(StatusOs.ENTREGUE),
          ],
        },
      },
    });
  });

  it('save atualiza e retorna entidade mapeada', async () => {
    const updated = {
      ...row,
      status: PrismaStatusOs.EM_EXECUCAO,
      total: '730.00',
    };
    const { prisma, ordemServico } = makePrisma({
      update: jest.fn().mockResolvedValue(updated),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);

    const os = new OrdemServico(
      'os-1',
      'c1',
      'v1',
      StatusOs.EM_EXECUCAO,
      730,
      now,
      null,
      null,
    );
    const result = await repo.save(os);

    expect(ordemServico.update).toHaveBeenCalledWith({
      where: { id: 'os-1' },
      data: {
        status: StatusOs.EM_EXECUCAO,
        total: 730,
        dataConclusao: null,
        dataEntrega: null,
      },
    });
    expect(result.status).toBe(StatusOs.EM_EXECUCAO);
  });

  it('updateStatus aplica campos opcionais e retorna com cliente/veículo', async () => {
    const updated = {
      ...rowWithRelations,
      status: PrismaStatusOs.FINALIZADA,
      total: new Prisma.Decimal(500),
      dataConclusao: now,
    };
    const { prisma, ordemServico } = makePrisma({
      update: jest.fn().mockResolvedValue(updated),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.updateStatus('os-1', {
      status: StatusOs.FINALIZADA,
      total: 500,
      dataConclusao: now,
    });
    expect(ordemServico.update).toHaveBeenCalled();
    expect(result.status).toBe(StatusOs.FINALIZADA);
    expect(result.total).toBe(500);
  });

  it('createWithItems cria OS com itens de serviço e peça', async () => {
    const created = { ...rowWithRelations, id: 'os-new' };
    const { prisma, ordemServico, itemServicoOs, itemPecaOs } = makePrisma({
      create: jest.fn().mockResolvedValue({ ...row, id: 'os-new' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(created),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);

    const result = await repo.createWithItems({
      clienteId: 'c1',
      veiculoId: 'v1',
      total: 100,
      itensServico: [
        {
          servicoCatalogoId: 'svc-1',
          quantidade: 2,
          precoAplicado: 50,
        },
      ],
      itensPeca: [
        {
          pecaEstoqueId: 'peca-1',
          quantidade: 1,
          precoUnitario: 25,
        },
      ],
    });

    expect(ordemServico.create).toHaveBeenCalled();
    expect(itemServicoOs.createMany).toHaveBeenCalled();
    expect(itemPecaOs.createMany).toHaveBeenCalled();
    expect(result.id).toBe('os-new');
    expect(result.status).toBe(StatusOs.RECEBIDA);
  });

  it('finalizar baixa peças reservadas e atualiza status', async () => {
    const { prisma, ordemServico, itemPecaOs } = makePrisma({
      findUnique: jest.fn().mockResolvedValue({
        ...row,
        itensPeca: [{ id: 'ip-1', reservado: true, baixado: false }],
      }),
      update: jest.fn().mockResolvedValue({
        ...row,
        status: PrismaStatusOs.FINALIZADA,
      }),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    await repo.finalizar('os-1');

    expect(itemPecaOs.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['ip-1'] } },
      data: { baixado: true },
    });
    expect(ordemServico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'os-1' },
        data: expect.objectContaining({
          status: statusOsToPrisma(StatusOs.FINALIZADA),
        }),
      }),
    );
  });

  it('finalizar não faz nada quando OS não existe', async () => {
    const { prisma, ordemServico } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    await repo.finalizar('missing');
    expect(ordemServico.update).not.toHaveBeenCalled();
  });

  it('aprovarOrcamentoComReserva reserva peças e muda status', async () => {
    jest
      .mocked(reservarPecasNaoReservadasDaOs)
      .mockResolvedValue([{ pecaEstoqueId: 'peca-1', quantidade: 2 }]);
    const updated = {
      ...rowWithRelations,
      status: PrismaStatusOs.EM_EXECUCAO,
    };
    const { prisma, ordemServico } = makePrisma({
      update: jest.fn().mockResolvedValue(updated),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);

    const result = await repo.aprovarOrcamentoComReserva('os-1');

    expect(reservarPecasNaoReservadasDaOs).toHaveBeenCalled();
    expect(result.resultado.status).toBe(StatusOs.EM_EXECUCAO);
    expect(result.pecasReservadas).toEqual([
      { pecaEstoqueId: 'peca-1', quantidade: 2 },
    ]);
    expect(ordemServico.update).toHaveBeenCalled();
  });

  it('rejeitarOrcamento atualiza para REJEITADA', async () => {
    const updated = {
      ...rowWithRelations,
      status: PrismaStatusOs.REJEITADA,
    };
    const { prisma, ordemServico } = makePrisma({
      update: jest.fn().mockResolvedValue(updated),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.rejeitarOrcamento('os-1');
    expect(result.status).toBe(StatusOs.REJEITADA);
    expect(ordemServico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: statusOsToPrisma(StatusOs.REJEITADA) },
      }),
    );
  });

  it('findForGerarOrcamento retorna null quando OS ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    expect(await repo.findForGerarOrcamento('x')).toBeNull();
  });

  it('findForGerarOrcamento retorna OS com itens quando encontrada', async () => {
    const detailed = {
      ...rowWithRelations,
      itensServico: [{ id: 'is-1' }],
      itensPeca: [{ id: 'ip-1' }],
    };
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(detailed),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.findForGerarOrcamento('os-1');
    expect(result).toMatchObject({
      id: 'os-1',
      itensServico: [{ id: 'is-1' }],
      itensPeca: [{ id: 'ip-1' }],
    });
  });

  it('createWithItems sem itens não chama createMany', async () => {
    const created = { ...rowWithRelations, id: 'os-solo' };
    const { prisma, itemServicoOs, itemPecaOs } = makePrisma({
      create: jest.fn().mockResolvedValue({ ...row, id: 'os-solo' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(created),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    await repo.createWithItems({
      clienteId: 'c1',
      veiculoId: 'v1',
      total: 0,
      itensServico: [],
      itensPeca: [],
    });
    expect(itemServicoOs.createMany).not.toHaveBeenCalled();
    expect(itemPecaOs.createMany).not.toHaveBeenCalled();
  });

  it('finalizar sem peças reservadas apenas atualiza status', async () => {
    const { prisma, ordemServico, itemPecaOs } = makePrisma({
      findUnique: jest.fn().mockResolvedValue({
        ...row,
        itensPeca: [{ id: 'ip-1', reservado: false, baixado: false }],
      }),
      update: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    await repo.finalizar('os-1');
    expect(itemPecaOs.updateMany).not.toHaveBeenCalled();
    expect(ordemServico.update).toHaveBeenCalled();
  });

  it('gerarOrcamento atualiza total e status AGUARDANDO_APROVACAO', async () => {
    const updated = {
      ...rowWithRelations,
      status: PrismaStatusOs.AGUARDANDO_APROVACAO,
      total: new Prisma.Decimal(320),
      itensServico: [],
      itensPeca: [],
    };
    const { prisma, ordemServico } = makePrisma({
      update: jest.fn().mockResolvedValue(updated),
    });
    const repo = new PrismaOrdemServicoRepository(prisma);
    const result = await repo.gerarOrcamento('os-1', 320);
    expect(result.status).toBe(StatusOs.AGUARDANDO_APROVACAO);
    expect(result.total).toBe(320);
    expect(ordemServico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: statusOsToPrisma(StatusOs.AGUARDANDO_APROVACAO),
        }),
      }),
    );
  });
});
