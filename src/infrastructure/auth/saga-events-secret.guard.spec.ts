import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SagaEventsSecretGuard } from './saga-events-secret.guard';

function context(header?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        header: () => header,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('SagaEventsSecretGuard', () => {
  it('accepts the configured internal secret', () => {
    const config = {
      get: () => 'a-secure-saga-secret',
    } as unknown as ConfigService;
    expect(
      new SagaEventsSecretGuard(config).canActivate(
        context('a-secure-saga-secret'),
      ),
    ).toBe(true);
  });

  it.each([undefined, 'wrong', 'different-length-secret'])(
    'rejects an absent or invalid secret',
    (provided) => {
      const config = {
        get: () => 'a-secure-saga-secret',
      } as unknown as ConfigService;
      expect(() =>
        new SagaEventsSecretGuard(config).canActivate(context(provided)),
      ).toThrow(UnauthorizedException);
    },
  );

  it('fails closed when integration is not configured', () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    expect(() =>
      new SagaEventsSecretGuard(config).canActivate(context('anything')),
    ).toThrow(UnauthorizedException);
  });
});
