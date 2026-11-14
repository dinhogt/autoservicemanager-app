import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SagaOrchestratorService } from '../../application/saga/saga-orchestrator.service';

@Injectable()
export class SqsSagaEventConsumer
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(SqsSagaEventConsumer.name);
  private running = false;

  constructor(
    private readonly client: SQSClient,
    private readonly config: ConfigService,
    private readonly orchestrator: SagaOrchestratorService,
  ) {}

  onModuleInit(): void {
    if (
      this.config.get<string>('SAGA_EVENTS_POLLING_ENABLED', 'true') === 'true'
    ) {
      this.running = true;
      void this.poll();
    }
  }

  onApplicationShutdown(): void {
    this.running = false;
  }

  async consumeOnce(): Promise<number> {
    const queueUrl = this.config.getOrThrow<string>('SAGA_EVENTS_QUEUE_URL');
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 10,
        VisibilityTimeout: 60,
      }),
    );
    for (const message of response.Messages ?? []) {
      if (!message.Body || !message.ReceiptHandle) continue;
      await this.orchestrator.consume(message.Body);
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    }
    return response.Messages?.length ?? 0;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        await this.consumeOnce();
      } catch (error) {
        this.logger.error(
          'Saga event polling failed',
          error instanceof Error ? error.stack : String(error),
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
