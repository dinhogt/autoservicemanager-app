import { NotFoundException } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { ObterServicoCatalogoUseCase } from './obter-servico-catalogo.use-case';

const sample = new ServicoCatalogo(
  's1',
  'Troca de óleo',
  120,
  60,
  true,
  new Date(),
  new Date(),
);

describe('ObterServicoCatalogoUseCase', () => {
  it('retorna serviço existente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(sample),
    } as unknown as ServicoCatalogoRepository;
    const uc = new ObterServicoCatalogoUseCase(repo);
    expect(await uc.execute('s1')).toBe(sample);
  });

  it('lança not found quando inexistente', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ServicoCatalogoRepository;
    const uc = new ObterServicoCatalogoUseCase(repo);
    await expect(uc.execute('zz')).rejects.toThrow(NotFoundException);
  });
});
