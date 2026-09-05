import { ServicoCatalogo } from '../../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import { PrismaService } from '../prisma.service';
import { PrismaServicoCatalogoRepository } from './prisma-servico-catalogo.repository';

const row = {
  id: 's1',
  descricao: 'Troca de óleo',
  precoBase: 120 as unknown as number,
  tempoMedioExecucao: 60,
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
    prisma: { servicoCatalogo: handlers } as unknown as PrismaService,
    handlers,
  };
}

describe('PrismaServicoCatalogoRepository', () => {
  it('create persiste e converte preço para Number', async () => {
    const { prisma } = makePrisma({
      create: jest.fn().mockResolvedValue({ ...row, precoBase: '120.00' }),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    const created = await repo.create({
      descricao: 'Troca de óleo',
      precoBase: 120,
      tempoMedioExecucao: 60,
    });
    expect(created).toBeInstanceOf(ServicoCatalogo);
    expect(created.precoBase).toBe(120);
  });

  it('softDelete atualiza ativo=false', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    await repo.softDelete('s1');
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { ativo: false },
    });
  });

  it('findById retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    expect(await repo.findById('zz')).toBeNull();
  });

  it('findAll filtra ativo=true por padrão', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    await repo.findAll();
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { descricao: 'asc' },
    });
  });

  it('count com incluirInativos remove filtro', async () => {
    const { prisma, handlers } = makePrisma({
      count: jest.fn().mockResolvedValue(7),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    expect(await repo.count({ incluirInativos: true })).toBe(7);
    expect(handlers.count).toHaveBeenCalledWith({ where: {} });
  });

  it('findById retorna entidade quando encontrado', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    const result = await repo.findById('s1');
    expect(result).toBeInstanceOf(ServicoCatalogo);
    expect(result!.id).toBe('s1');
  });

  it('update encaminha patch ao prisma', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue({ ...row, descricao: 'Alinhamento' }),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    const result = await repo.update('s1', { descricao: 'Alinhamento' });
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { descricao: 'Alinhamento' },
    });
    expect(result).toBeInstanceOf(ServicoCatalogo);
  });

  it('findAll com paginação e incluirInativos', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    await repo.findAll({ skip: 0, take: 10 }, { incluirInativos: true });
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { descricao: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('count filtra ativo=true por padrão', async () => {
    const { prisma, handlers } = makePrisma({
      count: jest.fn().mockResolvedValue(3),
    });
    const repo = new PrismaServicoCatalogoRepository(prisma);
    expect(await repo.count()).toBe(3);
    expect(handlers.count).toHaveBeenCalledWith({ where: { ativo: true } });
  });
});
