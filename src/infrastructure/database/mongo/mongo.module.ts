import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OS_MONGO_AUDIT } from '../../../domain/atendimento/ports';
import { MongoConnectionService } from './mongo-connection.service';
import { MongoOsAuditRepository } from './mongo-os-audit.repository';
import { NoopOsMongoAuditRepository } from './noop-os-mongo-audit.repository';

@Global()
@Module({
  providers: [
    MongoConnectionService,
    {
      provide: OS_MONGO_AUDIT,
      useFactory: (
        config: ConfigService,
        mongo: MongoConnectionService,
        noop: NoopOsMongoAuditRepository,
        real: MongoOsAuditRepository,
      ) => {
        const uri = config.get<string>('MONGODB_URI')?.trim();
        return uri ? real : noop;
      },
      inject: [
        ConfigService,
        MongoConnectionService,
        NoopOsMongoAuditRepository,
        MongoOsAuditRepository,
      ],
    },
    NoopOsMongoAuditRepository,
    MongoOsAuditRepository,
  ],
  exports: [OS_MONGO_AUDIT, MongoConnectionService],
})
export class MongoModule {}
