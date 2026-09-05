import { StatusTransitionException } from '../errors/status-transition.exception';
import { StatusOs } from '../value-objects/status-os.enum';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService', () => {
  const service = new OrderStatusService();

  it('não lança quando o status atual está em allowedFrom', () => {
    expect(() =>
      service.assertStatusAtual({
        statusAtual: StatusOs.EM_EXECUCAO,
        allowedFrom: [StatusOs.EM_EXECUCAO, StatusOs.RECEBIDA],
        acao: 'teste',
      }),
    ).not.toThrow();
  });

  it('lança StatusTransitionException quando o status não é permitido', () => {
    expect(() =>
      service.assertStatusAtual({
        statusAtual: StatusOs.RECEBIDA,
        allowedFrom: [StatusOs.EM_EXECUCAO],
        acao: 'finalizar',
      }),
    ).toThrow(StatusTransitionException);
  });

  it('assertPodeGerarOrcamento aceita status válidos', () => {
    expect(() =>
      service.assertPodeGerarOrcamento(StatusOs.RECEBIDA),
    ).not.toThrow();
    expect(() =>
      service.assertPodeGerarOrcamento(StatusOs.EM_DIAGNOSTICO),
    ).not.toThrow();
    expect(() =>
      service.assertPodeGerarOrcamento(StatusOs.AGUARDANDO_APROVACAO),
    ).not.toThrow();
  });

  it('assertPodeGerarOrcamento lança para outros status', () => {
    expect(() => service.assertPodeGerarOrcamento(StatusOs.ENTREGUE)).toThrow(
      StatusTransitionException,
    );
  });

  it('assertPodeAprovarOuRejeitarOrcamento exige AGUARDANDO_APROVACAO', () => {
    expect(() =>
      service.assertPodeAprovarOuRejeitarOrcamento(
        StatusOs.AGUARDANDO_APROVACAO,
      ),
    ).not.toThrow();
    expect(() =>
      service.assertPodeAprovarOuRejeitarOrcamento(StatusOs.RECEBIDA),
    ).toThrow(StatusTransitionException);
  });

  it('assertTransicaoWebhookPermitida valida transições', () => {
    expect(() =>
      service.assertTransicaoWebhookPermitida(
        StatusOs.RECEBIDA,
        StatusOs.EM_DIAGNOSTICO,
      ),
    ).not.toThrow();
    expect(() =>
      service.assertTransicaoWebhookPermitida(
        StatusOs.RECEBIDA,
        StatusOs.ENTREGUE,
      ),
    ).toThrow(StatusTransitionException);
  });
});
