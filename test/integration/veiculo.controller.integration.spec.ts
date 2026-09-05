import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AtualizarVeiculoUseCase,
  CadastrarVeiculoUseCase,
  InativarVeiculoUseCase,
  ListarVeiculosUseCase,
  ObterVeiculoUseCase,
} from '../../src/application/cadastro/use-cases';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { VeiculoController } from '../../src/interfaces/http/modules/cadastro/veiculo.controller';
import { buildControllerApp } from './utils/build-controller-app';

const VEICULO_ID = '33333333-3333-4333-8333-333333333333';

describe('VeiculoController (integration)', () => {
  let app: INestApplication;
  const mocks = {
    cadastrar: jest.fn().mockResolvedValue({ id: VEICULO_ID }),
    listar: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }),
    obter: jest.fn().mockResolvedValue({ id: VEICULO_ID }),
    atualizar: jest.fn().mockResolvedValue({ id: VEICULO_ID }),
    inativar: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [VeiculoController],
      providers: [
        {
          provide: CadastrarVeiculoUseCase,
          useValue: { execute: mocks.cadastrar },
        },
        { provide: ListarVeiculosUseCase, useValue: { execute: mocks.listar } },
        { provide: ObterVeiculoUseCase, useValue: { execute: mocks.obter } },
        {
          provide: AtualizarVeiculoUseCase,
          useValue: { execute: mocks.atualizar },
        },
        {
          provide: InativarVeiculoUseCase,
          useValue: { execute: mocks.inativar },
        },
      ],
    });
  });

  afterAll(async () => app.close());

  it('GET /admin/veiculos sem JWT retorna 403', async () => {
    await request(app.getHttpServer()).get('/admin/veiculos').expect(403);
  });

  it('GET /admin/veiculos com ATENDENTE filtra por clienteId', async () => {
    await request(app.getHttpServer())
      .get('/admin/veiculos')
      .query({ clienteId: VEICULO_ID })
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
    expect(mocks.listar).toHaveBeenCalled();
    const lastCall = mocks.listar.mock.calls.at(-1)!;
    expect(lastCall[1]).toBe(VEICULO_ID);
  });

  it('DELETE /admin/veiculos/:id requer ADMIN/GERENTE', async () => {
    await request(app.getHttpServer())
      .delete(`/admin/veiculos/${VEICULO_ID}`)
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/admin/veiculos/${VEICULO_ID}`)
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(204);
    expect(mocks.inativar).toHaveBeenCalledWith(VEICULO_ID);
  });

  it('POST /admin/veiculos cria veículo', async () => {
    await request(app.getHttpServer())
      .post('/admin/veiculos')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({
        clienteId: '11111111-1111-4111-8111-111111111111',
        placa: 'ABC1D23',
      })
      .expect(201);
    expect(mocks.cadastrar).toHaveBeenCalled();
  });

  it('GET /admin/veiculos/:id retorna veículo', async () => {
    await request(app.getHttpServer())
      .get(`/admin/veiculos/${VEICULO_ID}`)
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
    expect(mocks.obter).toHaveBeenCalledWith(VEICULO_ID);
  });

  it('PATCH /admin/veiculos/:id atualiza dados do veículo', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/veiculos/${VEICULO_ID}`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .send({ marca: 'Honda' })
      .expect(200);
    expect(mocks.atualizar).toHaveBeenCalledWith(
      VEICULO_ID,
      expect.objectContaining({ marca: 'Honda' }),
    );
  });
});
