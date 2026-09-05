import { NotFoundException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { ObterVeiculoUseCase } from './obter-veiculo.use-case';

describe('ObterVeiculoUseCase', () => {
  const sample = new Veiculo(
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

  it('retorna veículo existente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(sample),
    } as unknown as VeiculoRepository;
    const uc = new ObterVeiculoUseCase(repo);
    expect(await uc.execute('v1')).toBe(sample);
  });

  it('lança not found quando inexistente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as VeiculoRepository;
    const uc = new ObterVeiculoUseCase(repo);
    await expect(uc.execute('zz')).rejects.toThrow(NotFoundException);
  });
});
