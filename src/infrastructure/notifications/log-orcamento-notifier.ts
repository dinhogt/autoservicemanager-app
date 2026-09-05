import { Injectable, Logger } from '@nestjs/common';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';

/**
 * Implementação default do `OrcamentoNotifierPort`. No MVP não há canal real
 * (e-mail/SMS), portanto apenas registra a tentativa via `Logger`. O histórico
 * de notificações continua sendo gravado pelo `OsMongoAuditPort`.
 */
@Injectable()
export class LogOrcamentoNotifier implements OrcamentoNotifierPort {
  private readonly logger = new Logger(LogOrcamentoNotifier.name);

  enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    this.logger.log(
      `OrcamentoEnviadoParaCliente osId=${notificacao.ordemServicoId} ` +
        `cliente="${notificacao.clienteNome}" total=${notificacao.total} ` +
        `link=${notificacao.linkAprovacao}`,
    );
    return Promise.resolve();
  }
}
