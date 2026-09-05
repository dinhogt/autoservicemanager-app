import { StatusOs } from '../../src/domain/atendimento/value-objects/status-os.enum';
import { OrderStatusService } from '../../src/domain/atendimento/services';
import type { OsMongoAuditPort } from '../../src/domain/atendimento/ports';
import type { OrcamentoNotifierPort } from '../../src/domain/atendimento/ports';
import type { OrdemServicoComClienteVeiculo } from '../../src/domain/atendimento/types/ordem-servico-read.types';
import { IniciarDiagnosticoUseCase } from '../../src/application/atendimento/use-cases/iniciar-diagnostico.use-case';
import { GerarOrcamentoUseCase } from '../../src/application/atendimento/use-cases/gerar-orcamento.use-case';
import { AprovarOrcamentoUseCase } from '../../src/application/atendimento/use-cases/aprovar-orcamento.use-case';
import { FinalizarOsUseCase } from '../../src/application/atendimento/use-cases/finalizar-os.use-case';
import { EntregarVeiculoUseCase } from '../../src/application/atendimento/use-cases/entregar-veiculo.use-case';
import { ObterTempoMedioExecucaoUseCase } from '../../src/application/atendimento/use-cases/obter-tempo-medio-execucao.use-case';
import { EmailOsStatusNotifier } from '../../src/infrastructure/notifications/email-os-status-notifier';
import { LogOsStatusNotifier } from '../../src/infrastructure/notifications/log-os-status-notifier';
import { CompositeOsStatusNotifier } from '../../src/infrastructure/notifications/composite-os-status-notifier';
import type { SmtpMailService } from '../../src/infrastructure/notifications/smtp-mail.service';
import { mockOrdemServicoRepository } from '../helpers/mock-ordem-servico.repository';

/**
 * F1 / F2 / F4 / F7 — fluxos críticos da OS com use cases reais + repositório
 * stateful em memória (sem banco). Ver docs/qa/critical-flows.yaml.
 */
