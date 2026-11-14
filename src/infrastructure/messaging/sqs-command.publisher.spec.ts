import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  type SagaCommandEnvelope,
} from '@dinhogt/domain-shared';
import {
  BillingSqsCommandPublisher,
  ExecutionSqsCommandPublisher,
} from './sqs-command.publisher';

function command(
  messageType: SagaCommandEnvelope['messageType'],
): SagaCommandEnvelope {
  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    messageId: 'cmd-1',
    messageType,
    occurredAt: '2026-09-22T20:00:00.000Z',
    correlationId: 'corr-1',
    aggregateId: 'os-1',
    source: 'app',
    payload: {},
  };
}

describe('SQS command publishers', () => {
  const send = jest.fn().mockResolvedValue({});
  const client = { send } as unknown as SQSClient;

  beforeEach(() => send.mockClear());

  it('publishes execution commands with tracing attributes', async () => {
    const config = {
      get: jest.fn().mockReturnValue('https://sqs.local/execution'),
    } as unknown as ConfigService;
    await new ExecutionSqsCommandPublisher(config, client).publish(
      command(SagaCommandType.StartExecution),
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          QueueUrl: 'https://sqs.local/execution',
          MessageAttributes: expect.objectContaining({
            correlationId: expect.objectContaining({
              StringValue: 'corr-1',
            }),
          }),
        }),
      }),
    );
  });

  it('adds FIFO deduplication fields', async () => {
    const config = {
      get: jest.fn().mockReturnValue('https://sqs.local/billing.fifo'),
    } as unknown as ConfigService;
    await new BillingSqsCommandPublisher(config, client).publish(
      command(SagaCommandType.AuthorizePayment),
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          MessageGroupId: 'corr-1',
          MessageDeduplicationId: 'cmd-1',
        }),
      }),
    );
  });

  it('rejects invalid billing commands and missing queue config', async () => {
    const configured = {
      get: jest.fn().mockReturnValue('https://sqs.local/billing'),
    } as unknown as ConfigService;
    await expect(
      new BillingSqsCommandPublisher(configured, client).publish(
        command(SagaCommandType.StartDiagnosis),
      ),
    ).rejects.toThrow('Billing cannot handle');

    const missing = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    expect(() =>
      new ExecutionSqsCommandPublisher(missing, client).publish(
        command(SagaCommandType.StartDiagnosis),
      ),
    ).toThrow('not configured');
  });
});
