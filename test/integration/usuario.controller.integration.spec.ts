import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AlterarSenhaUseCase,
  AtualizarUsuarioUseCase,
  CriarUsuarioUseCase,
  ListarUsuariosUseCase,
  ObterUsuarioUseCase,
} from '../../src/application/autenticacao/use-cases';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { UsuarioController } from '../../src/interfaces/http/modules/auth/usuario.controller';
import {
  buildControllerApp,
  TestJwtAuthGuard,
} from './utils/build-controller-app';

const USER_ID = '66666666-6666-4666-8666-666666666666';

describe('UsuarioController (integration)', () => {
  let app: INestApplication;
  const mocks = {
    criar: jest.fn().mockResolvedValue({ id: USER_ID }),
    listar: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }),
    obter: jest.fn().mockResolvedValue({ id: USER_ID }),
    atualizar: jest.fn().mockResolvedValue({ id: USER_ID }),
    alterarSenha: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [UsuarioController],
      providers: [
        { provide: CriarUsuarioUseCase, useValue: { execute: mocks.criar } },
        { provide: ListarUsuariosUseCase, useValue: { execute: mocks.listar } },
        { provide: ObterUsuarioUseCase, useValue: { execute: mocks.obter } },
        {
          provide: AtualizarUsuarioUseCase,
          useValue: { execute: mocks.atualizar },
        },
        {
          provide: AlterarSenhaUseCase,
          useValue: { execute: mocks.alterarSenha },
        },
      ],
    });
  });

  afterAll(async () => app.close());

  it('POST /admin/usuarios sem JWT retorna 403', async () => {
    await request(app.getHttpServer()).post('/admin/usuarios').expect(403);
  });

  it('POST /admin/usuarios não permite GERENTE', async () => {
    await request(app.getHttpServer())
      .post('/admin/usuarios')
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .send({})
      .expect(403);
  });

  it('GET /admin/usuarios como GERENTE retorna 200', async () => {
    await request(app.getHttpServer())
      .get('/admin/usuarios')
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(200);
  });

  it('PATCH /admin/usuarios/:id/senha bloqueia outro user não-ADMIN', async () => {
    // injeta user com role ATENDENTE e id diferente
    const guardSpy = jest
      .spyOn(TestJwtAuthGuard.prototype, 'canActivate')
      .mockImplementationOnce((ctx) => {
        const req = ctx.switchToHttp().getRequest<{ user?: unknown }>();
        req.user = {
          userId: 'other-user',
          email: 'a@b',
          role: RoleAdmin.ATENDENTE,
        };
        return true;
      });
    await request(app.getHttpServer())
      .patch(`/admin/usuarios/${USER_ID}/senha`)
      .send({ currentPassword: 'Old@1234', newPassword: 'New@1234' })
      .expect(403);
    guardSpy.mockRestore();
  });

  it('PATCH /admin/usuarios/:id/senha permite ADMIN sobre outro user', async () => {
    const guardSpy = jest
      .spyOn(TestJwtAuthGuard.prototype, 'canActivate')
      .mockImplementationOnce((ctx) => {
        const req = ctx.switchToHttp().getRequest<{ user?: unknown }>();
        req.user = {
          userId: 'admin-id',
          email: 'admin@b',
          role: RoleAdmin.ADMIN,
        };
        return true;
      });
    await request(app.getHttpServer())
      .patch(`/admin/usuarios/${USER_ID}/senha`)
      .send({ currentPassword: 'Old@1234', newPassword: 'New@1234' })
      .expect(200);
    expect(mocks.alterarSenha).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ newPassword: 'New@1234' }),
    );
    guardSpy.mockRestore();
  });

  it('POST /admin/usuarios como ADMIN cria usuário (201)', async () => {
    await request(app.getHttpServer())
      .post('/admin/usuarios')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({
        nome: 'Teste',
        email: 'teste@test.com',
        password: 'Senha@1234',
        role: 'ATENDENTE',
      })
      .expect(201);
    expect(mocks.criar).toHaveBeenCalled();
  });

  it('GET /admin/usuarios/:id retorna dados do usuário', async () => {
    await request(app.getHttpServer())
      .get(`/admin/usuarios/${USER_ID}`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(200);
    expect(mocks.obter).toHaveBeenCalledWith(USER_ID);
  });

  it('PATCH /admin/usuarios/:id como ADMIN atualiza dados', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/usuarios/${USER_ID}`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({ nome: 'Novo Nome' })
      .expect(200);
    expect(mocks.atualizar).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ nome: 'Novo Nome' }),
    );
  });
});
