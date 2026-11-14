import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SagaOrchestratorService } from '../../../../application/saga/saga-orchestrator.service';
import { Public } from '../../../../infrastructure/auth/public.decorator';
import { SagaEventsSecretGuard } from '../../../../infrastructure/auth/saga-events-secret.guard';

@Public()
@UseGuards(SagaEventsSecretGuard)
@ApiExcludeController()
@Controller('internal/sagas')
export class SagaEventsController {
  constructor(private readonly orchestrator: SagaOrchestratorService) {}

  @Post()
  start(
    @Body()
    body: {
      ordemServicoId: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.orchestrator.start(body);
  }

  @Post('events')
  consume(@Body() body: unknown) {
    return this.orchestrator.consume(body);
  }

  @Get(':correlationId')
  find(@Param('correlationId') correlationId: string) {
    return this.orchestrator.findByCorrelationId(correlationId);
  }
}
