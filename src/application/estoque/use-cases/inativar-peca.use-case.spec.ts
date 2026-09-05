import { ConflictException, NotFoundException } from '@nestjs/common';
import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { InativarPecaUseCase } from './inativar-peca.use-case';

function makePeca(ativo = true) {
  return new PecaEstoque(
    'p1',
    'Filtro',
    50,
    10,
    'CODE-1',
    ativo,
    new Date(),
    new Date(),
  );
}

function makeUc(opts: {
  peca?: PecaEstoque | null;
  reservasCount?: number;
  softDelete?: jest.Mock;
}) {
  const repo = {
    findById: jest.fn().mockResolvedValue(opts.peca ?? null),
    softDelete: opts.softDelete ?? jest.fn().mockResolvedValue(undefined),
  } as unknown as PecaEstoqueRepository;
  const ordensRead = {
    countReservasAtivasPeca: jest
      .fn()
      .mockResolvedValue(opts.reservasCount ?? 0),
  } as unknown as OrdemServicoReadPort;
  return { uc: new InativarPecaUseCase(repo, ordensRead), repo };
}

describe('InativarPecaUseCase', () => {
  it('lança not found quando inexistente', async () => {
    const { uc } = makeUc({ peca: null });
    await expect(uc.execute('p1')).rejects.toThrow(NotFoundException);
  });

  it('é idempotente quando já inativa', async () => {
    const { uc, repo } = makeUc({ peca: makePeca(false) });
    await uc.execute('p1');
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('lança conflict quando há reservas ativas', async () => {
    const { uc, repo } = makeUc({ peca: makePeca(), reservasCount: 1 });
    await expect(uc.execute('p1')).rejects.toThrow(ConflictException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('inativa quando sem reservas', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    const { uc } = makeUc({
      peca: makePeca(),
      reservasCount: 0,
      softDelete,
    });
    await uc.execute('p1');
    expect(softDelete).toHaveBeenCalledWith('p1');
  });
});
