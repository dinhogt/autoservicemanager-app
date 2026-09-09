import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OsStatusNotificacao,
  OsStatusNotifierPort,
} from '../../domain/atendimento/ports/os-status-notifier.port';
import { EmailOsStatusNotifier } from './email-os-status-notifier';
import { LogOsStatusNotifier } from './log-os-status-notifier';
import { SnsOsStatusNotifier } from './sns-os-status-notifier';

@Injectable()
export class CompositeOsStatusNotifier implements OsStatusNotifierPort {
  constructor(
    private readonly logNotifier: LogOsStatusNotifier,
    private readonly snsNotifier: SnsOsStatusNotifier,
    private readonly emailNotifier: EmailOsStatusNotifier,
    private readonly config: ConfigService,
  ) {}

  async notificarMudancaStatus(
    notificacao: OsStatusNotificacao,
  ): Promise<void> {
    await this.logNotifier.notificarMudancaStatus(notificacao);
    const topic = this.config.get<string>('OS_NOTIFICATIONS_TOPIC_ARN')?.trim();
    if (topic) {
      await this.snsNotifier.notificarMudancaStatus(notificacao);
      return;
    }
    // Fallback local: SMTP / Mailtrap quando SNS não está configurado
    await this.emailNotifier.notificarMudancaStatus(notificacao);
  }
}
