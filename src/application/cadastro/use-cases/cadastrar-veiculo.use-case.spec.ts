import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { CadastrarVeiculoUseCase } from './cadastrar-veiculo.use-case';

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

function makeUc(opts: {
  cliente?: Cliente | null;
  duplicado?: Veiculo | null;
  create?: jest.Mock;
}) {
  const clientes = {
    findById: jest.fn().mockResolvedValue(opts.cliente ?? null),
  } as unknown as ClienteRepository;
  const veiculos = {
    findByPlaca: jest.fn().mockResolvedValue(opts.duplicado ?? null),
    create: opts.create ?? jest.fn(),
  } as unknown as VeiculoRepository;
  return {
    uc: new CadastrarVeiculoUseCase(clientes, veiculos),
    veiculos,
  };
}

describe('CadastrarVeiculoUseCase', () => {
  it('lança not found quando cliente inexistente', async () => {
    const { uc } = makeUc({ cliente: null });
    await expect(
      uc.execute({ clienteId: 'x', placa: 'ABC1D23' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança bad request quando cliente inativo', async () => {
    const { uc } = makeUc({ cliente: makeCliente(false) });
    await expect(
      uc.execute({ clienteId: 'c1', placa: 'ABC1D23' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('lança conflict quando placa já existe', async () => {
    const dup = new Veiculo(
      'v1',
      'c1',
      'ABC1D23',
      null,
      null,
      null,
      true,
      new Date(),
      new Date(),
    );
    const { uc } = makeUc({ cliente: makeCliente(), duplicado: dup });
    await expect(
      uc.execute({ clienteId: 'c1', placa: 'ABC-1D23' } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('cria veículo com placa normalizada e defaults', async () => {
    const created = new Veiculo(
      'v1',
      'c1',
      'ABC1D23',
      null,
      null,
      null,
      true,
      new Date(),
      new Date(),
    );
    const create = jest.fn().mockResolvedValue(created);
    const { uc } = makeUc({ cliente: makeCliente(), create });
    const result = await uc.execute({
      clienteId: 'c1',
      placa: 'abc-1d23',
    } as never);
    expect(result).toBe(created);
    expect(create).toHaveBeenCalledWith({
      clienteId: 'c1',
      placa: 'ABC1D23',
      marca: null,
      modelo: null,
      ano: null,
    });
  });

  it('preserva marca, modelo e ano informados', async () => {
    const create = jest.fn().mockResolvedValue({} as Veiculo);
    const { uc } = makeUc({ cliente: makeCliente(), create });
    await uc.execute({
      clienteId: 'c1',
      placa: 'ABC1D23',
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    } as never);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ marca: 'Fiat', modelo: 'Uno', ano: 2020 }),
    );
  });
});
