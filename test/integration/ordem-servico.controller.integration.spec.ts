import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AprovarOrcamentoUseCase,
  ConsultarStatusOsUseCase,
  CriarOrdemServicoUseCase,
  EntregarVeiculoUseCase,
  FinalizarOsUseCase,
  GerarOrcamentoUseCase,
  IniciarDiagnosticoUseCase,
  ListarHistoricoOsUseCase,
  ListarOrdensServicoUseCase,
  ObterOrdemServicoUseCase,
  ObterTempoMedioExecucaoUseCase,
} from '../../src/application/atendimento/use-cases';
import { RoleAdmin } from '../../src/domain/autenticacao/entities/usuario-admin.entity';
import { OrdemServicoController } from '../../src/interfaces/http/modules/atendimento/ordem-servico.controller';
import { buildControllerApp } from './utils/build-controller-app';

const OS_ID = '22222222-2222-4222-8222-222222222222';

describe('OrdemServicoController (integration)', () => {
  let app: INestApplication;
  let mocks: Record<string, jest.Mock>;

  beforeAll(async () => {
    mocks = {
      criar: jest.fn().mockResolvedValue({ id: OS_ID, status: 'RECEBIDA' }),
      listar: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
      obter: jest.fn().mockResolvedValue({ id: OS_ID }),
      consultarStatus: jest
        .fn()
        .mockResolvedValue({ status: 'EM_DIAGNOSTICO' }),
      iniciarDiagnostico: jest
        .fn()
        .mockResolvedValue({ id: OS_ID, status: 'EM_DIAGNOSTICO' }),
      gerarOrcamento: jest
        .fn()
        .mockResolvedValue({ id: OS_ID, status: 'AGUARDANDO_APROVACAO' }),
      aprovar: jest
        .fn()
        .mockResolvedValue({ id: OS_ID, status: 'EM_EXECUCAO' }),
      finalizar: jest
        .fn()
        .mockResolvedValue({ id: OS_ID, status: 'FINALIZADA' }),
      entregar: jest.fn().mockResolvedValue({ id: OS_ID, status: 'ENTREGUE' }),
      historico: jest.fn().mockResolvedValue([]),
      tempoMedio: jest.fn().mockResolvedValue({
        totalOs: 0,
        globalMinutos: null,
        porServico: [],
        geradoEm: 'now',
      }),
    };
    app = await buildControllerApp({
      controllers: [OrdemServicoController],
      providers: [
        {
          provide: CriarOrdemServicoUseCase,
          useValue: { execute: mocks.criar },
        },
        {
          provide: ListarOrdensServicoUseCase,
          useValue: { execute: mocks.listar },
        },
        {
          provide: ObterOrdemServicoUseCase,
          useValue: { execute: mocks.obter },
        },
        {
          provide: ConsultarStatusOsUseCase,
          useValue: { execute: mocks.consultarStatus },
        },
        {
          provide: IniciarDiagnosticoUseCase,
          useValue: { execute: mocks.iniciarDiagnostico },
        },
        {
          provide: GerarOrcamentoUseCase,
          useValue: { execute: mocks.gerarOrcamento },
        },
        {
          provide: AprovarOrcamentoUseCase,
          useValue: { execute: mocks.aprovar },
        },
        { provide: FinalizarOsUseCase, useValue: { execute: mocks.finalizar } },
        {
          provide: EntregarVeiculoUseCase,
          useValue: { execute: mocks.entregar },
        },
        {
          provide: ListarHistoricoOsUseCase,
          useValue: { execute: mocks.historico },
        },
        {
          provide: ObterTempoMedioExecucaoUseCase,
          useValue: { execute: mocks.tempoMedio },
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /ordens-servico/:id/status exige x-cpf (CLIENTE)', async () => {
    await request(app.getHttpServer())
      .get(`/ordens-servico/${OS_ID}/status`)
      .expect(403);
  });

  it('GET /ordens-servico/:id/status com x-cpf válido retorna 200', async () => {
    await request(app.getHttpServer())
      .get(`/ordens-servico/${OS_ID}/status`)
      .set('x-cpf', '52998224725')
      .set('x-scope', 'cliente')
      .expect(200);
    expect(mocks.consultarStatus).toHaveBeenCalledWith(OS_ID, {
      cpfCnpj: '52998224725',
    });
  });

  it('GET /ordens-servico/:id/status aceita x-cpf formatado', async () => {
    await request(app.getHttpServer())
      .get(`/ordens-servico/${OS_ID}/status`)
      .set('x-cpf', '529.982.247-25')
      .expect(200);
    expect(mocks.consultarStatus).toHaveBeenCalledWith(OS_ID, {
      cpfCnpj: '52998224725',
    });
  });

  it('GET /admin/ordens-servico sem auth retorna 403', async () => {
    await request(app.getHttpServer()).get('/admin/ordens-servico').expect(403);
  });

  it('GET /admin/ordens-servico com ATENDENTE retorna 200', async () => {
    await request(app.getHttpServer())
      .get('/admin/ordens-servico')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
  });

  it('GET /admin/ordens-servico/metricas/tempo-medio requer role ADMIN/GERENTE', async () => {
    await request(app.getHttpServer())
      .get('/admin/ordens-servico/metricas/tempo-medio')
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
    await request(app.getHttpServer())
      .get('/admin/ordens-servico/metricas/tempo-medio')
      .set('x-test-user-role', RoleAdmin.GERENTE)
      .expect(200);
    expect(mocks.tempoMedio).toHaveBeenCalled();
  });

  it('POST /admin/ordens-servico/:id/diagnostico nega ATENDENTE', async () => {
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/diagnostico`)
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(403);
  });

  it('POST /admin/ordens-servico/:id/diagnostico aceita MECANICO', async () => {
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/diagnostico`)
      .set('x-test-user-role', RoleAdmin.MECANICO)
      .expect(201);
    expect(mocks.iniciarDiagnostico).toHaveBeenCalledWith(OS_ID);
  });

  it('POST /admin/ordens-servico/:id/entrega exige ATENDENTE/ADMIN/GERENTE', async () => {
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/entrega`)
      .set('x-test-user-role', RoleAdmin.MECANICO)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/entrega`)
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(201);
    expect(mocks.entregar).toHaveBeenCalledWith(OS_ID);
  });

  it('POST /ordens-servico é público e cria OS', async () => {
    await request(app.getHttpServer())
      .post('/ordens-servico')
      .send({
        clienteId: '11111111-1111-4111-8111-111111111111',
        veiculoId: '22222222-2222-4222-8222-222222222222',
        itensServico: [],
        itensPeca: [],
      })
      .expect(201);
    expect(mocks.criar).toHaveBeenCalled();
  });

  it('POST /ordens-servico/:id/aprovacoes exige CLIENTE (x-cpf)', async () => {
    await request(app.getHttpServer())
      .post(`/ordens-servico/${OS_ID}/aprovacoes`)
      .set('x-cpf', '52998224725')
      .send({ aprovado: true })
      .expect(201);
    expect(mocks.aprovar).toHaveBeenCalledWith(
      OS_ID,
      { cpfCnpj: '52998224725' },
      expect.objectContaining({ aprovado: true }),
    );
  });

  it('POST /ordens-servico/:id/aprovacoes com aprovado=false rejeita orçamento (F2)', async () => {
    mocks.aprovar.mockResolvedValueOnce({
      id: OS_ID,
      status: 'REJEITADA',
      mensagem: 'Orçamento rejeitado',
    });
    const res = await request(app.getHttpServer())
      .post(`/ordens-servico/${OS_ID}/aprovacoes`)
      .set('x-cpf', '52998224725')
      .send({ aprovado: false })
      .expect(201);
    expect(mocks.aprovar).toHaveBeenCalledWith(
      OS_ID,
      expect.objectContaining({ cpfCnpj: '52998224725' }),
      expect.objectContaining({ aprovado: false }),
    );
    expect(res.body).toMatchObject({ status: 'REJEITADA' });
  });

  it('GET metricas/tempo-medio retorna shape agregado (F7)', async () => {
    mocks.tempoMedio.mockResolvedValueOnce({
      totalOs: 2,
      globalMinutos: 75,
      porServico: [
        {
          servicoId: 'sc-1',
          descricao: 'Troca de óleo',
          totalOs: 2,
          mediaMinutos: 75,
        },
      ],
      geradoEm: '2026-08-07T00:00:00.000Z',
    });
    const res = await request(app.getHttpServer())
      .get('/admin/ordens-servico/metricas/tempo-medio')
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        totalOs: 2,
        globalMinutos: 75,
        porServico: expect.arrayContaining([
          expect.objectContaining({ mediaMinutos: 75 }),
        ]),
      }),
    );
  });

  it('GET /admin/ordens-servico/:id retorna detalhe da OS', async () => {
    await request(app.getHttpServer())
      .get(`/admin/ordens-servico/${OS_ID}`)
      .set('x-test-user-role', RoleAdmin.ATENDENTE)
      .expect(200);
    expect(mocks.obter).toHaveBeenCalledWith(OS_ID);
  });

  it('POST /admin/ordens-servico/:id/orcamento gera orçamento', async () => {
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/orcamento`)
      .set('x-test-user-role', RoleAdmin.MECANICO)
      .expect(201);
    expect(mocks.gerarOrcamento).toHaveBeenCalledWith(OS_ID);
  });

  it('POST /admin/ordens-servico/:id/finalizacao finaliza OS', async () => {
    await request(app.getHttpServer())
      .post(`/admin/ordens-servico/${OS_ID}/finalizacao`)
      .set('x-test-user-role', RoleAdmin.MECANICO)
      .expect(201);
    expect(mocks.finalizar).toHaveBeenCalledWith(OS_ID);
  });

  it('GET /admin/ordens-servico/:id/historico retorna historico', async () => {
    await request(app.getHttpServer())
      .get(`/admin/ordens-servico/${OS_ID}/historico`)
      .set('x-test-user-role', RoleAdmin.ADMIN)
      .expect(200);
    expect(mocks.historico).toHaveBeenCalledWith(OS_ID);
  });
});
