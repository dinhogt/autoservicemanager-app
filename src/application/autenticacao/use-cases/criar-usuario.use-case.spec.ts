import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { CriarUsuarioUseCase } from './criar-usuario.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pw'),
}));

describe('CriarUsuarioUseCase', () => {
  const now = new Date();
  const mockUser = {
    id: 'u1',
    nome: 'Novo',
    email: 'novo@test.com',
    senhaHash: 'hashed-pw',
    role: RoleAdmin.ATENDENTE,
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

  const useCase = new CriarUsuarioUseCase(repo);

  beforeEach(() => jest.clearAllMocks());

  it('cria usuário com sucesso e não retorna senhaHash', async () => {
    (repo.findByEmail as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await useCase.execute({
      nome: 'Novo',
      email: '  NOVO@TEST.COM  ',
      password: 'secret123',
    });

    expect(repo.findByEmail).toHaveBeenCalledWith('novo@test.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(repo.create).toHaveBeenCalledWith({
      nome: 'Novo',
      email: 'novo@test.com',
      senhaHash: 'hashed-pw',
      role: RoleAdmin.ATENDENTE,
    });
    expect(result).not.toHaveProperty('senhaHash');
    expect(result.nome).toBe('Novo');
  });

  it('cria usuário com role especificada', async () => {
    (repo.findByEmail as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: RoleAdmin.GERENTE,
    });

    await useCase.execute({
      nome: 'Gerente',
      email: 'g@test.com',
      password: 'secret123',
      role: RoleAdmin.GERENTE,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: RoleAdmin.GERENTE }),
    );
  });

  it('lança ConflictException se e-mail já existe', async () => {
    (repo.findByEmail as jest.Mock).mockResolvedValue(mockUser);

    await expect(
      useCase.execute({
        nome: 'Dup',
        email: 'novo@test.com',
        password: 'secret123',
      }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
