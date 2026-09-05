import { NotFoundException } from '@nestjs/common';
import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { AtualizarClienteUseCase } from './atualizar-cliente.use-case';

describe('AtualizarClienteUseCase', () => {
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
    return new AtualizarClienteUseCase(repo as ClienteRepository);
  }

  it('lança not found quando cliente inexistente', async () => {
    const uc = makeUc({ findById: jest.fn().mockResolvedValue(null) });
    await expect(uc.execute('id', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retorna existente quando dto não traz alterações', async () => {
    const update = jest.fn();
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    const result = await uc.execute('c1', {} as never);
    expect(result).toBe(sample);
    expect(update).not.toHaveBeenCalled();
  });

  it('encaminha apenas campos definidos para o repositório', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('c1', {
      nome: 'Maria',
      contato: 'm@x.com',
    } as never);
    expect(update).toHaveBeenCalledWith('c1', {
      nome: 'Maria',
      contato: 'm@x.com',
    });
  });

  it('aceita contato/enderecos = null como alteração explícita', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('c1', { contato: null, enderecos: null } as never);
    expect(update).toHaveBeenCalledWith('c1', {
      contato: null,
      enderecos: null,
    });
  });
});