describe('Fluxos críticos OS (F1/F2/F4/F7)', () => {
  const OS_ID = 'os-critico-1';
  const CPF = '52998224725';
  const cliente = {
    id: 'cli-1',
    cpfCnpj: CPF,
    nome: 'Maria Silva',
    contato: 'maria@oficina.test',
  };
  const veiculo = {
    id: 'vei-1',
    placa: 'ABC1D23',
    modelo: 'Gol',
    clienteId: 'cli-1',
  };

  let status: StatusOs;
  let sendMail: jest.Mock;
  let recordNotification: jest.Mock;
  let recordOsTransition: jest.Mock;
  let orcamentoEnviar: jest.Mock;
  let audit: OsMongoAuditPort;
  let statusNotifier: CompositeOsStatusNotifier;
  let orderStatusService: OrderStatusService;
  let ordens: ReturnType<typeof mockOrdemServicoRepository>;

  function snapshot(): OrdemServicoComClienteVeiculo {
    return {
      id: OS_ID,
      status,
      total: 150,
      clienteId: cliente.id,
      veiculoId: veiculo.id,
      dataCriacao: new Date('2026-01-01T10:00:00Z'),
      dataConclusao: null,
      dataEntrega: null,
      cliente,
      veiculo,
    };
  }

  beforeEach(() => {
    status = StatusOs.RECEBIDA;
    sendMail = jest.fn().mockResolvedValue(true);
    recordNotification = jest.fn().mockResolvedValue(undefined);
    recordOsTransition = jest.fn().mockResolvedValue(undefined);
    orcamentoEnviar = jest.fn().mockResolvedValue(undefined);

    audit = {
      recordDomainEvent: jest.fn().mockResolvedValue(undefined),
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
      recordNotification,
      recordOsTransition,
      listHistorico: jest.fn().mockResolvedValue([]),
    };

    const smtp = { sendMail } as unknown as SmtpMailService;
    statusNotifier = new CompositeOsStatusNotifier(
      new LogOsStatusNotifier(),
      new EmailOsStatusNotifier(smtp),
    );
    orderStatusService = new OrderStatusService();

    ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: jest
        .fn()
        .mockImplementation(() => Promise.resolve(snapshot())),
      updateStatus: jest.fn().mockImplementation((_id, data) => {
        status = data.status;
        return Promise.resolve(snapshot());
      }),
      findForGerarOrcamento: jest.fn().mockImplementation(() =>
        Promise.resolve({
          ...snapshot(),
          itensServico: [
            { quantidade: 1, servicoCatalogo: { precoBase: 100 } },
          ],
          itensPeca: [{ quantidade: 1, pecaEstoque: { precoUnitario: 50 } }],
        }),
      ),
      gerarOrcamento: jest.fn().mockImplementation(() => {
        status = StatusOs.AGUARDANDO_APROVACAO;
        return Promise.resolve({
          ...snapshot(),
          itensServico: [],
          itensPeca: [],
        });
      }),
      aprovarOrcamentoComReserva: jest.fn().mockImplementation(() => {
        status = StatusOs.EM_EXECUCAO;
        return Promise.resolve({
          resultado: snapshot(),
          pecasReservadas: [{ pecaEstoqueId: 'p1', quantidade: 1 }],
        });
      }),
      rejeitarOrcamento: jest.fn().mockImplementation(() => {
        status = StatusOs.REJEITADA;
        return Promise.resolve(snapshot());
      }),
      finalizar: jest.fn().mockImplementation(() => {
        status = StatusOs.FINALIZADA;
        return Promise.resolve();
      }),
    });
  });

  function makeHappyPathUseCases() {
    const orcamentoNotifier: OrcamentoNotifierPort = {
      enviar: orcamentoEnviar,
    };
    return {
      iniciar: new IniciarDiagnosticoUseCase(
        ordens,
        orderStatusService,
        audit,
        statusNotifier,
      ),
      gerar: new GerarOrcamentoUseCase(
        ordens,
        orderStatusService,
        audit,
        orcamentoNotifier,
        statusNotifier,
      ),
      aprovar: new AprovarOrcamentoUseCase(
        ordens,
        orderStatusService,
        audit,
        statusNotifier,
      ),
      finalizar: new FinalizarOsUseCase(
        ordens,
        orderStatusService,
        audit,
        statusNotifier,
      ),
      entregar: new EntregarVeiculoUseCase(
        ordens,
        orderStatusService,
        audit,
        statusNotifier,
      ),
    };
  }

  it('F1: executa ciclo completo RECEBIDA → ENTREGUE e notifica cada transição (F4)', async () => {
    const uc = makeHappyPathUseCases();

    await expect(uc.iniciar.execute(OS_ID)).resolves.toMatchObject({
      status: StatusOs.EM_DIAGNOSTICO,
    });
    expect(status).toBe(StatusOs.EM_DIAGNOSTICO);

    await uc.gerar.execute(OS_ID);
    expect(status).toBe(StatusOs.AGUARDANDO_APROVACAO);
    expect(orcamentoEnviar).toHaveBeenCalled();

    await expect(
      uc.aprovar.execute(OS_ID, { cpfCnpj: CPF }, { aprovado: true }),
    ).resolves.toMatchObject({ status: StatusOs.EM_EXECUCAO });
    expect(status).toBe(StatusOs.EM_EXECUCAO);

    await expect(uc.finalizar.execute(OS_ID)).resolves.toMatchObject({
      status: StatusOs.FINALIZADA,
    });
    expect(status).toBe(StatusOs.FINALIZADA);

    await expect(uc.entregar.execute(OS_ID)).resolves.toMatchObject({
      status: StatusOs.ENTREGUE,
    });
    expect(status).toBe(StatusOs.ENTREGUE);

    // F4: e-mail enviado em cada mudança (diagnóstico, orçamento, aprovação, finalização, entrega)
    expect(sendMail).toHaveBeenCalledTimes(5);
    expect(recordNotification).toHaveBeenCalledTimes(5);
    expect(
      sendMail.mock.calls.every(
        ([mail]: [{ to: string }]) => mail.to === 'maria@oficina.test',
      ),
    ).toBe(true);

    // Transições auditadas
    expect(recordOsTransition).toHaveBeenCalledTimes(5);
  });

  it('F2: rejeição AGUARDANDO_APROVACAO → REJEITADA com auditoria e e-mail', async () => {
    status = StatusOs.AGUARDANDO_APROVACAO;
    const uc = makeHappyPathUseCases();

    const result = await uc.aprovar.execute(
      OS_ID,
      { cpfCnpj: CPF },
      { aprovado: false },
    );

    expect(result).toMatchObject({
      status: StatusOs.REJEITADA,
      mensagem: 'Orçamento rejeitado',
    });
    expect(status).toBe(StatusOs.REJEITADA);
    expect(ordens.rejeitarOrcamento).toHaveBeenCalledWith(OS_ID);
    expect(ordens.aprovarOrcamentoComReserva).not.toHaveBeenCalled();
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStatus: StatusOs.AGUARDANDO_APROVACAO,
        toStatus: StatusOs.REJEITADA,
      }),
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@oficina.test',
        text: expect.stringContaining('Rejeitada'),
      }),
    );
  });

  it('F1 negativo: não permite pular etapas (RECEBIDA → finalizar)', async () => {
    const uc = makeHappyPathUseCases();
    await expect(uc.finalizar.execute(OS_ID)).rejects.toThrow(/finalizar/i);
    expect(status).toBe(StatusOs.RECEBIDA);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('F7: tempo médio retorna agregado global e por serviço', async () => {
    const obterTempoMedioExecucao = jest.fn().mockResolvedValue({
      totalOs: 3,
      globalMinutos: 120,
      porServico: [
        {
          servicoId: 'sc-oleo',
          descricao: 'Troca de óleo',
          totalOs: 2,
          mediaMinutos: 90,
        },
        {
          servicoId: 'sc-alinh',
          descricao: 'Alinhamento',
          totalOs: 1,
          mediaMinutos: 180,
        },
      ],
    });
    const uc = new ObterTempoMedioExecucaoUseCase({
      existsById: jest.fn(),
      countAtivasByClienteId: jest.fn(),
      countAtivasByVeiculoId: jest.fn(),
      countAtivasUsandoServico: jest.fn(),
      countReservasAtivasPeca: jest.fn(),
      obterTempoMedioExecucao,
    });

    const result = await uc.execute();

    expect(result).toEqual(
      expect.objectContaining({
        totalOs: 3,
        globalMinutos: 120,
        porServico: expect.arrayContaining([
          expect.objectContaining({
            servicoId: 'sc-oleo',
            mediaMinutos: 90,
          }),
          expect.objectContaining({
            servicoId: 'sc-alinh',
            mediaMinutos: 180,
          }),
        ]),
      }),
    );
    expect(typeof result.geradoEm).toBe('string');
    expect(obterTempoMedioExecucao).toHaveBeenCalledTimes(1);
  });
});
