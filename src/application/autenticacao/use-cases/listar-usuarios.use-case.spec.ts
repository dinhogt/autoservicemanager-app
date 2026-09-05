import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { ListarUsuariosUseCase } from './listar-usuarios.use-case';

describe('ListarUsuariosUseCase', () => {
  const now = new Date();
  const users = [
    {
      id: 'u1',
      nome: 'Admin',
      email: 'a@b.com',
      senhaHash: 'hash',
      role: RoleAdmin.ADMIN,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const repo: UsuarioAdminRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue(users),
    count: jest.fn().mockResolvedValue(1),
    create: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new ListarUsuariosUseCase(repo);

  beforeEach(() => jest.clearAllMocks());

  it('retorna lista paginada sem senhaHash', async () => {
    (repo.findAll as jest.Mock).mockResolvedValue(users);
    (repo.count as jest.Mock).mockResolvedValue(1);

    const pagination = new PaginationDto();
    pagination.page = 1;
    pagination.limit = 20;

    const result = await useCase.execute(pagination);

    expect(repo.findAll).toHaveBeenCalledWith({ skip: 0, take: 20 });
    expect(repo.count).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).not.toHaveProperty('senhaHash');
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });
});
