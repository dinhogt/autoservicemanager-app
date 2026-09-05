import { NotFoundException } from '@nestjs/common';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { ObterOrdemServicoUseCase } from './obter-ordem-servico.use-case';

describe('ObterOrdemServicoUseCase', () => {
  it('404 quando não existe', async () => {
    const ordens = mockOrdemServicoRepository({
      findDetailedById: jest.fn().mockResolvedValue(null),
    });
    const uc = new ObterOrdemServicoUseCase(ordens);
    await expect(uc.execute('x')).rejects.toThrow(NotFoundException);
  });

  it('retorna OS com includes', async () => {
    const os = { id: 'os1', itensServico: [], itensPeca: [] };
    const ordens = mockOrdemServicoRepository({
      findDetailedById: jest.fn().mockResolvedValue(os),
    });
    const uc = new ObterOrdemServicoUseCase(ordens);
    const result = await uc.execute('os1');
    expect(result).toEqual(os);
  });
});
