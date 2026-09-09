import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  OrcamentoNotificacao,
  OrcamentoNotifierPort,
} from '../../domain/atendimento/ports';

@Injectable()
export class SnsOrcamentoNotifier implements OrcamentoNotifierPort {
  private readonly logger = new Logger(SnsOrcamentoNotifier.name);
  private readonly sns: SNSClient;
  private readonly topicArn: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.topicArn = this.config.get<string>('OS_NOTIFICATIONS_TOPIC_ARN')?.trim();
    this.sns = new SNSClient({
      region: this.config.get<string>('AWS_REGION') || process.env.AWS_REGION || 'us-east-1',
    });
  }

  async enviar(notificacao: OrcamentoNotificacao): Promise<void> {
    if (!this.topicArn) {
      this.logger.debug('OS_NOTIFICATIONS_TOPIC_ARN ausente — skip SNS');
      return;
    }

    const subject = `Orçamento OS ${notificacao.ordemServicoId}`;
    const text =
      `Olá ${notificacao.clienteNome},\n\n` +
      `Seu orçamento da OS ${notificacao.ordemServicoId} está disponível.\n` +
      `Total: R$ ${notificacao.total.toFixed(2)}\n` +
      `Aprovação: ${notificacao.linkAprovacao}\n\n` +
      `AutoServiceManager`;

    await this.sns.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify({
          type: 'orcamento',
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
