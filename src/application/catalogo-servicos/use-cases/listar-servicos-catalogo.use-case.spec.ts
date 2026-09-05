import { ServicoCatalogo } from '../../../domain/catalogo-servicos/entities/servico-catalogo.entity';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ListarServicosCatalogoUseCase } from './listar-servicos-catalogo.use-case';

function pagination(page: number, limit: number): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  return dto;
}

const sample = new ServicoCatalogo(
  's1',
  'Troca de óleo',
  120,
  60,
  true,
  new Date(),
  new Date(),
);

describe('ListarServicosCatalogoUseCase', () => {
  it('lista serviços ativos por padrão', async () => {
    const findAll = jest.fn().mockResolvedValue([sample]);
    const count = jest.fn().mockResolvedValue(1);
    const repo = { findAll, count } as unknown as ServicoCatalogoRepository;
    const uc = new ListarServicosCatalogoUseCase(repo);
    const result = await uc.execute(pagination(1, 10));
    expect(findAll).toHaveBeenCalledWith(
      { skip: 0, take: 10 },
      { incluirInativos: false },
    );
    expect(count).toHaveBeenCalledWith({ incluirInativos: false });
    expect(result.data).toEqual([sample]);
    expect(result.meta.totalPages).toBe(1);
  });

  it('encaminha incluirInativos quando solicitado', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const repo = { findAll, count } as unknown as ServicoCatalogoRepository;
    const uc = new ListarServicosCatalogoUseCase(repo);
    await uc.execute(pagination(1, 5), { incluirInativos: true });
    expect(findAll).toHaveBeenCalledWith(expect.any(Object), {
      incluirInativos: true,
    });
  });
});
