import { Veiculo } from '../../../../domain/cadastro/entities/veiculo.entity';
import { PrismaService } from '../prisma.service';
import { PrismaVeiculoRepository } from './prisma-veiculo.repository';

const row = {
  id: 'v1',
  clienteId: 'c1',
  placa: 'ABC1D23',
  marca: null,
  modelo: null,
  ano: null,
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePrisma(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const handlers = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    ...overrides,
  };
  return {
    prisma: { veiculo: handlers } as unknown as PrismaService,
    handlers,
  };
}

describe('PrismaVeiculoRepository', () => {
  it('create persiste com defaults', async () => {
    const { prisma, handlers } = makePrisma({
      create: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    const created = await repo.create({
      clienteId: 'c1',
      placa: 'ABC1D23',
    });
    expect(handlers.create).toHaveBeenCalledWith({
      data: {
        clienteId: 'c1',
        placa: 'ABC1D23',
        marca: null,
        modelo: null,
        ano: null,
      },
    });
    expect(created).toBeInstanceOf(Veiculo);
  });

  it('softDelete atualiza ativo=false', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.softDelete('v1');
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { ativo: false },
    });
  });

  it('findByPlaca usa where unique pela placa', async () => {
    const { prisma, handlers } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.findByPlaca('ABC1D23');
    expect(handlers.findUnique).toHaveBeenCalledWith({
      where: { placa: 'ABC1D23' },
    });
  });

  it('findByClienteId filtra por cliente e ativo=true por padrão', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.findByClienteId('c1');
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { clienteId: 'c1', ativo: true },
      orderBy: { placa: 'asc' },
    });
  });

  it('findByClienteId remove filtro ativo quando incluirInativos', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([]),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.findByClienteId('c1', { incluirInativos: true });
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { clienteId: 'c1' },
      orderBy: { placa: 'asc' },
    });
  });

  it('findAll aplica filtro composto (clienteId + ativo)', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.findAll({ skip: 0, take: 5 }, { clienteId: 'c1' });
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { ativo: true, clienteId: 'c1' },
      orderBy: { placa: 'asc' },
      skip: 0,
      take: 5,
    });
  });

  it('count delega para prisma com where construído', async () => {
    const { prisma, handlers } = makePrisma({
      count: jest.fn().mockResolvedValue(2),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    expect(await repo.count({ incluirInativos: true })).toBe(2);
    expect(handlers.count).toHaveBeenCalledWith({ where: {} });
  });

  it('findById retorna entidade quando encontrado', async () => {
    const { prisma, handlers } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    const result = await repo.findById('v1');
    expect(result).toBeInstanceOf(Veiculo);
    expect(result!.id).toBe('v1');
    expect(handlers.findUnique).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });

  it('findById retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    expect(await repo.findById('zz')).toBeNull();
  });

  it('findByPlaca retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    expect(await repo.findByPlaca('ZZZ9Z99')).toBeNull();
  });

  it('update encaminha patch ao prisma', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue({ ...row, marca: 'Toyota' }),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    const result = await repo.update('v1', { marca: 'Toyota' });
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { marca: 'Toyota' },
    });
    expect(result).toBeInstanceOf(Veiculo);
  });

  it('findAll sem paginação aplica apenas filtro ativo', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaVeiculoRepository(prisma);
    await repo.findAll();
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { placa: 'asc' },
    });
  });
});
