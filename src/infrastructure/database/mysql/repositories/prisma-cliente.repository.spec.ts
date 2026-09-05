import { Cliente } from '../../../../domain/cadastro/entities/cliente.entity';
import { PrismaService } from '../prisma.service';
import { PrismaClienteRepository } from './prisma-cliente.repository';

const row = {
  id: 'c1',
  nome: 'João',
  cpfCnpj: '52998224725',
  contato: null,
  enderecos: null,
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
    prisma: { cliente: handlers } as unknown as PrismaService,
    handlers,
  };
}

describe('PrismaClienteRepository', () => {
  it('create persiste e mapeia para entidade', async () => {
    const { prisma, handlers } = makePrisma({
      create: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaClienteRepository(prisma);
    const created = await repo.create({
      nome: 'João',
      cpfCnpj: '52998224725',
    });
    expect(handlers.create).toHaveBeenCalledWith({
      data: {
        nome: 'João',
        cpfCnpj: '52998224725',
        contato: null,
        enderecos: null,
      },
    });
    expect(created).toBeInstanceOf(Cliente);
    expect(created.ativo).toBe(true);
  });

  it('update encaminha patch e mapeia', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue({ ...row, nome: 'Maria' }),
    });
    const repo = new PrismaClienteRepository(prisma);
    const result = await repo.update('c1', { nome: 'Maria' });
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { nome: 'Maria' },
    });
    expect(result.nome).toBe('Maria');
  });

  it('softDelete atualiza ativo=false', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaClienteRepository(prisma);
    await repo.softDelete('c1');
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { ativo: false },
    });
  });

  it('findById retorna entidade quando encontrada', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaClienteRepository(prisma);
    const found = await repo.findById('c1');
    expect(found).toBeInstanceOf(Cliente);
  });

  it('findById retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaClienteRepository(prisma);
    expect(await repo.findById('zz')).toBeNull();
  });

  it('findByCpfCnpj usa where unique', async () => {
    const { prisma, handlers } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaClienteRepository(prisma);
    await repo.findByCpfCnpj('52998224725');
    expect(handlers.findUnique).toHaveBeenCalledWith({
      where: { cpfCnpj: '52998224725' },
    });
  });

  it('findAll filtra ativo=true por padrão e aplica paginação', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaClienteRepository(prisma);
    await repo.findAll({ skip: 0, take: 10 });
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('findAll com incluirInativos remove filtro ativo', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaClienteRepository(prisma);
    await repo.findAll(undefined, { incluirInativos: true });
    expect(handlers.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { nome: 'asc' },
    });
  });

  it('count respeita filtro', async () => {
    const { prisma, handlers } = makePrisma({
      count: jest.fn().mockResolvedValue(3),
    });
    const repo = new PrismaClienteRepository(prisma);
    expect(await repo.count()).toBe(3);
    expect(handlers.count).toHaveBeenCalledWith({ where: { ativo: true } });
    await repo.count({ incluirInativos: true });
    expect(handlers.count).toHaveBeenLastCalledWith({ where: {} });
  });
});
