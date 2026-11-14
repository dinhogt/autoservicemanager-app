import type { SagaOrchestratorService } from '../../../../application/saga/saga-orchestrator.service';
import { SagaEventsController } from './saga-events.controller';

describe('SagaEventsController', () => {
  const orchestrator = {
    start: jest.fn(),
    consume: jest.fn(),
  };
  const controller = new SagaEventsController(
    orchestrator as unknown as SagaOrchestratorService,
  );

  it('delegates saga creation', async () => {
    orchestrator.start.mockResolvedValueOnce({ id: 'saga-1' });
    const body = { ordemServicoId: 'os-1', correlationId: 'corr-1' };
    await expect(controller.start(body)).resolves.toEqual({ id: 'saga-1' });
    expect(orchestrator.start).toHaveBeenCalledWith(body);
  });

  it('delegates event ingestion without changing the AWS envelope', async () => {
    orchestrator.consume.mockResolvedValueOnce({ outcome: 'applied' });
    const body = { body: '{"Message":"..."}' };
    await expect(controller.consume(body)).resolves.toEqual({
      outcome: 'applied',
    });
    expect(orchestrator.consume).toHaveBeenCalledWith(body);
  });
});
