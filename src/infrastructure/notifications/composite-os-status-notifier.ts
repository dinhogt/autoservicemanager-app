import { Injectable } from '@nestjs/common';
import {
  OsStatusNotificacao,
  OsStatusNotifierPort,
} from '../../domain/atendimento/ports/os-status-notifier.port';
import { EmailOsStatusNotifier } from './email-os-status-notifier';
import { LogOsStatusNotifier } from './log-os-status-notifier';

@Injectable()
export class CompositeOsStatusNotifier implements OsStatusNotifierPort {
  constructor(
    private readonly logNotifier: LogOsStatusNotifier,
    private readonly emailNotifier: EmailOsStatusNotifier,
  ) {}

  async notificarMudancaStatus(
    notificacao: OsStatusNotificacao,
  ): Promise<void> {
    await this.logNotifier.notificarMudancaStatus(notificacao);
    await this.emailNotifier.notificarMudancaStatus(notificacao);
  }
}
