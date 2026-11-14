import { emitJourneyMetric } from './business-metrics';

describe('journey EMF telemetry', () => {
  it('emits dimensions and complete asynchronous context', () => {
    const write = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

    emitJourneyMetric({
      event: 'saga_step_processed',
      metric: 'SagaStepDuration',
      unit: 'Milliseconds',
      value: 42,
      operation: 'diagnosis.completed',
      outcome: 'applied',
      correlationId: 'corr-1',
      sagaId: 'saga-1',
      messageId: 'message-1',
      aggregateId: 'order-1',
      durationMs: 42,
    });

    const payload = JSON.parse(String(write.mock.calls[0][0])) as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      service: 'os',
      correlationId: 'corr-1',
      sagaId: 'saga-1',
      messageId: 'message-1',
      aggregateId: 'order-1',
      SagaStepDuration: 42,
      durationMs: 42,
    });
    expect(payload._aws).toBeDefined();
    write.mockRestore();
  });
});
