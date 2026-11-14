import {
  MESSAGE_SCHEMA_VERSION,
  SagaCommandType,
  SagaEventType,
  parseSagaCommandEnvelope,
  parseSagaEventEnvelope,
} from './messaging';

const valid = {
  schemaVersion: MESSAGE_SCHEMA_VERSION,
  messageId: 'evt-1',
  messageType: SagaEventType.DiagnosisCompleted,
  occurredAt: '2026-09-22T20:00:00.000Z',
  correlationId: 'corr-1',
  aggregateId: 'os-1',
  source: 'execution',
  payload: { total: 100 },
};

describe('versioned messaging contracts', () => {
  it('parses a valid saga event', () => {
    expect(parseSagaEventEnvelope(valid)).toEqual(valid);
  });

  it('parses a valid saga command', () => {
    const command = {
      ...valid,
      messageType: SagaCommandType.StartExecution,
    };
    expect(parseSagaCommandEnvelope(command)).toEqual(command);
  });

  it.each([
    [null, 'object'],
    [{ ...valid, schemaVersion: '2.0' }, 'version'],
    [{ ...valid, messageId: '' }, 'messageId'],
    [{ ...valid, occurredAt: 'invalid' }, 'ISO-8601'],
    [{ ...valid, payload: null }, 'payload'],
    [{ ...valid, messageType: 'unknown' }, 'Unsupported'],
  ])('rejects malformed events', (input, message) => {
    expect(() => parseSagaEventEnvelope(input)).toThrow(message);
  });

  it('rejects an event when parsed as a command', () => {
    expect(() => parseSagaCommandEnvelope(valid)).toThrow(
      'Unsupported saga command',
    );
  });
});
