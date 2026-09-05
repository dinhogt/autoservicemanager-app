import { Injectable } from '@nestjs/common';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';
import { EmailOrcamentoNotifier } from './email-orcamento-notifier';
import { LogOrcamentoNotifier } from './log-orcamento-notifier';

@Injectable()
export class CompositeOrcamentoNotifier implements OrcamentoNotifierPort {
  constructor(
    private readonly logNotifier: LogOrcamentoNotifier,
    private readonly emailNotifier: EmailOrcamentoNotifier,
  ) {}

  async enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    await this.logNotifier.enviar(notificacao);
    await this.emailNotifier.enviar(notificacao);
  }
}
