import { NotFoundException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { AtualizarVeiculoUseCase } from './atualizar-veiculo.use-case';

describe('AtualizarVeiculoUseCase', () => {
  const sample = new Veiculo(
    'v1',
    'c1',
    'ABC1D23',
    'Fiat',
    'Uno',
    2020,
    true,
    new Date(),
    new Date(),
  );

  function makeUc(repo: Partial<VeiculoRepository>) {
    return new AtualizarVeiculoUseCase(repo as VeiculoRepository);
  }

  it('lança not found quando inexistente', async () => {
    const uc = makeUc({ findById: jest.fn().mockResolvedValue(null) });
    await expect(uc.execute('v1', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retorna existente sem patch quando dto vazio', async () => {
    const update = jest.fn();
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    const result = await uc.execute('v1', {} as never);
    expect(result).toBe(sample);
    expect(update).not.toHaveBeenCalled();
  });

  it('aplica patch parcial preservando placa/clienteId', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('v1', { ano: 2023 } as never);
    expect(update).toHaveBeenCalledWith('v1', { ano: 2023 });
  });

  it('aceita marca/modelo nulos como alteração explícita', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('v1', { marca: null, modelo: null } as never);
    expect(update).toHaveBeenCalledWith('v1', { marca: null, modelo: null });
  });
});
