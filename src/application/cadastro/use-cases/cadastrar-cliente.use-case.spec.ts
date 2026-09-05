import { ConflictException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CadastrarClienteUseCase } from './cadastrar-cliente.use-case';

describe('CadastrarClienteUseCase', () => {
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

  function makeUc(repo: Partial<ClienteRepository>) {
    return new CadastrarClienteUseCase(repo as ClienteRepository);
  }

  it('lança conflict quando CPF já existe', async () => {
    const uc = makeUc({
      findByCpfCnpj: jest.fn().mockResolvedValue(sample),
    });
    await expect(
      uc.execute({ nome: 'X', cpfCnpj: '52998224725' } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('cria cliente com CPF normalizado', async () => {
    const create = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findByCpfCnpj: jest.fn().mockResolvedValue(null),
      create,
    });
    const result = await uc.execute({
      nome: 'João',
      cpfCnpj: '529.982.247-25',
      contato: 'joao@example.com',
      enderecos: 'Rua A',
    } as never);
    expect(result).toBe(sample);
    expect(create).toHaveBeenCalledWith({
      nome: 'João',
      cpfCnpj: '52998224725',
      contato: 'joao@example.com',
      enderecos: 'Rua A',
    });
  });

  it('cria cliente com defaults nulos para contato/enderecos', async () => {
    const create = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findByCpfCnpj: jest.fn().mockResolvedValue(null),
      create,
    });
    await uc.execute({ nome: 'Y', cpfCnpj: '52998224725' } as never);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ contato: null, enderecos: null }),
    );
  });
});
