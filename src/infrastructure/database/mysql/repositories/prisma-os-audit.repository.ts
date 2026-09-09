import { Injectable, Logger } from '@nestjs/common';
import { StatusOs as PrismaStatusOs } from '@prisma/client';
import {
  HistoricoOsItem,
  OsMongoAuditPort,
  RecordDomainEventInput,
  RecordNotificationInput,
  RecordOsTransitionInput,
  RecordStatusChangeInput,
} from '../../../../domain/atendimento/ports';
import {
  emitOsCriadaMetric,
  emitOsFaseDuracaoMetric,
} from '../../../observability/business-metrics';
import { PrismaService } from '../prisma.service';

/**
 * Auditoria de OS em MySQL + logs/métricas estruturados (ADR-010).
 * Mantém o contrato `OsMongoAuditPort` para não churnar use cases.
 */
@Injectable()
export class PrismaOsAuditRepository implements OsMongoAuditPort {
  private readonly logger = new Logger(PrismaOsAuditRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordDomainEvent(input: RecordDomainEventInput): Promise<void> {
    this.logger.log({
      event: 'os_domain_event',
      message: input.eventType,
      ordemServicoId: input.ordemServicoId,
      eventType: input.eventType,
      payload: input.payload ?? {},
    });
  }

  async recordStatusChange(input: RecordStatusChangeInput): Promise<void> {
    const enteredAt = new Date();
    await this.persistStatusRow({
      ordemServicoId: input.ordemServicoId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      context: input.context,
      eventType: undefined,
      enteredAt,
    });
  }

  async recordNotification(input: RecordNotificationInput): Promise<void> {
    this.logger.log({
      event: 'os_notification',
      message: input.message,
      ordemServicoId: input.ordemServicoId,
      notificationKind: input.kind,
      channel: input.channel ?? 'internal',
    });
  }

  async recordOsTransition(input: RecordOsTransitionInput): Promise<void> {
    const enteredAt = new Date();

    if (input.fromStatus) {
      const prev = await this.prisma.ordemServicoStatusHistorico.findFirst({
        where: {
          ordemServicoId: input.ordemServicoId,
          toStatus: input.fromStatus as PrismaStatusOs,
        },
        orderBy: { enteredAt: 'desc' },
      });
      if (prev) {
        emitOsFaseDuracaoMetric({
          ordemServicoId: input.ordemServicoId,
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
          durationMs: enteredAt.getTime() - prev.enteredAt.getTime(),
        });
      }
    }

    await this.persistStatusRow({
      ordemServicoId: input.ordemServicoId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      context: input.context,
      eventType: input.domainEvent.eventType,
      enteredAt,
    });

    await this.recordDomainEvent({
      ordemServicoId: input.ordemServicoId,
      eventType: input.domainEvent.eventType,
      payload: input.domainEvent.payload,
    });

    if (input.domainEvent.eventType === 'OsCriada' || input.fromStatus == null) {
      emitOsCriadaMetric(input.ordemServicoId);
    }

    this.logger.log({
      event: 'os_status_changed',
      message: `${input.fromStatus ?? 'null'} → ${input.toStatus}`,
      ordemServicoId: input.ordemServicoId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      context: input.context,
      eventType: input.domainEvent.eventType,
    });

    if (input.notificationIntent) {
      await this.recordNotification({
        ordemServicoId: input.ordemServicoId,
        ...input.notificationIntent,
      });
    }
  }

  async listHistorico(ordemServicoId: string): Promise<HistoricoOsItem[]> {
    const rows = await this.prisma.ordemServicoStatusHistorico.findMany({
      where: { ordemServicoId },
      orderBy: { enteredAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      kind: 'status' as const,
      at: row.enteredAt.toISOString(),
      eventType: row.eventType ?? undefined,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      context: row.context ?? undefined,
    }));
  }

  private async persistStatusRow(input: {
    ordemServicoId: string;
    fromStatus: string | null;
    toStatus: string;
    context?: string;
    eventType?: string;
    enteredAt: Date;
  }): Promise<void> {
    await this.prisma.ordemServicoStatusHistorico.create({
      data: {
        ordemServicoId: input.ordemServicoId,
        fromStatus: (input.fromStatus as PrismaStatusOs | null) ?? null,
        toStatus: input.toStatus as PrismaStatusOs,
        context: input.context,
        eventType: input.eventType,
        enteredAt: input.enteredAt,
      },
    });
  }
}
