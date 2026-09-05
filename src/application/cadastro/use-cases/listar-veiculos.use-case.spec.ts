import { BadRequestException } from '@nestjs/common';
import { Veiculo } from '../../../domain/cadastro/entities/veiculo.entity';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ListarVeiculosUseCase } from './listar-veiculos.use-case';

function pagination(page: number, limit: number): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  return dto;
}

const sample = new Veiculo(
  'v1',
  'c1',
  'ABC1D23',
  null,
  null,
  null,
  true,
  new Date(),
  new Date(),
);

describe('ListarVeiculosUseCase', () => {
  function makeRepo(overrides: Partial<VeiculoRepository> = {}) {
    return {
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      ...overrides,
    } as unknown as VeiculoRepository;
  }

  it('retorna lista paginada quando sem clienteId', async () => {
    const repo = makeRepo({
      findAll: jest.fn().mockResolvedValue([sample]),
      count: jest.fn().mockResolvedValue(5),
    });
    const uc = new ListarVeiculosUseCase(repo);
    const result = await uc.execute(pagination(1, 2));
    expect(repo.findAll).toHaveBeenCalledWith(
      { skip: 0, take: 2 },
      { incluirInativos: false },
    );
    expect(result.meta).toEqual({ total: 5, page: 1, limit: 2, totalPages: 3 });
  });

  it('lança bad request quando clienteId não é UUID', async () => {
    const uc = new ListarVeiculosUseCase(makeRepo());
    await expect(uc.execute(pagination(1, 10), 'nao-uuid')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('filtra por clienteId quando UUID válido', async () => {
    const findByClienteId = jest.fn().mockResolvedValue([sample]);
    const repo = makeRepo({ findByClienteId });
    const uc = new ListarVeiculosUseCase(repo);
    const uuid = '11111111-1111-4111-8111-111111111111';
    const result = await uc.execute(pagination(2, 5), uuid, {
      incluirInativos: true,
    });
    expect(findByClienteId).toHaveBeenCalledWith(uuid, {
      incluirInativos: true,
    });
    expect(result.data).toEqual([sample]);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('considera clienteId vazio como ausente', async () => {
    const repo = makeRepo();
    const uc = new ListarVeiculosUseCase(repo);
    await uc.execute(pagination(1, 1), '');
    expect(repo.findByClienteId).not.toHaveBeenCalled();
    expect(repo.findAll).toHaveBeenCalled();
  });
});
