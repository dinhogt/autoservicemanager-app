import { Injectable } from '@nestjs/common';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';
import { SmtpMailService } from './smtp-mail.service';

@Injectable()
export class EmailOrcamentoNotifier implements OrcamentoNotifierPort {
  constructor(private readonly smtpMail: SmtpMailService) {}

  async enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    const to = notificacao.clienteContato ?? '';
    const subject = `Orçamento OS ${notificacao.ordemServicoId} — R$ ${notificacao.total.toFixed(2)}`;
    const text =
      `Olá ${notificacao.clienteNome},\n\n` +
      `Seu orçamento está disponível para aprovação.\n` +
      `Ordem de serviço: ${notificacao.ordemServicoId}\n` +
      `Total: R$ ${notificacao.total.toFixed(2)}\n` +
      `Link de aprovação: ${notificacao.linkAprovacao}\n\n` +
      `AutoServiceManager`;

    await this.smtpMail.sendMail({ to, subject, text });
  }
}
