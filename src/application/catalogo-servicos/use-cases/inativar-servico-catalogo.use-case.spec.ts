import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { InativarServicoCatalogoUseCase } from './inativar-servico-catalogo.use-case';

function makeServico(ativo = true) {
  return new ServicoCatalogo(
    's1',
    'Troca de óleo',
    120,
    60,
    ativo,
    new Date(),
    new Date(),
  );
}

function makeUc(opts: {
  servico?: ServicoCatalogo | null;
  itensCount?: number;
  softDelete?: jest.Mock;
}) {
  const repo = {
    findById: jest.fn().mockResolvedValue(opts.servico ?? null),
    softDelete: opts.softDelete ?? jest.fn().mockResolvedValue(undefined),
  } as unknown as ServicoCatalogoRepository;
  const ordensRead = {
    countAtivasUsandoServico: jest.fn().mockResolvedValue(opts.itensCount ?? 0),
  } as unknown as OrdemServicoReadPort;
  return { uc: new InativarServicoCatalogoUseCase(repo, ordensRead), repo };
}

describe('InativarServicoCatalogoUseCase', () => {
  it('lança not found quando inexistente', async () => {
    const { uc } = makeUc({ servico: null });
    await expect(uc.execute('s1')).rejects.toThrow(NotFoundException);
  });

  it('é idempotente quando já inativo', async () => {
    const { uc, repo } = makeUc({ servico: makeServico(false) });
    await uc.execute('s1');
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('lança conflict quando há OS ativas vinculadas', async () => {
    const { uc, repo } = makeUc({ servico: makeServico(), itensCount: 1 });
    await expect(uc.execute('s1')).rejects.toThrow(ConflictException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('inativa quando sem vínculos pendentes', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    const { uc } = makeUc({
      servico: makeServico(),
      itensCount: 0,
      softDelete,
    });
    await uc.execute('s1');
    expect(softDelete).toHaveBeenCalledWith('s1');
  });
});
