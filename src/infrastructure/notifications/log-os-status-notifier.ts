import { Injectable, Logger } from '@nestjs/common';
import {
  OsStatusNotificacao,
  OsStatusNotifierPort,
} from '../../domain/atendimento/ports/os-status-notifier.port';
import { statusOsLabel } from '../../domain/atendimento/value-objects/status-os-label';

@Injectable()
export class LogOsStatusNotifier implements OsStatusNotifierPort {
  private readonly logger = new Logger(LogOsStatusNotifier.name);

  notificarMudancaStatus(notificacao: OsStatusNotificacao): Promise<void> {
    this.logger.log(
      `OsStatusAlterado osId=${notificacao.ordemServicoId} ` +
        `cliente="${notificacao.clienteNome}" ` +
        `${statusOsLabel(notificacao.statusAnterior)} → ${statusOsLabel(notificacao.statusNovo)} ` +
        `contato=${notificacao.clienteContato ?? 'N/A'}`,
    );
    return Promise.resolve();
  }
}
