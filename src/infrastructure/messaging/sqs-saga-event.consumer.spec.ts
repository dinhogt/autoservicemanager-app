import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { SagaOrchestratorService } from '../../application/saga/saga-orchestrator.service';
import { SqsSagaEventConsumer } from './sqs-saga-event.consumer';

describe('SqsSagaEventConsumer', () => {
  const queue = 'http://localhost/queue';

  function setup(enabled = 'false') {
    const send = jest.fn();
    const consume = jest.fn().mockResolvedValue({
      outcome: 'applied',
      correlationId: 'corr-1',
    });
    const config = {
      get: jest.fn((_key: string, fallback?: string) => enabled ?? fallback),
      getOrThrow: jest.fn().mockReturnValue(queue),
    } as unknown as ConfigService;
    const consumer = new SqsSagaEventConsumer(
      { send } as unknown as SQSClient,
      config,
      { consume } as unknown as SagaOrchestratorService,
    );
    return { consumer, send, consume };
  }

  it('consumes and acknowledges valid messages', async () => {
    const { consumer, send, consume } = setup();
    send
      .mockResolvedValueOnce({
        Messages: [
          { Body: '{"messageId":"e1"}', ReceiptHandle: 'receipt' },
          {},
          { Body: '{}' },
        ],
      })
      .mockResolvedValueOnce({});
    await expect(consumer.consumeOnce()).resolves.toBe(3);
    expect(consume).toHaveBeenCalledWith('{"messageId":"e1"}');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('handles empty queues and disabled lifecycle', async () => {
    const { consumer, send } = setup();
    send.mockResolvedValueOnce({});
    await expect(consumer.consumeOnce()).resolves.toBe(0);
    consumer.onModuleInit();
    consumer.onApplicationShutdown();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('starts and stops polling', async () => {
    const { consumer, send } = setup('true');
    send.mockImplementation(() => {
      consumer.onApplicationShutdown();
      return Promise.resolve({ Messages: [] });
    });
    consumer.onModuleInit();
    await new Promise((resolve) => setImmediate(resolve));
    expect(send).toHaveBeenCalled();
  });

  it.each([new Error('SQS unavailable'), 'SQS unavailable'])(
    'recovers from polling errors represented as %p',
    async (error) => {
      jest.useFakeTimers();
      const { consumer, send } = setup('true');
      send.mockRejectedValueOnce(error).mockImplementation(() => {
        consumer.onApplicationShutdown();
        return Promise.resolve({ Messages: [] });
      });

      consumer.onModuleInit();
      await jest.advanceTimersByTimeAsync(1000);

      expect(send).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    },
  );
});
