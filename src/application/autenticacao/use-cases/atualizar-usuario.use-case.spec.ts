import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { AtualizarUsuarioUseCase } from './atualizar-usuario.use-case';

describe('AtualizarUsuarioUseCase', () => {
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

  const useCase = new AtualizarUsuarioUseCase(repo);

  beforeEach(() => jest.clearAllMocks());

  it('atualiza nome com sucesso', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);
    (repo.update as jest.Mock).mockResolvedValue({ ...user, nome: 'Updated' });

    const result = await useCase.execute('u1', { nome: 'Updated' });

    expect(repo.update).toHaveBeenCalledWith('u1', { nome: 'Updated' });
    expect(result).not.toHaveProperty('senhaHash');
    expect(result.nome).toBe('Updated');
  });

  it('lança NotFoundException se usuário não existe', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute('not-found', { nome: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lança ConflictException se novo email já pertence a outro usuário', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);
    (repo.findByEmail as jest.Mock).mockResolvedValue({
      ...user,
      id: 'u2',
      email: 'other@b.com',
    });

    await expect(
      useCase.execute('u1', { email: 'other@b.com' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('permite atualizar para o próprio email', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);
    (repo.findByEmail as jest.Mock).mockResolvedValue(user);
    (repo.update as jest.Mock).mockResolvedValue(user);

    await useCase.execute('u1', { email: 'a@b.com' });

    expect(repo.update).toHaveBeenCalled();
  });
});
