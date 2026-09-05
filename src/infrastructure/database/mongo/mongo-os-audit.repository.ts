import { Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import {
  HistoricoOsItem,
  OsMongoAuditPort,
  RecordDomainEventInput,
  RecordNotificationInput,
  RecordOsTransitionInput,
  RecordStatusChangeInput,
} from '../../../domain/atendimento/ports';
import { MongoConnectionService } from './mongo-connection.service';

const COL_EVENT_LOG = 'os_event_logs';
const COL_STATUS_HISTORY = 'os_status_history';
const COL_NOTIFICATION = 'notification_logs';

@Injectable()
export class MongoOsAuditRepository implements OsMongoAuditPort {
  private readonly logger = new Logger(MongoOsAuditRepository.name);

  constructor(private readonly mongo: MongoConnectionService) {}

  private async bestEffort(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.warn(
        `Mongo audit write failed (best-effort): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async recordDomainEvent(input: RecordDomainEventInput): Promise<void> {
    await this.bestEffort(async () => {
      const db = this.mongo.getDb();
      if (!db) return;
      await db.collection(COL_EVENT_LOG).insertOne({
        ordemServicoId: input.ordemServicoId,
        eventType: input.eventType,
        payload: input.payload ?? {},
        occurredAt: new Date(),
      });
    });
  }

  async recordStatusChange(input: RecordStatusChangeInput): Promise<void> {
    await this.bestEffort(async () => {
      const db = this.mongo.getDb();
      if (!db) return;
      await db.collection(COL_STATUS_HISTORY).insertOne({
        ordemServicoId: input.ordemServicoId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        context: input.context,
        changedAt: new Date(),
      });
    });
  }

  async recordNotification(input: RecordNotificationInput): Promise<void> {
    await this.bestEffort(async () => {
      const db = this.mongo.getDb();
      if (!db) return;
      await db.collection(COL_NOTIFICATION).insertOne({
        ordemServicoId: input.ordemServicoId,
        kind: input.kind,
        channel: input.channel ?? 'internal',
        message: input.message,
        sentAt: new Date(),
      });
    });
  }

  async recordOsTransition(input: RecordOsTransitionInput): Promise<void> {
    await this.recordDomainEvent({
      ordemServicoId: input.ordemServicoId,
      eventType: input.domainEvent.eventType,
      payload: input.domainEvent.payload,
    });
    await this.recordStatusChange({
      ordemServicoId: input.ordemServicoId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      context: input.context,
    });
    if (input.notificationIntent) {
      await this.recordNotification({
        ordemServicoId: input.ordemServicoId,
        ...input.notificationIntent,
      });
    }
  }

  async listHistorico(ordemServicoId: string): Promise<HistoricoOsItem[]> {
    const db = this.mongo.getDb();
    if (!db) return [];

    const [events, statuses, notifications] = await Promise.all([
      db
        .collection(COL_EVENT_LOG)
        .find({ ordemServicoId })
        .sort({ occurredAt: 1 })
        .toArray(),
      db
        .collection(COL_STATUS_HISTORY)
        .find({ ordemServicoId })
        .sort({ changedAt: 1 })
        .toArray(),
      db
        .collection(COL_NOTIFICATION)
        .find({ ordemServicoId })
        .sort({ sentAt: 1 })
        .toArray(),
    ]);

    const docId = (doc: { _id: unknown }): string =>
      doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);

    const merged: HistoricoOsItem[] = [
      ...events.map(
        (doc): HistoricoOsItem => ({
          id: docId(doc),
          kind: 'domain_event',
          at: (doc.occurredAt as Date).toISOString(),
          eventType: doc.eventType as string,
          payload: (doc.payload as Record<string, unknown>) ?? {},
        }),
      ),
      ...statuses.map(
        (doc): HistoricoOsItem => ({
          id: docId(doc),
          kind: 'status',
          at: (doc.changedAt as Date).toISOString(),
          fromStatus: doc.fromStatus as string | null,
          toStatus: doc.toStatus as string,
          context: doc.context as string | undefined,
        }),
      ),
      ...notifications.map(
        (doc): HistoricoOsItem => ({
          id: docId(doc),
          kind: 'notification',
          at: (doc.sentAt as Date).toISOString(),
          notificationKind: doc.kind as string,
          message: doc.message as string,
          channel: doc.channel as string,
        }),
      ),
    ];

    merged.sort((a, b) => a.at.localeCompare(b.at));
    return merged;
  }
}
