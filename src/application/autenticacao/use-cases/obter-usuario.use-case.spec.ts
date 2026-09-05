import { NotFoundException } from '@nestjs/common';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { ObterUsuarioUseCase } from './obter-usuario.use-case';

describe('ObterUsuarioUseCase', () => {
  const now = new Date();
  const user = {
    id: 'u1',
    nome: 'Admin',
    email: 'a@b.com',
    senhaHash: 'hash',
    role: RoleAdmin.ADMIN,
    ativo: true,
    createdAt: now,
    updatedAt: now,
  };

  const repo: UsuarioAdminRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new ObterUsuarioUseCase(repo);

  beforeEach(() => jest.clearAllMocks());

  it('retorna usuário sem senhaHash', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);

    const result = await useCase.execute('u1');

    expect(repo.findById).toHaveBeenCalledWith('u1');
    expect(result).not.toHaveProperty('senhaHash');
    expect(result.id).toBe('u1');
  });

  it('lança NotFoundException se não encontrado', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute('not-found')).rejects.toThrow(
      NotFoundException,
    );
  });
});
