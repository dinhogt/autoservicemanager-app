import { Cliente } from '../../../domain/cadastro/entities/cliente.entity';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ListarClientesUseCase } from './listar-clientes.use-case';

function pagination(page: number, limit: number): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  return dto;
}

describe('ListarClientesUseCase', () => {
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

  it('lista clientes ativos por padrão e calcula meta', async () => {
    const findAll = jest.fn().mockResolvedValue([sample]);
    const count = jest.fn().mockResolvedValue(3);
    const repo = { findAll, count } as unknown as ClienteRepository;
    const uc = new ListarClientesUseCase(repo);
    const result = await uc.execute(pagination(2, 1));
    expect(findAll).toHaveBeenCalledWith(
      { skip: 1, take: 1 },
      { incluirInativos: false },
    );
    expect(count).toHaveBeenCalledWith({ incluirInativos: false });
    expect(result.data).toEqual([sample]);
    expect(result.meta).toEqual({ total: 3, page: 2, limit: 1, totalPages: 3 });
  });

  it('encaminha incluirInativos quando solicitado', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const repo = { findAll, count } as unknown as ClienteRepository;
    const uc = new ListarClientesUseCase(repo);
    await uc.execute(pagination(1, 10), { incluirInativos: true });
    expect(findAll).toHaveBeenCalledWith(expect.any(Object), {
      incluirInativos: true,
    });
    expect(count).toHaveBeenCalledWith({ incluirInativos: true });
  });
});
