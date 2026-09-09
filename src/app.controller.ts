import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './infrastructure/auth/public.decorator';
import { AppService } from './app.service';

@ApiTags('App')
@Public()
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Liveness — sem dependência externa (probes K8s). */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Readiness exposto no API Gateway (`GET /health`) — ping MySQL. */
  @Get('health')
  getHealth() {
    return this.appService.checkReady();
  }
}
