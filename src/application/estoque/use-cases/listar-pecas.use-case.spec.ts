import { PecaEstoque } from '../../../domain/estoque/entities/peca-estoque.entity';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ListarPecasUseCase } from './listar-pecas.use-case';

function pagination(page: number, limit: number): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  return dto;
}

const sample = new PecaEstoque(
  'p1',
  'Filtro',
  50,
  10,
  'CODE-1',
  true,
  new Date(),
  new Date(),
);

describe('ListarPecasUseCase', () => {
  it('lista peças ativas por padrão', async () => {
    const findAll = jest.fn().mockResolvedValue([sample]);
    const count = jest.fn().mockResolvedValue(1);
    const repo = { findAll, count } as unknown as PecaEstoqueRepository;
    const uc = new ListarPecasUseCase(repo);
    const result = await uc.execute(pagination(1, 10));
    expect(findAll).toHaveBeenCalledWith(
      { skip: 0, take: 10 },
      { incluirInativos: false },
    );
    expect(count).toHaveBeenCalledWith({ incluirInativos: false });
    expect(result.data).toEqual([sample]);
  });

  it('encaminha incluirInativos quando solicitado', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const repo = { findAll, count } as unknown as PecaEstoqueRepository;
    const uc = new ListarPecasUseCase(repo);
    await uc.execute(pagination(1, 5), { incluirInativos: true });
    expect(findAll).toHaveBeenCalledWith(expect.any(Object), {
      incluirInativos: true,
    });
  });
});
