import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { runOrderStatusAssertion } from '../helpers/run-order-status-assertion';
import {
  OS_MONGO_AUDIT,
  OS_STATUS_NOTIFIER,
} from '../../../domain/atendimento/ports';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mapWebhookStatusToDomainEvent } from '../../../domain/atendimento/services/webhook-status-event.mapper';
import { WebhookStatusOsDto } from '../dto/webhook-status-os.dto';
import { notificarMudancaStatus } from '../helpers/notificar-mudanca-status';

@Injectable()
export class ProcessarWebhookStatusOsUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
    private readonly orderStatusService: OrderStatusService,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
    @Inject(OS_STATUS_NOTIFIER)
    private readonly statusNotifier: OsStatusNotifierPort,
  ) {}

  async execute(id: string, dto: WebhookStatusOsDto) {
    const os = await this.ordens.findWithClienteVeiculoById(id);
    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    const statusAnterior = os.status;
    runOrderStatusAssertion(() =>
      this.orderStatusService.assertTransicaoWebhookPermitida(
        statusAnterior,
        dto.status,
      ),
    );

    const extra: {
      dataConclusao?: Date;
      dataEntrega?: Date;
    } = {};
    if (dto.status === StatusOs.FINALIZADA) {
      extra.dataConclusao = new Date();
    }
    if (dto.status === StatusOs.ENTREGUE) {
      extra.dataEntrega = new Date();
    }

    if (dto.status === StatusOs.FINALIZADA) {
      await this.ordens.finalizar(id);
    } else if (dto.status === StatusOs.EM_EXECUCAO) {
      await this.ordens.aprovarOrcamentoComReserva(id);
    } else {
      await this.ordens.updateStatus(id, {
        status: dto.status,
        ...extra,
      });
    }

    const updated = await this.ordens.findWithClienteVeiculoById(id);
    if (!updated) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    await this.audit.recordOsTransition({
      ordemServicoId: id,
      domainEvent: {
        eventType: mapWebhookStatusToDomainEvent(dto.status),
        payload: { via: 'webhook', status: dto.status },
      },
      fromStatus: statusAnterior,
      toStatus: updated.status,
      context: 'WebhookStatusOs',
    });

    await notificarMudancaStatus({
      audit: this.audit,
      notifier: this.statusNotifier,
      ordemServicoId: id,
      clienteNome: updated.cliente.nome,
      clienteContato: updated.cliente.contato,
      fromStatus: statusAnterior,
      toStatus: updated.status,
      context: 'WebhookStatusOs',
    });

    return {
      id,
      status: updated.status,
      mensagem: `Status atualizado via webhook para ${updated.status}`,
    };
  }
}
