import { NotFoundException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { ObterPecaUseCase } from './obter-peca.use-case';

describe('ObterPecaUseCase', () => {
  const peca = new PecaEstoque(
    'p1',
    'Filtro',
    10,
    5,
    'FIL-01',
    true,
    new Date(),
    new Date(),
  );

  it('404 quando não existe', async () => {
    const uc = new ObterPecaUseCase({
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as PecaEstoqueRepository);
    await expect(uc.execute('p1')).rejects.toThrow(NotFoundException);
  });

  it('retorna peça', async () => {
    const uc = new ObterPecaUseCase({
      findById: jest.fn().mockResolvedValue(peca),
    } as unknown as PecaEstoqueRepository);
    await expect(uc.execute('p1')).resolves.toBe(peca);
  });
});
