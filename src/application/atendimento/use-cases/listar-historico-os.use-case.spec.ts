import { NotFoundException } from '@nestjs/common';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import { ListarHistoricoOsUseCase } from './listar-historico-os.use-case';

describe('ListarHistoricoOsUseCase', () => {
  const listHistorico = jest.fn().mockResolvedValue([
    {
      id: '1',
      kind: 'domain_event' as const,
      at: new Date().toISOString(),
      eventType: 'OsCriada',
    },
  ]);
  const audit: OsMongoAuditPort = {
    recordDomainEvent: jest.fn(),
    recordStatusChange: jest.fn(),
    recordNotification: jest.fn(),
    recordOsTransition: jest.fn(),
    listHistorico,
  };

  it('404 quando OS não existe', async () => {
    const ordensRead = {
      existsById: jest.fn().mockResolvedValue(false),
    } as unknown as OrdemServicoReadPort;
    const uc = new ListarHistoricoOsUseCase(ordensRead, audit);
    await expect(uc.execute('x')).rejects.toThrow(NotFoundException);
  });

  it('delega listagem ao audit', async () => {
    const ordensRead = {
      existsById: jest.fn().mockResolvedValue(true),
    } as unknown as OrdemServicoReadPort;
    const uc = new ListarHistoricoOsUseCase(ordensRead, audit);
    const items = await uc.execute('os-1');
    expect(listHistorico).toHaveBeenCalledWith('os-1');
    expect(items).toHaveLength(1);
  });
});
