import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../../domain/autenticacao/entities/app-role';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  function makeContext(user?: { role: AppRole }): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('libera rotas marcadas como @Public()', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('libera quando usuário já autenticado como CLIENTE', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(makeContext({ role: AppRole.CLIENTE }))).toBe(
      true,
    );
  });

  it('delega para AuthGuard quando rota não é pública', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new JwtAuthGuard(reflector);
    const baseSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);
    expect(guard.canActivate(makeContext())).toBe(false);
    expect(baseSpy).toHaveBeenCalled();
    baseSpy.mockRestore();
  });
});
