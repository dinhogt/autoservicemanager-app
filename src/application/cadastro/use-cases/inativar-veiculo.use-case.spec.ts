import { ConflictException, NotFoundException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { InativarVeiculoUseCase } from './inativar-veiculo.use-case';

function makeVeiculo(ativo = true) {
  return new Veiculo(
    'v1',
    'c1',
    'ABC1D23',
    null,
    null,
    null,
    ativo,
    new Date(),
    new Date(),
  );
}

function makeUc(opts: {
  veiculo?: Veiculo | null;
  osCount?: number;
  softDelete?: jest.Mock;
}) {
  const repo = {
    findById: jest.fn().mockResolvedValue(opts.veiculo ?? null),
    softDelete: opts.softDelete ?? jest.fn().mockResolvedValue(undefined),
  } as unknown as VeiculoRepository;
  const ordensRead = {
    countAtivasByVeiculoId: jest.fn().mockResolvedValue(opts.osCount ?? 0),
  } as unknown as OrdemServicoReadPort;
  return { uc: new InativarVeiculoUseCase(repo, ordensRead), repo };
}

describe('InativarVeiculoUseCase', () => {
  it('lança not found quando veículo inexistente', async () => {
    const { uc } = makeUc({ veiculo: null });
    await expect(uc.execute('v1')).rejects.toThrow(NotFoundException);
  });

  it('é idempotente quando já inativo', async () => {
    const { uc, repo } = makeUc({ veiculo: makeVeiculo(false) });
    await uc.execute('v1');
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('lança conflict quando há OS em andamento', async () => {
    const { uc, repo } = makeUc({ veiculo: makeVeiculo(), osCount: 1 });
    await expect(uc.execute('v1')).rejects.toThrow(ConflictException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('inativa quando sem OS pendentes', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    const { uc } = makeUc({
      veiculo: makeVeiculo(),
      osCount: 0,
      softDelete,
    });
    await uc.execute('v1');
    expect(softDelete).toHaveBeenCalledWith('v1');
  });
});
