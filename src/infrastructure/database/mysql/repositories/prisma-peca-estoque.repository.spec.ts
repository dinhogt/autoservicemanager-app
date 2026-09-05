import { PecaEstoque } from '../../../../domain/estoque/entities/peca-estoque.entity';
import { DomainException } from '../../../../shared/errors/domain.exception';
import { PrismaService } from '../prisma.service';
import { PrismaPecaEstoqueRepository } from './prisma-peca-estoque.repository';

describe('PrismaPecaEstoqueRepository', () => {
  const row = {
    id: 'p1',
    descricao: 'Peça',
    precoUnitario: 10,
    quantidadeEmEstoque: 5,
    codigoInterno: 'P-1',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function makeRepo(txHandlers: { findUnique: jest.Mock; update?: jest.Mock }) {
    const tx = {
      pecaEstoque: txHandlers,
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
      pecaEstoque: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as PrismaService;
    return { repo: new PrismaPecaEstoqueRepository(prisma), prisma, tx };
  }

  it('aplicarMovimentacao aumenta estoque em entrada', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ ...row, quantidadeEmEstoque: 5 });
    const update = jest.fn().mockResolvedValue({
      ...row,
      quantidadeEmEstoque: 7,
    });
    const { repo } = makeRepo({ findUnique, update });

    const result = await repo.aplicarMovimentacao('p1', 2);

    expect(result).toBeInstanceOf(PecaEstoque);
    expect(result.quantidadeEmEstoque).toBe(7);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { quantidadeEmEstoque: 7 },
    });
  });

  it('aplicarMovimentacao lança PECA_NOT_FOUND', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const { repo } = makeRepo({ findUnique, update: jest.fn() });

    await expect(repo.aplicarMovimentacao('x', 1)).rejects.toThrow(
      DomainException,
    );
    await expect(repo.aplicarMovimentacao('x', 1)).rejects.toMatchObject({
      code: 'PECA_NOT_FOUND',
    });
  });

  it('aplicarMovimentacao lança ESTOQUE_INSUFICIENTE', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      ...row,
      quantidadeEmEstoque: 1,
    });
    const { repo } = makeRepo({ findUnique, update: jest.fn() });

    await expect(repo.aplicarMovimentacao('p1', -5)).rejects.toMatchObject({
      code: 'ESTOQUE_INSUFICIENTE',
    });
  });

  it('create persiste e converte preço para Number', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.create as jest.Mock).mockResolvedValue({
      ...row,
      precoUnitario: '10.00',
    });
    const created = await repo.create({
      descricao: 'Peça',
      precoUnitario: 10,
      quantidadeEmEstoque: 5,
      codigoInterno: 'P-1',
    });
    expect(prisma.pecaEstoque.create).toHaveBeenCalledWith({
      data: {
        descricao: 'Peça',
        precoUnitario: 10,
        quantidadeEmEstoque: 5,
        codigoInterno: 'P-1',
      },
    });
    expect(created).toBeInstanceOf(PecaEstoque);
    expect(created.precoUnitario).toBe(10);
  });

  it('softDelete atualiza ativo=false', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.update as jest.Mock).mockResolvedValue(row);
    await repo.softDelete('p1');
    expect(prisma.pecaEstoque.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { ativo: false },
    });
  });

  it('findAll filtra ativo=true por padrão', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findMany as jest.Mock).mockResolvedValue([row]);
    await repo.findAll({ skip: 0, take: 5 });
    expect(prisma.pecaEstoque.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { codigoInterno: 'asc' },
      skip: 0,
      take: 5,
    });
  });

  it('findByCodigoInterno usa where unique', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findUnique as jest.Mock).mockResolvedValue(row);
    await repo.findByCodigoInterno('P-1');
    expect(prisma.pecaEstoque.findUnique).toHaveBeenCalledWith({
      where: { codigoInterno: 'P-1' },
    });
  });

  it('findById retorna entidade quando encontrado', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findUnique as jest.Mock).mockResolvedValue(row);
    const result = await repo.findById('p1');
    expect(result).toBeInstanceOf(PecaEstoque);
    expect(result!.id).toBe('p1');
  });

  it('findById retorna null quando ausente', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await repo.findById('x')).toBeNull();
  });

  it('findAll com incluirInativos retorna todos', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findMany as jest.Mock).mockResolvedValue([row]);
    await repo.findAll(undefined, { incluirInativos: true });
    expect(prisma.pecaEstoque.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { codigoInterno: 'asc' },
    });
  });

  it('update encaminha patch ao prisma', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.update as jest.Mock).mockResolvedValue({
      ...row,
      descricao: 'Nova',
    });
    const result = await repo.update('p1', { descricao: 'Nova' });
    expect(prisma.pecaEstoque.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { descricao: 'Nova' },
    });
    expect(result).toBeInstanceOf(PecaEstoque);
  });

  it('count filtra ativo=true por padrão', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque as any).count = jest.fn().mockResolvedValue(3);
    expect(await repo.count()).toBe(3);
    expect((prisma.pecaEstoque as any).count).toHaveBeenCalledWith({
      where: { ativo: true },
    });
  });

  it('count com incluirInativos remove filtro', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque as any).count = jest.fn().mockResolvedValue(5);
    expect(await repo.count({ incluirInativos: true })).toBe(5);
    expect((prisma.pecaEstoque as any).count).toHaveBeenCalledWith({
      where: {},
    });
  });

  it('findByCodigoInterno retorna null quando ausente', async () => {
    const { repo, prisma } = makeRepo({
      findUnique: jest.fn(),
      update: jest.fn(),
    });
    (prisma.pecaEstoque.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await repo.findByCodigoInterno('ZZ')).toBeNull();
  });
});
