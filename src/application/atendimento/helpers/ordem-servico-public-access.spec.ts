import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { carregarOrdemServicoComValidacaoPublica } from './ordem-servico-public-access';

describe('carregarOrdemServicoComValidacaoPublica', () => {
  const osBase = {
    id: 'os-1',
    status: StatusOs.RECEBIDA,
    cliente: { cpfCnpj: '52998224725' },
    veiculo: { placa: 'ABC1D23' },
  };

  it('exige cpfCnpj ou placa', async () => {
    const findWithClienteVeiculoById = jest.fn();
    const ordens = mockOrdemServicoRepository({ findWithClienteVeiculoById });
    await expect(
      carregarOrdemServicoComValidacaoPublica(ordens, 'os-1', {} as never),
    ).rejects.toThrow(BadRequestException);
    expect(findWithClienteVeiculoById).not.toHaveBeenCalled();
  });

  it('404 quando OS não existe', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(null),
    });
    await expect(
      carregarOrdemServicoComValidacaoPublica(ordens, 'x', {
        cpfCnpj: '52998224725',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('retorna OS quando CPF confere', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osBase),
    });
    const result = await carregarOrdemServicoComValidacaoPublica(
      ordens,
      'os-1',
      {
        cpfCnpj: '529.982.247-25',
      },
    );
    expect(result.id).toBe('os-1');
  });

  it('404 quando CPF não confere (não revela existência)', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osBase),
    });
    await expect(
      carregarOrdemServicoComValidacaoPublica(ordens, 'os-1', {
        cpfCnpj: '11222333000181',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('retorna OS quando placa confere', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osBase),
    });
    const result = await carregarOrdemServicoComValidacaoPublica(
      ordens,
      'os-1',
      {
        placa: 'abc-1d23',
      },
    );
    expect(result.veiculo.placa).toBe('ABC1D23');
  });

  it('422 quando CPF no query é inválido', async () => {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(osBase),
    });
    await expect(
      carregarOrdemServicoComValidacaoPublica(ordens, 'os-1', {
        cpfCnpj: '11111111111',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});
