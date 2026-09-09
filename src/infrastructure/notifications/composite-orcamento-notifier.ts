import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';
import { EmailOrcamentoNotifier } from './email-orcamento-notifier';
import { LogOrcamentoNotifier } from './log-orcamento-notifier';
import { SnsOrcamentoNotifier } from './sns-orcamento-notifier';

@Injectable()
export class CompositeOrcamentoNotifier implements OrcamentoNotifierPort {
  constructor(
    private readonly logNotifier: LogOrcamentoNotifier,
    private readonly snsNotifier: SnsOrcamentoNotifier,
    private readonly emailNotifier: EmailOrcamentoNotifier,
    private readonly config: ConfigService,
  ) {}

  async enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    await this.logNotifier.enviar(notificacao);
    const topic = this.config.get<string>('OS_NOTIFICATIONS_TOPIC_ARN')?.trim();
    if (topic) {
      await this.snsNotifier.enviar(notificacao);
      return;
    }
    await this.emailNotifier.enviar(notificacao);
  }
}
