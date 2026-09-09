import { Global, Module } from '@nestjs/common';
import { OS_MONGO_AUDIT } from '../../../domain/atendimento/ports';
import { PrismaModule } from './prisma.module';
import { PrismaOsAuditRepository } from './repositories/prisma-os-audit.repository';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaOsAuditRepository,
    { provide: OS_MONGO_AUDIT, useExisting: PrismaOsAuditRepository },
  ],
  exports: [OS_MONGO_AUDIT, PrismaOsAuditRepository],
})
export class OsAuditModule {}
