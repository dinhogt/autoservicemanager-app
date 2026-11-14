import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class SagaEventsSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('SAGA_EVENTS_SECRET');
    const provided = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-saga-secret');
    if (!expected || !provided || !safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid saga events secret');
    }
    return true;
  }
}

function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
