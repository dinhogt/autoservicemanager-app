import { NotFoundException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { ObterClienteUseCase } from './obter-cliente.use-case';

describe('ObterClienteUseCase', () => {
  const sample = new Cliente(
    'c1',
    'João',
    '52998224725',
    null,
    null,
    true,
    new Date(),
    new Date(),
  );

  it('retorna cliente existente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(sample),
    } as unknown as ClienteRepository;
    const uc = new ObterClienteUseCase(repo);
    const result = await uc.execute('c1');
    expect(result).toBe(sample);
    expect(repo.findById).toHaveBeenCalledWith('c1');
  });

  it('lança not found quando inexistente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ClienteRepository;
    const uc = new ObterClienteUseCase(repo);
    await expect(uc.execute('zz')).rejects.toThrow(NotFoundException);
  });
});
