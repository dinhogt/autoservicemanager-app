import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { isValidCpfCnpj, onlyDigits } from '@autoservicemanager/domain-shared';
import { AppRole } from '../../domain/autenticacao/entities/app-role';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

const HEADER_CPF = 'x-cpf';
const HEADER_SCOPE = 'x-scope';
const HEADER_GATEWAY_VERIFIED = 'x-gateway-verified';

/**
 * Confia nos headers injetados pelo JWT Authorizer (API Gateway) após VPC Link.
 * Não revalida assinatura RS256 — ver ADR-007 / threat-model T1.
 * Em production com REQUIRE_GATEWAY_HEADERS=true exige `x-gateway-verified: 1`.
 * Falha de credencial/header → `false` (403 Forbidden).
 */
@Injectable()
export class ClienteAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.includes(AppRole.CLIENTE)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: unknown;
    }>();

    if (!this.isGatewayTrusted(request.headers)) {
      return false;
    }

    const rawCpf = headerValue(request.headers[HEADER_CPF]);
    if (!rawCpf) {
      return false;
    }

    const cpf = onlyDigits(rawCpf);
    if (!isValidCpfCnpj(cpf)) {
      return false;
    }

    const scope = headerValue(request.headers[HEADER_SCOPE]);
    if (scope && scope.toLowerCase() !== 'cliente') {
      return false;
    }

    request.user = {
      role: AppRole.CLIENTE,
      userId: cpf,
      cpf,
    };
    return true;
  }

  private isGatewayTrusted(
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const requireGateway =
      this.config.get<string>('REQUIRE_GATEWAY_HEADERS') === 'true';
    if (nodeEnv !== 'production' || !requireGateway) {
      return true;
    }
    return headerValue(headers[HEADER_GATEWAY_VERIFIED]) === '1';
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
