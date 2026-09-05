import { Injectable } from '@nestjs/common';
import {
  OsStatusNotificacao,
  OsStatusNotifierPort,
} from '../../domain/atendimento/ports/os-status-notifier.port';
import { statusOsLabel } from '../../domain/atendimento/value-objects/status-os-label';
import { SmtpMailService } from './smtp-mail.service';

@Injectable()
export class EmailOsStatusNotifier implements OsStatusNotifierPort {
  constructor(private readonly smtpMail: SmtpMailService) {}

  async notificarMudancaStatus(
    notificacao: OsStatusNotificacao,
  ): Promise<void> {
    const to = notificacao.clienteContato ?? '';
    const subject = `OS ${notificacao.ordemServicoId}: ${statusOsLabel(notificacao.statusNovo)}`;
    const text =
      `Olá ${notificacao.clienteNome},\n\n` +
      `Sua ordem de serviço ${notificacao.ordemServicoId} foi atualizada.\n` +
      `Status: ${statusOsLabel(notificacao.statusAnterior)} → ${statusOsLabel(notificacao.statusNovo)}.\n\n` +
      `AutoServiceManager`;

    await this.smtpMail.sendMail({ to, subject, text });
  }
}
