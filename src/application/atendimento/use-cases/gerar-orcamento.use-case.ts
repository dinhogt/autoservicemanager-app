import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import {
  ORCAMENTO_NOTIFIER,
  OS_MONGO_AUDIT,
  OS_STATUS_NOTIFIER,
} from '../../../domain/atendimento/ports';
import type {
  OrcamentoNotifierPort,
  OsMongoAuditPort,
} from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { notificarMudancaStatus } from '../helpers/notificar-mudanca-status';
import { runOrderStatusAssertion } from '../helpers/run-order-status-assertion';

@Injectable()
export class GerarOrcamentoUseCase {
  private readonly logger = new Logger(GerarOrcamentoUseCase.name);

  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
    private readonly orderStatusService: OrderStatusService,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
    @Inject(ORCAMENTO_NOTIFIER)
    private readonly notifier: OrcamentoNotifierPort,
    @Inject(OS_STATUS_NOTIFIER)
    private readonly statusNotifier: OsStatusNotifierPort,
  ) {}

  async execute(ordemServicoId: string) {
    const os = await this.ordens.findForGerarOrcamento(ordemServicoId);

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    runOrderStatusAssertion(() =>
      this.orderStatusService.assertPodeGerarOrcamento(os.status),
    );

    let total = 0;
    for (const item of os.itensServico) {
      total += Number(item.servicoCatalogo.precoBase) * item.quantidade;
    }
    for (const item of os.itensPeca) {
      total += Number(item.pecaEstoque.precoUnitario) * item.quantidade;
    }

    const atualizada = await this.ordens.gerarOrcamento(ordemServicoId, total);

    this.logger.log(
      `${OsDomainEventType.OrcamentoGerado} osId=${ordemServicoId} total=${total}`,
    );

    const linkAprovacao = `/ordens-servico/${ordemServicoId}/aprovacoes`;
    const mensagem =
      `Orçamento da OS ${ordemServicoId} disponível para aprovação. ` +
      `Total: R$ ${total.toFixed(2)}.`;

    await this.audit.recordOsTransition({
      ordemServicoId,
      domainEvent: {
        eventType: OsDomainEventType.OrcamentoGerado,
        payload: { total },
      },
      fromStatus: os.status,
      toStatus: atualizada.status,
      context: 'GerarOrcamento',
      notificationIntent: {
        kind: OsDomainEventType.OrcamentoEnviadoParaCliente,
        message: mensagem,
        channel: 'email',
      },
    });

    await this.notifier.enviar({
      ordemServicoId,
      clienteNome: atualizada.cliente.nome,
      clienteContato: atualizada.cliente.contato,
      total,
      linkAprovacao,
    });

    await notificarMudancaStatus({
      audit: this.audit,
      notifier: this.statusNotifier,
      ordemServicoId,
      clienteNome: atualizada.cliente.nome,
      clienteContato: atualizada.cliente.contato,
      fromStatus: os.status,
      toStatus: atualizada.status,
      context: 'GerarOrcamento',
    });

    return atualizada;
  }
}
