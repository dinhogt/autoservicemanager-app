import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  OsStatusNotificacao,
  OsStatusNotifierPort,
} from '../../domain/atendimento/ports/os-status-notifier.port';
import { statusOsLabel } from '../../domain/atendimento/value-objects/status-os-label';

@Injectable()
export class SnsOsStatusNotifier implements OsStatusNotifierPort {
  private readonly logger = new Logger(SnsOsStatusNotifier.name);
  private readonly sns: SNSClient;
  private readonly topicArn: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.topicArn = this.config.get<string>('OS_NOTIFICATIONS_TOPIC_ARN')?.trim();
    this.sns = new SNSClient({
      region: this.config.get<string>('AWS_REGION') || process.env.AWS_REGION || 'us-east-1',
    });
  }

  async notificarMudancaStatus(
    notificacao: OsStatusNotificacao,
  ): Promise<void> {
    if (!this.topicArn) {
      this.logger.debug('OS_NOTIFICATIONS_TOPIC_ARN ausente — skip SNS');
      return;
    }

    const subject = `OS ${notificacao.ordemServicoId}: ${statusOsLabel(notificacao.statusNovo)}`;
    const text =
      `Olá ${notificacao.clienteNome},\n\n` +
      `Sua ordem de serviço ${notificacao.ordemServicoId} foi atualizada.\n` +
      `Status: ${statusOsLabel(notificacao.statusAnterior)} → ${statusOsLabel(notificacao.statusNovo)}.\n\n` +
      `AutoServiceManager`;

    await this.sns.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify({
          type: 'os_status',
          to: notificacao.clienteContato,
          clienteNome: notificacao.clienteNome,
          ordemServicoId: notificacao.ordemServicoId,
          subject,
          text,
        }),
      }),
    );
  }
}
