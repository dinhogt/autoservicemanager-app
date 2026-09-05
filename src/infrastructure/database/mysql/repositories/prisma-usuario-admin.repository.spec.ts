import {
  RoleAdmin,
  UsuarioAdmin,
} from '../../../../domain/autenticacao/entities/usuario-admin.entity';
import { PrismaService } from '../prisma.service';
import { PrismaUsuarioAdminRepository } from './prisma-usuario-admin.repository';

const row = {
  id: 'u1',
  nome: 'Admin',
  email: 'admin@example.com',
  senhaHash: 'hash',
  role: 'ADMIN',
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
    prisma: { usuarioAdmin: handlers } as unknown as PrismaService,
    handlers,
  };
}

describe('PrismaUsuarioAdminRepository', () => {
  it('create persiste e mapeia entidade', async () => {
    const { prisma, handlers } = makePrisma({
      create: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    const created = await repo.create({
      nome: 'Admin',
      email: 'admin@example.com',
      senhaHash: 'hash',
      role: RoleAdmin.ADMIN,
    });
    expect(handlers.create).toHaveBeenCalledWith({
      data: {
        nome: 'Admin',
        email: 'admin@example.com',
        senhaHash: 'hash',
        role: RoleAdmin.ADMIN,
      },
    });
    expect(created).toBeInstanceOf(UsuarioAdmin);
  });

  it('update encaminha patch', async () => {
    const { prisma, handlers } = makePrisma({
      update: jest.fn().mockResolvedValue({ ...row, ativo: false }),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    const updated = await repo.update('u1', { ativo: false });
    expect(handlers.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { ativo: false },
    });
    expect(updated.ativo).toBe(false);
  });

  it('findByEmail retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    expect(await repo.findByEmail('nao@ex.com')).toBeNull();
  });

  it('findAll aplica paginação opcional', async () => {
    const { prisma, handlers } = makePrisma({
      findMany: jest.fn().mockResolvedValue([row]),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    await repo.findAll({ skip: 0, take: 10 });
    expect(handlers.findMany).toHaveBeenCalledWith({
      orderBy: { nome: 'asc' },
      skip: 0,
      take: 10,
    });
  });

  it('count delega ao prisma', async () => {
    const { prisma, handlers } = makePrisma({
      count: jest.fn().mockResolvedValue(4),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    expect(await repo.count()).toBe(4);
    expect(handlers.count).toHaveBeenCalled();
  });

  it('findById retorna entidade quando encontrado', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    const result = await repo.findById('u1');
    expect(result).toBeInstanceOf(UsuarioAdmin);
    expect(result!.id).toBe('u1');
  });

  it('findById retorna null quando ausente', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    expect(await repo.findById('zz')).toBeNull();
  });

  it('findByEmail retorna entidade quando encontrado', async () => {
    const { prisma } = makePrisma({
      findUnique: jest.fn().mockResolvedValue(row),
    });
    const repo = new PrismaUsuarioAdminRepository(prisma);
    const result = await repo.findByEmail('admin@example.com');
    expect(result).toBeInstanceOf(UsuarioAdmin);
    expect(result!.email).toBe('admin@example.com');
  });
});
