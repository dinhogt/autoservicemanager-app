import { NoopOsMongoAuditRepository } from './noop-os-mongo-audit.repository';

describe('NoopOsMongoAuditRepository', () => {
  const repo = new NoopOsMongoAuditRepository();

  it('todos os métodos resolvem sem erros', async () => {
    await expect(repo.recordDomainEvent({} as never)).resolves.toBeUndefined();
    await expect(repo.recordStatusChange({} as never)).resolves.toBeUndefined();
    await expect(repo.recordNotification({} as never)).resolves.toBeUndefined();
    await expect(repo.recordOsTransition({} as never)).resolves.toBeUndefined();
    await expect(repo.listHistorico('os-1')).resolves.toEqual([]);
  });
});
