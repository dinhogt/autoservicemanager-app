import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AtualizarServicoCatalogoUseCase,
  CadastrarServicoCatalogoUseCase,
  InativarServicoCatalogoUseCase,
  ListarServicosCatalogoUseCase,
  ObterServicoCatalogoUseCase,
} from '../../src/application/catalogo-servicos/use-cases';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { ServicoCatalogoController } from '../../src/interfaces/http/modules/catalogo-servicos/servico-catalogo.controller';
import { buildControllerApp } from './utils/build-controller-app';

const SERV_ID = '55555555-5555-4555-8555-555555555555';

describe('ServicoCatalogoController (integration)', () => {
  let app: INestApplication;
  const mocks = {
    cadastrar: jest.fn().mockResolvedValue({ id: SERV_ID }),
    listar: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }),
    obter: jest.fn().mockResolvedValue({ id: SERV_ID }),
    atualizar: jest.fn().mockResolvedValue({ id: SERV_ID }),
    inativar: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [ServicoCatalogoController],
      providers: [
        {
          provide: CadastrarServicoCatalogoUseCase,
          useValue: { execute: mocks.cadastrar },
        },
        {
          provide: ListarServicosCatalogoUseCase,
          useValue: { execute: mocks.listar },
        },
        {
          provide: ObterServicoCatalogoUseCase,
          useValue: { execute: mocks.obter },
        },
        {
          provide: AtualizarServicoCatalogoUseCase,
          useValue: { execute: mocks.atualizar },
        },
        {
          provide: InativarServicoCatalogoUseCase,
          useValue: { execute: mocks.inativar },
        },
      ],
    });
  });

  afterAll(async () => app.close());

  it('GET /admin/servicos como ATENDENTE retorna 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/servicos')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
  });

  it('GET /admin/servicos como GERENTE retorna 200', async () => {
    await request(app.getHttpServer())
      .get('/admin/servicos')
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(200);
  });

  it('POST /admin/servicos cria com role ADMIN', async () => {
    await request(app.getHttpServer())
      .post('/admin/servicos')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({
        descricao: 'Troca de óleo',
        precoBase: 100,
        tempoMedioExecucao: 60,
      })
      .expect(201);
    expect(mocks.cadastrar).toHaveBeenCalledWith(
      expect.objectContaining({ descricao: 'Troca de óleo' }),
    );
  });

  it('DELETE /admin/servicos/:id como ADMIN retorna 204', async () => {
    await request(app.getHttpServer())
      .delete(`/admin/servicos/${SERV_ID}`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(204);
    expect(mocks.inativar).toHaveBeenCalledWith(SERV_ID);
  });
});
