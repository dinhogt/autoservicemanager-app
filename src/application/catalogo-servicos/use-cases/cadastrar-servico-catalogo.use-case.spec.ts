import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { CadastrarServicoCatalogoUseCase } from './cadastrar-servico-catalogo.use-case';

describe('CadastrarServicoCatalogoUseCase', () => {
  it('cria serviço delegando ao repositório', async () => {
    const created = new ServicoCatalogo(
      's1',
      'Troca de óleo',
      120,
      60,
      true,
      new Date(),
      new Date(),
    );
    const create = jest.fn().mockResolvedValue(created);
    const repo = { create } as unknown as ServicoCatalogoRepository;
    const uc = new CadastrarServicoCatalogoUseCase(repo);
    const result = await uc.execute({
      descricao: 'Troca de óleo',
      precoBase: 120,
      tempoMedioExecucao: 60,
    } as never);
    expect(result).toBe(created);
    expect(create).toHaveBeenCalledWith({
      descricao: 'Troca de óleo',
      precoBase: 120,
      tempoMedioExecucao: 60,
    });
  });
});
