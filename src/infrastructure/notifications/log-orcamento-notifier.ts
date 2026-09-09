import { Injectable, Logger } from '@nestjs/common';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';

/**
 * Log notifier — fallback observável. Histórico de status vive no MySQL
 * (`PrismaOsAuditRepository`); notificações serverless via SNS (RFC-004).
 */
@Injectable()
export class LogOrcamentoNotifier implements OrcamentoNotifierPort {
  private readonly logger = new Logger(LogOrcamentoNotifier.name);

  enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    this.logger.log(
      `OrcamentoEnviadoParaCliente osId=${notificacao.ordemServicoId} ` +
        `cliente="${notificacao.clienteNome}" total=${notificacao.total} ` +
        `contato=${notificacao.clienteContato ?? 'n/d'} ` +
        `link=${notificacao.linkAprovacao}`,
    );
    return Promise.resolve();
  }
}
