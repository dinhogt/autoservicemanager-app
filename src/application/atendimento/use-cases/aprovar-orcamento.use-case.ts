import { Inject, Injectable, Logger } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { runOrderStatusAssertion } from '../helpers/run-order-status-assertion';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import {
  OS_MONGO_AUDIT,
  OS_STATUS_NOTIFIER,
} from '../../../domain/atendimento/ports';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { AprovacaoOrcamentoDto } from '../dto/aprovacao-orcamento.dto';
import { ConsultarStatusOsDto } from '../dto/consultar-status-os.dto';
import { carregarOrdemServicoComValidacaoPublica } from '../helpers/ordem-servico-public-access';
import { notificarMudancaStatus } from '../helpers/notificar-mudanca-status';

@Injectable()
export class AprovarOrcamentoUseCase {
  private readonly logger = new Logger(AprovarOrcamentoUseCase.name);

  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
    private readonly orderStatusService: OrderStatusService,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
    @Inject(OS_STATUS_NOTIFIER)
    private readonly statusNotifier: OsStatusNotifierPort,
  ) {}

  async execute(
    id: string,
    query: ConsultarStatusOsDto,
    dto: AprovacaoOrcamentoDto,
  ) {
    const os = await carregarOrdemServicoComValidacaoPublica(
      this.ordens,
      id,
      query,
    );

    runOrderStatusAssertion(() =>
      this.orderStatusService.assertPodeAprovarOuRejeitarOrcamento(os.status),
    );

    if (!dto.aprovado) {
      const rejeitada = await this.ordens.rejeitarOrcamento(id);
      this.logger.log(`${OsDomainEventType.OrcamentoRejeitado} osId=${id}`);
      await this.audit.recordOsTransition({
        ordemServicoId: id,
        domainEvent: { eventType: OsDomainEventType.OrcamentoRejeitado },
        fromStatus: StatusOs.AGUARDANDO_APROVACAO,
        toStatus: StatusOs.REJEITADA,
        context: 'AprovarOrcamento',
      });
      await notificarMudancaStatus({
        audit: this.audit,
        notifier: this.statusNotifier,
        ordemServicoId: id,
        clienteNome: rejeitada.cliente.nome,
        clienteContato: rejeitada.cliente.contato,
        fromStatus: StatusOs.AGUARDANDO_APROVACAO,
        toStatus: StatusOs.REJEITADA,
        context: 'AprovarOrcamento',
      });
      return {
        id: rejeitada.id,
        status: rejeitada.status,
        mensagem: 'Orçamento rejeitado',
      };
    }

    const { resultado, pecasReservadas } =
      await this.ordens.aprovarOrcamentoComReserva(id);

    this.logger.log(`${OsDomainEventType.OrcamentoAprovado} osId=${id}`);

    await Promise.all(
      pecasReservadas.map((p) =>
        this.audit.recordDomainEvent({
          ordemServicoId: id,
          eventType: OsDomainEventType.PecaReservadaNoEstoque,
          payload: {
            pecaEstoqueId: p.pecaEstoqueId,
            quantidade: p.quantidade,
          },
        }),
      ),
    );
    await this.audit.recordOsTransition({
      ordemServicoId: id,
      domainEvent: { eventType: OsDomainEventType.OrcamentoAprovado },
      fromStatus: StatusOs.AGUARDANDO_APROVACAO,
      toStatus: StatusOs.EM_EXECUCAO,
      context: 'AprovarOrcamento',
    });

    await notificarMudancaStatus({
      audit: this.audit,
      notifier: this.statusNotifier,
      ordemServicoId: id,
      clienteNome: resultado.cliente.nome,
      clienteContato: resultado.cliente.contato,
      fromStatus: StatusOs.AGUARDANDO_APROVACAO,
      toStatus: StatusOs.EM_EXECUCAO,
      context: 'AprovarOrcamento',
    });

    return {
      id: resultado.id,
      status: resultado.status,
      mensagem: 'Orçamento aprovado; peças reservadas no estoque',
    };
  }
}
