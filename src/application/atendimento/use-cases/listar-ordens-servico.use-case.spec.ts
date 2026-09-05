import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { ListarOrdensServicoUseCase } from './listar-ordens-servico.use-case';

function pagination(page: number, limit: number): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  return dto;
}

describe('ListarOrdensServicoUseCase', () => {
  it('lista ordens ativas com paginação e calcula totalPages', async () => {
    const listarAtivasParaPainel = jest.fn().mockResolvedValue([{ id: 'os1' }]);
    const countAtivasParaPainel = jest.fn().mockResolvedValue(11);
    const ordens = mockOrdemServicoRepository({
      listarAtivasParaPainel,
      countAtivasParaPainel,
    });
    const uc = new ListarOrdensServicoUseCase(ordens);
    const result = await uc.execute(pagination(2, 5));
    expect(listarAtivasParaPainel).toHaveBeenCalledWith({ skip: 5, take: 5 });
    expect(countAtivasParaPainel).toHaveBeenCalled();
    expect(result.data).toEqual([{ id: 'os1' }]);
    expect(result.meta).toEqual({
      total: 11,
      page: 2,
      limit: 5,
      totalPages: 3,
    });
  });
});
