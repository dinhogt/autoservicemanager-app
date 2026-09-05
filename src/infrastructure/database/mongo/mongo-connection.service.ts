import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoConnectionService.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const uri = this.config.get<string>('MONGODB_URI')?.trim();
    if (!uri) {
      this.logger.log('MONGODB_URI not set; Mongo audit disabled');
      return;
    }
    this.client = new MongoClient(uri);
    await this.client.connect();
    const dbName =
      this.config.get<string>('MONGODB_DATABASE')?.trim() ||
      'autoservicemanager';
    this.db = this.client.db(dbName);
    await this.ensureIndexes();
    this.logger.log(`MongoDB connected (db=${dbName})`);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  private async ensureIndexes() {
    if (!this.db) return;
    await this.db
      .collection('os_event_logs')
      .createIndex({ ordemServicoId: 1 });
    await this.db
      .collection('os_status_history')
      .createIndex({ ordemServicoId: 1 });
    await this.db
      .collection('notification_logs')
      .createIndex({ ordemServicoId: 1 });
  }
}
