import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AtualizarPecaUseCase,
  CadastrarPecaUseCase,
  InativarPecaUseCase,
  ListarPecasUseCase,
  MovimentarEstoquePecaUseCase,
  ObterPecaUseCase,
} from '../../src/application/estoque/use-cases';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { PecaController } from '../../src/interfaces/http/modules/estoque/peca.controller';
import { buildControllerApp } from './utils/build-controller-app';

const PECA_ID = '44444444-4444-4444-8444-444444444444';

describe('PecaController (integration)', () => {
  let app: INestApplication;
  const mocks = {
    cadastrar: jest.fn().mockResolvedValue({ id: PECA_ID }),
    listar: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }),
    obter: jest.fn().mockResolvedValue({ id: PECA_ID }),
    atualizar: jest.fn().mockResolvedValue({ id: PECA_ID }),
    movimentar: jest
      .fn()
      .mockResolvedValue({ id: PECA_ID, quantidadeEmEstoque: 5 }),
    inativar: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [PecaController],
      providers: [
        {
          provide: CadastrarPecaUseCase,
          useValue: { execute: mocks.cadastrar },
        },
        { provide: ListarPecasUseCase, useValue: { execute: mocks.listar } },
        { provide: ObterPecaUseCase, useValue: { execute: mocks.obter } },
        {
          provide: AtualizarPecaUseCase,
          useValue: { execute: mocks.atualizar },
        },
        {
          provide: MovimentarEstoquePecaUseCase,
          useValue: { execute: mocks.movimentar },
        },
        { provide: InativarPecaUseCase, useValue: { execute: mocks.inativar } },
      ],
    });
  });

  afterAll(async () => app.close());

  it('Roles do controller: ATENDENTE/MECANICO recebem 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/pecas')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
    await request(app.getHttpServer())
      .get('/admin/pecas')
      .set('x-test-user-role', RoleAdmin.MECANICO)
      .expect(403);
  });

  it('GET /admin/pecas com ADMIN retorna 200', async () => {
    await request(app.getHttpServer())
      .get('/admin/pecas')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(200);
  });

  it('POST /admin/pecas/:id/movimentacoes valida dto', async () => {
    await request(app.getHttpServer())
      .post(`/admin/pecas/${PECA_ID}/movimentacoes`)
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .send({ tipo: 'INVALIDO', quantidade: 0 })
      .expect(400);
  });

  it('POST /admin/pecas/:id/movimentacoes aceita dto válido', async () => {
    await request(app.getHttpServer())
      .post(`/admin/pecas/${PECA_ID}/movimentacoes`)
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .send({ tipo: 'entrada', quantidade: 5 })
      .expect(201);
    expect(mocks.movimentar).toHaveBeenCalledWith(
      PECA_ID,
      expect.objectContaining({ tipo: 'entrada', quantidade: 5 }),
    );
  });

  it('DELETE /admin/pecas/:id como GERENTE retorna 204', async () => {
    await request(app.getHttpServer())
      .delete(`/admin/pecas/${PECA_ID}`)
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(204);
    expect(mocks.inativar).toHaveBeenCalledWith(PECA_ID);
  });

  it('POST /admin/pecas cria peça', async () => {
    await request(app.getHttpServer())
      .post('/admin/pecas')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({
        descricao: 'Filtro novo',
        precoUnitario: 50,
        quantidadeEmEstoque: 10,
        codigoInterno: 'FLT-001',
      })
      .expect(201);
    expect(mocks.cadastrar).toHaveBeenCalled();
  });

  it('GET /admin/pecas/:id retorna peça', async () => {
    await request(app.getHttpServer())
      .get(`/admin/pecas/${PECA_ID}`)
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(200);
    expect(mocks.obter).toHaveBeenCalledWith(PECA_ID);
  });

  it('PATCH /admin/pecas/:id atualiza dados da peça', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/pecas/${PECA_ID}`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({ descricao: 'Filtro atualizado' })
      .expect(200);
    expect(mocks.atualizar).toHaveBeenCalledWith(
      PECA_ID,
      expect.objectContaining({ descricao: 'Filtro atualizado' }),
    );
  });
});
