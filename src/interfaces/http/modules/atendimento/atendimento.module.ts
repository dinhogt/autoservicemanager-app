import { Module } from '@nestjs/common';
import {
  AprovarOrcamentoUseCase,
  ConsultarStatusOsUseCase,
  CriarOrdemServicoUseCase,
  EntregarVeiculoUseCase,
  GerarOrcamentoUseCase,
  IniciarDiagnosticoUseCase,
  ListarHistoricoOsUseCase,
  ListarOrdensServicoUseCase,
  ObterOrdemServicoUseCase,
  ObterTempoMedioExecucaoUseCase,
  FinalizarOsUseCase,
  ProcessarWebhookStatusOsUseCase,
} from '../../../../application/atendimento/use-cases';
import { OrderStatusService } from '../../../../domain/atendimento/services';
import {
  ORCAMENTO_NOTIFIER,
  OS_STATUS_NOTIFIER,
} from '../../../../domain/atendimento/ports';
import { ORDEM_SERVICO_READ_PORT } from '../../../../domain/atendimento/ports/ordem-servico-read.port';
import { ORDEM_SERVICO_REPOSITORY } from '../../../../domain/atendimento/repositories/ordem-servico.repository';
import { PrismaOrdemServicoRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-ordem-servico.repository';
import { PrismaOrdemServicoReadAdapter } from '../../../../infrastructure/database/mysql/repositories/prisma-ordem-servico-read.adapter';
import { CompositeOrcamentoNotifier } from '../../../../infrastructure/notifications/composite-orcamento-notifier';
import { CompositeOsStatusNotifier } from '../../../../infrastructure/notifications/composite-os-status-notifier';
import { EmailOrcamentoNotifier } from '../../../../infrastructure/notifications/email-orcamento-notifier';
import { EmailOsStatusNotifier } from '../../../../infrastructure/notifications/email-os-status-notifier';
import { LogOrcamentoNotifier } from '../../../../infrastructure/notifications/log-orcamento-notifier';
import { LogOsStatusNotifier } from '../../../../infrastructure/notifications/log-os-status-notifier';
import { SmtpMailService } from '../../../../infrastructure/notifications/smtp-mail.service';
import { SnsOrcamentoNotifier } from '../../../../infrastructure/notifications/sns-orcamento-notifier';
import { SnsOsStatusNotifier } from '../../../../infrastructure/notifications/sns-os-status-notifier';
import { WebhookSecretGuard } from '../../../../infrastructure/auth/webhook-secret.guard';
import { OrdemServicoController } from './ordem-servico.controller';
import { WebhookOsController } from './webhook-os.controller';
import { CLIENTE_REPOSITORY } from '../../../../domain/cadastro/repositories/cliente.repository';
import { VEICULO_REPOSITORY } from '../../../../domain/cadastro/repositories/veiculo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../../domain/estoque/repositories/peca-estoque.repository';
import { PrismaClienteRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-cliente.repository';
import { PrismaVeiculoRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-veiculo.repository';
import { PrismaServicoCatalogoRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-servico-catalogo.repository';
import { PrismaPecaEstoqueRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-peca-estoque.repository';

@Module({
  controllers: [OrdemServicoController, WebhookOsController],
  providers: [
    CriarOrdemServicoUseCase,
    ListarOrdensServicoUseCase,
    ObterOrdemServicoUseCase,
    ConsultarStatusOsUseCase,
    IniciarDiagnosticoUseCase,
    GerarOrcamentoUseCase,
    AprovarOrcamentoUseCase,
    FinalizarOsUseCase,
    EntregarVeiculoUseCase,
    ListarHistoricoOsUseCase,
    ObterTempoMedioExecucaoUseCase,
    ProcessarWebhookStatusOsUseCase,
    { provide: OrderStatusService, useFactory: () => new OrderStatusService() },
    WebhookSecretGuard,
    SmtpMailService,
    LogOsStatusNotifier,
    EmailOsStatusNotifier,
    SnsOsStatusNotifier,
    LogOrcamentoNotifier,
    EmailOrcamentoNotifier,
    SnsOrcamentoNotifier,
    { provide: CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
    { provide: VEICULO_REPOSITORY, useClass: PrismaVeiculoRepository },
    {
      provide: SERVICO_CATALOGO_REPOSITORY,
      useClass: PrismaServicoCatalogoRepository,
    },
    { provide: PECA_ESTOQUE_REPOSITORY, useClass: PrismaPecaEstoqueRepository },
    {
      provide: ORDEM_SERVICO_REPOSITORY,
      useClass: PrismaOrdemServicoRepository,
    },
    {
      provide: ORDEM_SERVICO_READ_PORT,
      useClass: PrismaOrdemServicoReadAdapter,
    },
    { provide: ORCAMENTO_NOTIFIER, useClass: CompositeOrcamentoNotifier },
    { provide: OS_STATUS_NOTIFIER, useClass: CompositeOsStatusNotifier },
  ],
})
export class AtendimentoModule {}
