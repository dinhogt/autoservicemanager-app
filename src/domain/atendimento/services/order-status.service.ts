import { StatusTransitionException } from '../errors/status-transition.exception';
import { StatusOs } from '../value-objects/status-os.enum';

const STATUS_PARA_GERAR_ORCAMENTO: StatusOs[] = [
  StatusOs.RECEBIDA,
  StatusOs.EM_DIAGNOSTICO,
  StatusOs.AGUARDANDO_APROVACAO,
];

/** Transições permitidas via webhook / integração externa. */
const TRANSICOES_WEBHOOK: Partial<Record<StatusOs, StatusOs[]>> = {
  [StatusOs.RECEBIDA]: [StatusOs.EM_DIAGNOSTICO],
  [StatusOs.EM_DIAGNOSTICO]: [StatusOs.AGUARDANDO_APROVACAO],
  [StatusOs.AGUARDANDO_APROVACAO]: [StatusOs.EM_EXECUCAO, StatusOs.REJEITADA],
  [StatusOs.EM_EXECUCAO]: [StatusOs.FINALIZADA],
  [StatusOs.FINALIZADA]: [StatusOs.ENTREGUE],
};

export class OrderStatusService {
  assertStatusAtual(params: {
    statusAtual: StatusOs;
    allowedFrom: StatusOs[];
    acao: string;
  }) {
    const { statusAtual, allowedFrom, acao } = params;
    if (!allowedFrom.includes(statusAtual)) {
      throw new StatusTransitionException(
        `Não é possível ${acao} quando a OS está em ${statusAtual}. Esperado: ${allowedFrom.join(
          ', ',
        )}`,
      );
    }
  }

  assertPodeGerarOrcamento(statusAtual: StatusOs) {
    if (!STATUS_PARA_GERAR_ORCAMENTO.includes(statusAtual)) {
      throw new StatusTransitionException(
        'Orçamento só pode ser gerado quando a OS está recebida, em diagnóstico ou aguardando aprovação',
      );
    }
  }

  assertPodeAprovarOuRejeitarOrcamento(statusAtual: StatusOs) {
    if (statusAtual !== StatusOs.AGUARDANDO_APROVACAO) {
      throw new StatusTransitionException(
        'Orçamento só pode ser aprovado ou rejeitado quando a OS está aguardando aprovação',
      );
    }
  }

  assertTransicaoWebhookPermitida(de: StatusOs, para: StatusOs) {
    const allowed = TRANSICOES_WEBHOOK[de] ?? [];
    if (!allowed.includes(para)) {
      throw new StatusTransitionException(
        `Transição de ${de} para ${para} não é permitida via webhook`,
      );
    }
  }
}
