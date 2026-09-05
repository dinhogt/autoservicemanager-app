import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AtualizarClienteUseCase,
  CadastrarClienteUseCase,
  InativarClienteUseCase,
  ListarClientesUseCase,
  ObterClienteUseCase,
} from '../../src/application/cadastro/use-cases';
import { Cliente } from '../../src/domain/cadastro/entities/cliente.entity';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { ClienteController } from '../../src/interfaces/http/modules/cadastro/cliente.controller';
import { buildControllerApp } from './utils/build-controller-app';

const sample = new Cliente(
  '11111111-1111-4111-8111-111111111111',
  'João',
  '52998224725',
  null,
  null,
  true,
  new Date(),
  new Date(),
);

describe('ClienteController (integration)', () => {
  let app: INestApplication;
  let mocks: {
    cadastrar: jest.Mock;
    listar: jest.Mock;
    obter: jest.Mock;
    atualizar: jest.Mock;
    inativar: jest.Mock;
  };

  beforeAll(async () => {
    mocks = {
      cadastrar: jest.fn().mockResolvedValue(sample),
      listar: jest.fn().mockResolvedValue({
        data: [sample],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      obter: jest.fn().mockResolvedValue(sample),
      atualizar: jest.fn().mockResolvedValue(sample),
      inativar: jest.fn().mockResolvedValue(undefined),
    };
    app = await buildControllerApp({
      controllers: [ClienteController],
      providers: [
        {
          provide: CadastrarClienteUseCase,
          useValue: { execute: mocks.cadastrar },
        },
        { provide: ListarClientesUseCase, useValue: { execute: mocks.listar } },
        { provide: ObterClienteUseCase, useValue: { execute: mocks.obter } },
        {
          provide: AtualizarClienteUseCase,
          useValue: { execute: mocks.atualizar },
        },
        {
          provide: InativarClienteUseCase,
          useValue: { execute: mocks.inativar },
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin/clientes sem autenticação retorna 403 (Forbidden)', async () => {
    await request(app.getHttpServer()).get('/admin/clientes').expect(403);
  });

  it('GET /admin/clientes com role ATENDENTE retorna lista', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/clientes')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
    expect(res.body.meta.total).toBe(1);
    expect(mocks.listar).toHaveBeenCalled();
  });

  it('GET /admin/clientes encaminha incluirInativos=true', async () => {
    await request(app.getHttpServer())
      .get('/admin/clientes')
      .query({ incluirInativos: 'true' })
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(200);
    const lastCall = mocks.listar.mock.calls.at(-1)!;
    expect(lastCall[1]).toEqual({ incluirInativos: true });
  });

  it('POST /admin/clientes valida dto inválido', async () => {
    await request(app.getHttpServer())
      .post('/admin/clientes')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({})
      .expect(400);
  });

  it('POST /admin/clientes cria com role válida', async () => {
    await request(app.getHttpServer())
      .post('/admin/clientes')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({ nome: 'João', cpfCnpj: '52998224725' })
      .expect(201);
    expect(mocks.cadastrar).toHaveBeenCalledWith({
      nome: 'João',
      cpfCnpj: '52998224725',
    });
  });

  it('DELETE /admin/clientes/:id requer role ADMIN ou GERENTE', async () => {
    await request(app.getHttpServer())
      .delete('/admin/clientes/11111111-1111-4111-8111-111111111111')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
  });

  it('DELETE /admin/clientes/:id como ADMIN inativa (204)', async () => {
    await request(app.getHttpServer())
      .delete('/admin/clientes/11111111-1111-4111-8111-111111111111')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(204);
    expect(mocks.inativar).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('GET /admin/clientes/:id rejeita UUID inválido (400)', async () => {
    await request(app.getHttpServer())
      .get('/admin/clientes/not-uuid')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(400);
  });

  it('GET /admin/clientes/:id retorna cliente', async () => {
    await request(app.getHttpServer())
      .get('/admin/clientes/11111111-1111-4111-8111-111111111111')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
    expect(mocks.obter).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('PATCH /admin/clientes/:id atualiza dados do cliente', async () => {
    await request(app.getHttpServer())
      .patch('/admin/clientes/11111111-1111-4111-8111-111111111111')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({ nome: 'João Atualizado' })
      .expect(200);
    expect(mocks.atualizar).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({ nome: 'João Atualizado' }),
    );
  });
});
