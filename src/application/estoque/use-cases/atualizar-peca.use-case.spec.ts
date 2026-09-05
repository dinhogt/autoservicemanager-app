import { NotFoundException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { AtualizarPecaUseCase } from './atualizar-peca.use-case';

const sample = new PecaEstoque(
  'p1',
  'Filtro',
  50,
  10,
  'CODE-1',
  true,
  new Date(),
  new Date(),
);

describe('AtualizarPecaUseCase', () => {
  function makeUc(repo: Partial<PecaEstoqueRepository>) {
    return new AtualizarPecaUseCase(repo as PecaEstoqueRepository);
  }

  it('lança not found quando inexistente', async () => {
    const uc = makeUc({ findById: jest.fn().mockResolvedValue(null) });
    await expect(uc.execute('p1', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retorna existente sem patch quando dto vazio', async () => {
    const update = jest.fn();
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    const result = await uc.execute('p1', {} as never);
    expect(result).toBe(sample);
    expect(update).not.toHaveBeenCalled();
  });

  it('aplica patch parcial', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('p1', { precoUnitario: 99.9 } as never);
    expect(update).toHaveBeenCalledWith('p1', { precoUnitario: 99.9 });
  });
});
