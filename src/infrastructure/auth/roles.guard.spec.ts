import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../../domain/autenticacao/entities/app-role';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createContext(userRole?: AppRole): ExecutionContext {
    const request = userRole ? { user: { role: userRole } } : {};
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('permite acesso quando rota é pública', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);

    const ctx = createContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acesso quando nenhuma role é exigida', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(undefined);

    const ctx = createContext(AppRole.ATENDENTE);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acesso quando usuário tem role correta', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.ADMIN, AppRole.GERENTE]);

    const ctx = createContext(AppRole.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite CLIENTE quando exigido', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.CLIENTE]);

    const ctx = createContext(AppRole.CLIENTE);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('nega acesso quando usuário não tem role exigida', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.ADMIN]);

    const ctx = createContext(AppRole.ATENDENTE);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('nega acesso quando não há usuário no request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([AppRole.ADMIN]);

    const ctx = createContext();
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
