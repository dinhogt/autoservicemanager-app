import { SQSClient } from '@aws-sdk/client-sqs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SagaOrchestratorService } from '../../../../application/saga/saga-orchestrator.service';
import {
  BILLING_COMMAND_PORT,
  EXECUTION_COMMAND_PORT,
  SAGA_REPOSITORY,
} from '../../../../domain/saga/saga.ports';
import { SagaStateMachine } from '../../../../domain/saga/saga-state-machine';
import { SagaEventsSecretGuard } from '../../../../infrastructure/auth/saga-events-secret.guard';
import { PrismaSagaRepository } from '../../../../infrastructure/database/mysql/repositories/prisma-saga.repository';
import {
  BillingSqsCommandPublisher,
  ExecutionSqsCommandPublisher,
} from '../../../../infrastructure/messaging/sqs-command.publisher';
import { SqsSagaEventConsumer } from '../../../../infrastructure/messaging/sqs-saga-event.consumer';
import { SagaEventsController } from './saga-events.controller';

@Module({
  controllers: [SagaEventsController],
  providers: [
    SagaOrchestratorService,
    SagaStateMachine,
    SagaEventsSecretGuard,
    {
      provide: SQSClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new SQSClient({
          region: config.get<string>('AWS_REGION'),
          endpoint: config.get<string>('AWS_ENDPOINT_URL') || undefined,
        }),
    },
    { provide: SAGA_REPOSITORY, useClass: PrismaSagaRepository },
    {
      provide: EXECUTION_COMMAND_PORT,
      useClass: ExecutionSqsCommandPublisher,
    },
    { provide: BILLING_COMMAND_PORT, useClass: BillingSqsCommandPublisher },
    SqsSagaEventConsumer,
  ],
  exports: [SagaOrchestratorService],
})
export class SagaModule {}
