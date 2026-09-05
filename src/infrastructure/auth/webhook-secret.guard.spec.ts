import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookSecretGuard } from './webhook-secret.guard';

describe('WebhookSecretGuard', () => {
  const makeContext = (header?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          header: (name: string) =>
            name === 'x-webhook-secret' ? header : undefined,
        }),
      }),
    }) as ExecutionContext;

  it('lança quando WEBHOOK_SECRET não configurado', () => {
    const guard = new WebhookSecretGuard({
      get: () => undefined,
    } as ConfigService);
    expect(() => guard.canActivate(makeContext('secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('lança quando header ausente', () => {
    const guard = new WebhookSecretGuard({
      get: () => 'expected-secret-min-16-chars',
    } as ConfigService);
    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('lança quando header inválido', () => {
    const guard = new WebhookSecretGuard({
      get: () => 'expected-secret-min-16-chars',
    } as ConfigService);
    expect(() => guard.canActivate(makeContext('wrong'))).toThrow(
      UnauthorizedException,
    );
  });

  it('permite quando secret válido', () => {
    const guard = new WebhookSecretGuard({
      get: () => 'expected-secret-min-16-chars',
    } as ConfigService);
    expect(guard.canActivate(makeContext('expected-secret-min-16-chars'))).toBe(
      true,
    );
  });
});
