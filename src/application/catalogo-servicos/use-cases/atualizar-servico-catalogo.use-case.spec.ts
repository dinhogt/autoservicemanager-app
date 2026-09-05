import { NotFoundException } from '@nestjs/common';
import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { AtualizarServicoCatalogoUseCase } from './atualizar-servico-catalogo.use-case';

const sample = new ServicoCatalogo(
  's1',
  'Troca de óleo',
  120,
  60,
  true,
  new Date(),
  new Date(),
);

describe('AtualizarServicoCatalogoUseCase', () => {
  function makeUc(repo: Partial<ServicoCatalogoRepository>) {
    return new AtualizarServicoCatalogoUseCase(
      repo as ServicoCatalogoRepository,
    );
  }

  it('lança not found quando inexistente', async () => {
    const uc = makeUc({ findById: jest.fn().mockResolvedValue(null) });
    await expect(uc.execute('s1', {} as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('retorna existente quando dto vazio', async () => {
    const update = jest.fn();
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    const result = await uc.execute('s1', {} as never);
    expect(result).toBe(sample);
    expect(update).not.toHaveBeenCalled();
  });

  it('aplica patch parcial', async () => {
    const update = jest.fn().mockResolvedValue(sample);
    const uc = makeUc({
      findById: jest.fn().mockResolvedValue(sample),
      update,
    });
    await uc.execute('s1', {
      precoBase: 200,
      tempoMedioExecucao: 90,
    } as never);
    expect(update).toHaveBeenCalledWith('s1', {
      precoBase: 200,
      tempoMedioExecucao: 90,
    });
  });
});
