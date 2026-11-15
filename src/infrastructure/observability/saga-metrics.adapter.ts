import { Injectable } from '@nestjs/common';
import type { SagaMetricsPort } from '../../domain/saga/saga.ports';
import { emitJourneyMetric } from './business-metrics';

@Injectable()
export class SagaMetricsAdapter implements SagaMetricsPort {
  journey(
    input: Parameters<SagaMetricsPort['journey']>[0],
  ): void {
    emitJourneyMetric(input);
  }
}
