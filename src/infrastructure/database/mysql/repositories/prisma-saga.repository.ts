import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SagaCommandType,
  type SagaCommandEnvelope,
} from '@dinhogt/domain-shared';
import type { SagaRepository } from '../../../../domain/saga/saga.ports';
import type {
  SagaEventInput,
  SagaInstance,
  SagaTransition,
} from '../../../../domain/saga/saga.types';
import { PrismaService } from '../prisma.service';

class OptimisticLockError extends Error {}

@Injectable()
export class PrismaSagaRepository implements SagaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    ordemServicoId: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }): Promise<SagaInstance> {
    const row = await this.prisma.sagaInstance.create({
      data: {
        ordemServicoId: input.ordemServicoId,
        correlationId: input.correlationId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return mapSaga(row);
  }

  async findByCorrelationId(
    correlationId: string,
  ): Promise<SagaInstance | null> {
    const row = await this.prisma.sagaInstance.findUnique({
      where: { correlationId },
    });
    return row ? mapSaga(row) : null;
  }

  async findByOrdemServicoId(
    ordemServicoId: string,
  ): Promise<SagaInstance | null> {
    const row = await this.prisma.sagaInstance.findUnique({
      where: { ordemServicoId },
    });
    return row ? mapSaga(row) : null;
  }

  async hasProcessed(eventId: string): Promise<boolean> {
    return (
      (await this.prisma.sagaProcessedEvent.count({ where: { eventId } })) > 0
    );
  }

  async applyEvent(
    saga: SagaInstance,
    event: SagaEventInput,
    transition: SagaTransition,
  ): Promise<'applied' | 'duplicate' | 'conflict'> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.sagaProcessedEvent.create({
          data: {
            eventId: event.envelope.messageId,
            sagaId: saga.id,
            eventType: event.envelope.messageType,
          },
        });
        const update = await tx.sagaInstance.updateMany({
          where: { id: saga.id, version: saga.version },
          data: {
            status: transition.status,
            version: { increment: 1 },
            paymentId: transition.paymentId,
            failureReason: transition.failureReason,
            metadata: {
              ...(saga.metadata ?? {}),
              lastEventId: event.envelope.messageId,
            } as Prisma.InputJsonValue,
          },
        });
        if (update.count !== 1) {
          throw new OptimisticLockError();
        }
        if (transition.commands.length > 0) {
          await tx.sagaOutboxMessage.createMany({
            data: transition.commands.map((command) => ({
              id: command.messageId,
              sagaId: saga.id,
              destination: destination(command),
              payload: command as unknown as Prisma.InputJsonValue,
            })),
          });
        }
        const osStatus = statusForEvent(event.envelope.messageType);
        if (osStatus && 'ordemServico' in tx) {
          await tx.ordemServico.update({
            where: { id: saga.ordemServicoId },
            data: {
              status: osStatus,
              ...(osStatus === 'FINALIZADA'
                ? { dataConclusao: new Date() }
                : {}),
            },
          });
        }
      });
      return 'applied';
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        return 'conflict';
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return 'duplicate';
      }
      throw error;
    }
  }

  async enqueue(
    sagaId: string,
    commands: SagaCommandEnvelope[],
  ): Promise<void> {
    if (commands.length === 0) return;
    await this.prisma.sagaOutboxMessage.createMany({
      data: commands.map((command) => ({
        id: command.messageId,
        sagaId,
        destination: destination(command),
        payload: command as unknown as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }

  async pendingCommands(correlationId: string): Promise<SagaCommandEnvelope[]> {
    const rows = await this.prisma.sagaOutboxMessage.findMany({
      where: { saga: { correlationId }, publishedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => row.payload as unknown as SagaCommandEnvelope);
  }

  async markPublished(messageId: string): Promise<void> {
    await this.prisma.sagaOutboxMessage.update({
      where: { id: messageId },
      data: { publishedAt: new Date(), attempts: { increment: 1 } },
    });
  }
}

function statusForEvent(
  eventType: string,
): 'AGUARDANDO_APROVACAO' | 'REJEITADA' | 'EM_EXECUCAO' | 'FINALIZADA' | null {
  switch (eventType) {
    case 'diagnosis.completed':
      return 'AGUARDANDO_APROVACAO';
    case 'budget.rejected':
      return 'REJEITADA';
    case 'payment.authorized':
      return 'EM_EXECUCAO';
    case 'execution.completed':
      return 'FINALIZADA';
    default:
      return null;
  }
}

function destination(command: SagaCommandEnvelope): string {
  return command.messageType === SagaCommandType.AuthorizePayment ||
    command.messageType === SagaCommandType.RefundPayment
    ? 'billing'
    : 'execution';
}

function mapSaga(row: {
  id: string;
  ordemServicoId: string;
  correlationId: string;
  status: string;
  version: number;
  paymentId: string | null;
  failureReason: string | null;
  metadata: unknown;
  createdAt: Date;
}): SagaInstance {
  return {
    ...row,
    status: row.status as SagaInstance['status'],
    metadata:
      typeof row.metadata === 'object' && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
  };
}
