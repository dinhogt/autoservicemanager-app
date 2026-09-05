import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  ValidationPipe,
  INestApplication,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { isValidCpfCnpj, onlyDigits } from '@dinhogt/domain-shared';
import { AppRole } from '../../../src/domain/autenticacao/entities/app-role';
import { RoleAdmin } from '../../../src/domain/autenticacao/entities/usuario-admin.entity';
import { ClienteAuthGuard } from '../../../src/infrastructure/auth/cliente-auth.guard';
import { JwtAuthGuard } from '../../../src/infrastructure/auth/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../../src/infrastructure/auth/public.decorator';
import { ROLES_KEY } from '../../../src/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../src/infrastructure/auth/roles.guard';

/**
 * Substitui JwtAuthGuard + ClienteAuthGuard nos testes de controller.
 * - `@Public()` libera
 * - role CLIENTE via `x-test-user-role: CLIENTE` + `x-cpf`, ou só `x-cpf` em rota CLIENTE
 * - staff via `x-test-user-role`
 */
@Injectable()
export class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: unknown;
    }>();

    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const testRole = req.headers['x-test-user-role'];
    const rawCpf = req.headers['x-cpf'];

    if (requiredRoles?.includes(AppRole.CLIENTE) || testRole === 'CLIENTE') {
      if (!rawCpf) {
        return false;
      }
      const cpf = onlyDigits(rawCpf);
      if (!isValidCpfCnpj(cpf)) {
        return false;
      }
      req.user = { role: AppRole.CLIENTE, userId: cpf, cpf };
      return true;
    }

    if (req.user && (req.user as { role?: AppRole }).role === AppRole.CLIENTE) {
      return true;
    }

    const role = testRole as RoleAdmin | undefined;
    if (!role) return false;
    req.user = { userId: 'test-admin', email: 'admin@test', role };
    return true;
  }
}

export interface BuildAppOptions {
  controllers: Type[];
  providers?: Array<{ provide: unknown; useValue: unknown } | Type>;
}

export async function buildControllerApp(
  options: BuildAppOptions,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: options.controllers,
    providers: [
      ...(options.providers ?? []),
      Reflector,
      { provide: APP_GUARD, useClass: TestJwtAuthGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(TestJwtAuthGuard)
    .overrideGuard(ClienteAuthGuard)
    .useClass(TestJwtAuthGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}
