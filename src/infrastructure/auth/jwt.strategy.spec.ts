import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RoleAdmin } from '../../domain/autenticacao/entities/usuario-admin.entity';
import { USUARIO_ADMIN_REPOSITORY } from '../../domain/autenticacao/repositories/usuario-admin.repository';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const findById = jest.fn();
  const repo = {
    findById,
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  let strategy: JwtStrategy;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
        { provide: USUARIO_ADMIN_REPOSITORY, useValue: repo },
      ],
    }).compile();

    strategy = moduleRef.get(JwtStrategy);
  });

  it('retorna userId/email/role quando usuário existe e está ativo', async () => {
    findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      role: RoleAdmin.ADMIN,
      ativo: true,
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'a@b.com',
        role: RoleAdmin.ADMIN,
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'a@b.com',
      role: RoleAdmin.ADMIN,
    });
  });

  it('lança UnauthorizedException quando usuário não existe no DB', async () => {
    findById.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'removed',
        email: 'x@y.com',
        role: RoleAdmin.ADMIN,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando usuário está desativado', async () => {
    findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      role: RoleAdmin.ADMIN,
      ativo: false,
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'a@b.com',
        role: RoleAdmin.ADMIN,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
