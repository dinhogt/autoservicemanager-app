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

  /** Health/readiness — sem rate limit para probes K8s e demo de HPA. */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Rota exposta no API Gateway (`GET /health`) — mesma resposta do readiness. */
  @Get('health')
  getHealth(): string {
    return this.appService.getHello();
  }
}
