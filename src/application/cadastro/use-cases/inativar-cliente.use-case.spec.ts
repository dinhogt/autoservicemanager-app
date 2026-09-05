import { ConflictException, NotFoundException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { InativarClienteUseCase } from './inativar-cliente.use-case';

function makeCliente(ativo = true) {
  return new Cliente(
    'c1',
    'João',
    '52998224725',
    null,
    null,
    ativo,
    new Date(),
    new Date(),
  );
}

describe('InativarClienteUseCase', () => {
  function makeUc(opts: {
    cliente?: Cliente | null;
    osCount?: number;
    softDelete?: jest.Mock;
  }) {
    const repo = {
      findById: jest.fn().mockResolvedValue(opts.cliente ?? null),
      softDelete: opts.softDelete ?? jest.fn().mockResolvedValue(undefined),
    } as unknown as ClienteRepository;
    const ordensRead = {
      countAtivasByClienteId: jest.fn().mockResolvedValue(opts.osCount ?? 0),
    } as unknown as OrdemServicoReadPort;
    return {
      uc: new InativarClienteUseCase(repo, ordensRead),
      repo,
      ordensRead,
    };
  }

  it('lança not found quando cliente inexistente', async () => {
    const { uc } = makeUc({ cliente: null });
    await expect(uc.execute('c1')).rejects.toThrow(NotFoundException);
  });

  it('é idempotente quando cliente já inativo', async () => {
    const { uc, repo, ordensRead } = makeUc({ cliente: makeCliente(false) });
    await uc.execute('c1');
    expect(ordensRead.countAtivasByClienteId).not.toHaveBeenCalled();
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('lança conflict quando há OS em andamento', async () => {
    const { uc, repo } = makeUc({ cliente: makeCliente(), osCount: 2 });
    await expect(uc.execute('c1')).rejects.toThrow(ConflictException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('inativa quando não há OS em andamento', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    const { uc } = makeUc({
      cliente: makeCliente(),
      osCount: 0,
      softDelete,
    });
    await uc.execute('c1');
    expect(softDelete).toHaveBeenCalledWith('c1');
  });
});
