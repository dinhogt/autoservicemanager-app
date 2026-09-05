import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../../domain/autenticacao/entities/app-role';
import { ClienteAuthGuard } from './cliente-auth.guard';

describe('ClienteAuthGuard', () => {
  let guard: ClienteAuthGuard;
  let reflector: Reflector;
  let config: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();
    config = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'NODE_ENV') {
          return 'test';
        }
        if (key === 'REQUIRE_GATEWAY_HEADERS') {
          return 'false';
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;
    guard = new ClienteAuthGuard(reflector, config);
  });

  function createContext(
    headers: Record<string, string> = {},
  ): ExecutionContext & {
    request: { headers: Record<string, string>; user?: unknown };
  } {
    const request = { headers, user: undefined as unknown };
    return {
      request,
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext & {
      request: { headers: Record<string, string>; user?: unknown };
    };
  }

  it('ignora rotas públicas', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('ignora rotas sem role CLIENTE', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.ADMIN]);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('autentica CLIENTE com x-cpf válido', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);
    const ctx = createContext({
      'x-cpf': '529.982.247-25',
      'x-scope': 'cliente',
    });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(ctx.request.user).toEqual({
      role: AppRole.CLIENTE,
      userId: '52998224725',
      cpf: '52998224725',
    });
  });

  it('rejeita ausência de x-cpf com false (403)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);
    expect(guard.canActivate(createContext())).toBe(false);
  });

  it('rejeita x-cpf inválido com false (403)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);
    expect(guard.canActivate(createContext({ 'x-cpf': '11111111111' }))).toBe(
      false,
    );
  });

  it('rejeita x-scope inválido com false (403)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);
    expect(
      guard.canActivate(
        createContext({ 'x-cpf': '52998224725', 'x-scope': 'admin' }),
      ),
    ).toBe(false);
  });

  it('em production com REQUIRE_GATEWAY_HEADERS exige x-gateway-verified', () => {
    jest.spyOn(config, 'get').mockImplementation((key: string) => {
      if (key === 'NODE_ENV') {
        return 'production';
      }
      if (key === 'REQUIRE_GATEWAY_HEADERS') {
        return 'true';
      }
      return undefined;
    });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);

    expect(
      guard.canActivate(
        createContext({ 'x-cpf': '52998224725', 'x-scope': 'cliente' }),
      ),
    ).toBe(false);

    const ctx = createContext({
      'x-cpf': '52998224725',
      'x-scope': 'cliente',
      'x-gateway-verified': '1',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
