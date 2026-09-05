import { redactLogText } from './log-redact';

describe('redactLogText', () => {
  it('mascara campos sensíveis em JSON', () => {
    const input = '{"password":"secret123","event":"login"}';
    expect(redactLogText(input)).toBe(
      '{"password":"[REDACTED]","event":"login"}',
    );
  });

  it('mascara CPF parcialmente', () => {
    expect(redactLogText('cliente 52998224725')).toBe('cliente 529******25');
  });
});
