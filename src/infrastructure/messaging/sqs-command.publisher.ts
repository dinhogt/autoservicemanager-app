import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SagaCommandType,
  type SagaCommandEnvelope,
} from '@dinhogt/domain-shared';
import type { CommandPublisherPort } from '../../domain/saga/saga.ports';

@Injectable()
export class ExecutionSqsCommandPublisher implements CommandPublisherPort {
  constructor(
    private readonly config: ConfigService,
    private readonly client: SQSClient,
  ) {}

  publish(command: SagaCommandEnvelope): Promise<void> {
    return send(
      this.client,
      requiredQueue(this.config, 'EXECUTION_COMMAND_QUEUE_URL'),
      command,
    );
  }
}

@Injectable()
export class BillingSqsCommandPublisher implements CommandPublisherPort {
  constructor(
    private readonly config: ConfigService,
    private readonly client: SQSClient,
  ) {}

  publish(command: SagaCommandEnvelope): Promise<void> {
    if (
      command.messageType !== SagaCommandType.AuthorizePayment &&
      command.messageType !== SagaCommandType.RefundPayment
    ) {
      return Promise.reject(
        new Error(`Billing cannot handle ${command.messageType}`),
      );
    }
    return send(
      this.client,
      requiredQueue(this.config, 'BILLING_COMMAND_QUEUE_URL'),
      command,
    );
  }
}

async function send(
  client: SQSClient,
  queueUrl: string,
  command: SagaCommandEnvelope,
): Promise<void> {
  const fifo = queueUrl.endsWith('.fifo');
  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(command),
      ...(fifo
        ? {
            MessageGroupId: command.correlationId,
            MessageDeduplicationId: command.messageId,
          }
        : {}),
      MessageAttributes: {
        correlationId: {
          DataType: 'String',
          StringValue: command.correlationId,
        },
        messageId: {
          DataType: 'String',
          StringValue: command.messageId,
        },
        ...(command.sagaId
          ? {
              sagaId: {
                DataType: 'String',
                StringValue: command.sagaId,
              },
            }
          : {}),
        schemaVersion: {
          DataType: 'String',
          StringValue: command.schemaVersion,
        },
      },
    }),
  );
}

function requiredQueue(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
}
