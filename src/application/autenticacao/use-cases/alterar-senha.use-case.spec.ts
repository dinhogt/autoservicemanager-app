import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { AlterarSenhaUseCase } from './alterar-senha.use-case';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('new-hash'),
}));

describe('AlterarSenhaUseCase', () => {
  const now = new Date();
  const user = {
    id: 'u1',
    nome: 'Admin',
    email: 'a@b.com',
    senhaHash: 'old-hash',
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

  const useCase = new AlterarSenhaUseCase(repo);
  const compare = bcrypt.compare as jest.Mock;

  beforeEach(() => jest.clearAllMocks());

  it('altera senha com sucesso', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);
    compare.mockResolvedValue(true);

    await useCase.execute('u1', {
      currentPassword: 'old-pass',
      newPassword: 'new-pass123',
    });

    expect(compare).toHaveBeenCalledWith('old-pass', 'old-hash');
    expect(bcrypt.hash).toHaveBeenCalledWith('new-pass123', 10);
    expect(repo.update).toHaveBeenCalledWith('u1', { senhaHash: 'new-hash' });
  });

  it('lança NotFoundException se usuário não existe', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute('not-found', {
        currentPassword: 'x',
        newPassword: 'y',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança UnauthorizedException se senha atual incorreta', async () => {
    (repo.findById as jest.Mock).mockResolvedValue(user);
    compare.mockResolvedValue(false);

    await expect(
      useCase.execute('u1', {
        currentPassword: 'wrong',
        newPassword: 'new-pass123',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
