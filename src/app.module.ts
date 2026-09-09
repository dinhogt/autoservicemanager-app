import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './infrastructure/auth/auth.module';
import { ClienteAuthGuard } from './infrastructure/auth/cliente-auth.guard';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from './infrastructure/auth/roles.guard';
import { AppConfigModule } from './infrastructure/config/app-config.module';
import { OsAuditModule } from './infrastructure/database/mysql/os-audit.module';
import { PrismaModule } from './infrastructure/database/mysql/prisma.module';
import { TraceMiddleware } from './infrastructure/observability/trace.middleware';
import { CadastroModule } from './interfaces/http/modules/cadastro/cadastro.module';
import { CatalogoServicosModule } from './interfaces/http/modules/catalogo-servicos/catalogo-servicos.module';
import { EstoqueModule } from './interfaces/http/modules/estoque/estoque.module';
import { AtendimentoModule } from './interfaces/http/modules/atendimento/atendimento.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    OsAuditModule,
    AuthModule,
    CadastroModule,
    CatalogoServicosModule,
    EstoqueModule,
    AtendimentoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ClienteAuthGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
