import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { DomainException } from '../../../shared/errors/domain.exception';
import {
  MovimentarEstoqueDto,
  TipoMovimentacaoEstoque,
} from '../dto/movimentar-estoque.dto';
import { MovimentarEstoquePecaUseCase } from './movimentar-estoque-peca.use-case';

describe('MovimentarEstoquePecaUseCase', () => {
  const dto: MovimentarEstoqueDto = {
    tipo: TipoMovimentacaoEstoque.ENTRADA,
    quantidade: 2,
  };

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

  function makeUseCase(repo: Partial<PecaEstoqueRepository>) {
    return new MovimentarEstoquePecaUseCase(repo as PecaEstoqueRepository);
  }

  it('propaga peça atualizada em entrada', async () => {
    const aplicarMovimentacao = jest.fn().mockResolvedValue(peca);
    const uc = makeUseCase({ aplicarMovimentacao });
    const result = await uc.execute('p1', dto);
    expect(result).toBe(peca);
    expect(aplicarMovimentacao).toHaveBeenCalledWith('p1', 2);
  });

  it('saída usa delta negativo', async () => {
    const aplicarMovimentacao = jest.fn().mockResolvedValue(peca);
    const uc = makeUseCase({ aplicarMovimentacao });
    await uc.execute('p1', {
      ...dto,
      tipo: TipoMovimentacaoEstoque.SAIDA,
    });
    expect(aplicarMovimentacao).toHaveBeenCalledWith('p1', -2);
  });

  it('mapeia PECA_NOT_FOUND para NotFoundException', async () => {
    const aplicarMovimentacao = jest
      .fn()
      .mockRejectedValue(new DomainException('x', 'PECA_NOT_FOUND'));
    const uc = makeUseCase({ aplicarMovimentacao });
    await expect(uc.execute('p1', dto)).rejects.toThrow(NotFoundException);
  });

  it('mapeia ESTOQUE_INSUFICIENTE para UnprocessableEntityException', async () => {
    const aplicarMovimentacao = jest
      .fn()
      .mockRejectedValue(new DomainException('x', 'ESTOQUE_INSUFICIENTE'));
    const uc = makeUseCase({ aplicarMovimentacao });
    await expect(uc.execute('p1', dto)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('repropaga outros erros', async () => {
    const err = new Error('db');
    const aplicarMovimentacao = jest.fn().mockRejectedValue(err);
    const uc = makeUseCase({ aplicarMovimentacao });
    await expect(uc.execute('p1', dto)).rejects.toThrow('db');
  });
});
