import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RoleAdmin } from '../../../domain/autenticacao/entities/usuario-admin.entity';
import type { UsuarioAdminRepository } from '../../../domain/autenticacao/repositories/usuario-admin.repository';
import { LoginAdminUseCase } from './login-admin.use-case';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('LoginAdminUseCase', () => {
  const user = {
    id: 'u1',
    nome: 'Admin',
    email: 'a@b.com',
    senhaHash: 'hash',
    role: RoleAdmin.ADMIN,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const findByEmail = jest.fn();
  const repo: UsuarioAdminRepository = {
    findByEmail,
    findById: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const signAsync = jest.fn().mockResolvedValue('jwt-token');
  const jwtService = {
    signAsync,
  } as unknown as JwtService;

  const useCase = new LoginAdminUseCase(repo, jwtService);
  const compare = bcrypt.compare as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna token e usuário quando credenciais corretas', async () => {
    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: '  A@B.COM ',
      password: 'secret',
    });

    expect(findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(result.access_token).toBe('jwt-token');
    expect(result.token_type).toBe('Bearer');
    expect(result.expires_in).toBe(8 * 60 * 60);
    expect(result.user).toEqual({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    });
  });

  it('401 quando usuário não existe', async () => {
    findByEmail.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'x@y.com', password: 'p' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('401 quando senha incorreta', async () => {
    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(false);
    await expect(
      useCase.execute({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('401 quando usuário está inativo', async () => {
    findByEmail.mockResolvedValue({ ...user, ativo: false });
    await expect(
      useCase.execute({ email: 'a@b.com', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(compare).not.toHaveBeenCalled();
  });
});
