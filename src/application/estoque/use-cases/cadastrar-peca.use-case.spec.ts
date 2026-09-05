import { ConflictException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { CadastrarPecaUseCase } from './cadastrar-peca.use-case';

describe('CadastrarPecaUseCase', () => {
  const peca = new PecaEstoque(
    'p1',
    'Filtro',
    10,
    0,
    'FIL-01',
    true,
    new Date(),
    new Date(),
  );

  function makeUc(repo: Partial<PecaEstoqueRepository>) {
    return new CadastrarPecaUseCase(repo as PecaEstoqueRepository);
  }

  it('Conflict quando código já existe', async () => {
    const findByCodigoInterno = jest.fn().mockResolvedValue(peca);
    const uc = makeUc({ findByCodigoInterno });
    await expect(
      uc.execute({
        descricao: 'x',
        precoUnitario: 1,
        codigoInterno: 'fil-01',
      } as never),
    ).rejects.toThrow(ConflictException);
    expect(findByCodigoInterno).toHaveBeenCalledWith('FIL-01');
  });

  it('cria peça com código normalizado', async () => {
    const create = jest.fn().mockResolvedValue(peca);
    const uc = makeUc({
      findByCodigoInterno: jest.fn().mockResolvedValue(null),
      create,
    });
    const result = await uc.execute({
      descricao: 'Filtro',
      precoUnitario: 10,
      quantidadeEmEstoque: 0,
      codigoInterno: '  fil-01  ',
    } as never);
    expect(result).toBe(peca);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        codigoInterno: 'FIL-01',
      }),
    );
  });
});
