import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { mockOrdemServicoRepository } from '../../../../test/helpers/mock-ordem-servico.repository';
import { IniciarDiagnosticoUseCase } from './iniciar-diagnostico.use-case';

describe('IniciarDiagnosticoUseCase', () => {
  function makeUc(opts: {
    findWithClienteVeiculoById?: jest.Mock;
    updateStatus?: jest.Mock;
    audit?: Partial<OsMongoAuditPort>;
  }) {
    const ordens = mockOrdemServicoRepository({
      findWithClienteVeiculoById: opts.findWithClienteVeiculoById ?? jest.fn(),
      updateStatus: opts.updateStatus ?? jest.fn(),
    });
    const orderStatusService = new OrderStatusService();
    const audit = {
      recordOsTransition: jest.fn().mockResolvedValue(undefined),
      recordNotification: jest.fn().mockResolvedValue(undefined),
      ...opts.audit,
    } as unknown as OsMongoAuditPort;
    const statusNotifier: OsStatusNotifierPort = {
      notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
    };
    return {
      uc: new IniciarDiagnosticoUseCase(
        ordens,
        orderStatusService,
        audit,
        statusNotifier,
      ),
      ordens,
      audit,
      statusNotifier,
    };
  }

  it('lança not found quando OS inexistente', async () => {
    const { uc } = makeUc({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue(null),
    });
    await expect(uc.execute('os1')).rejects.toThrow(NotFoundException);
  });

  it('lança conflict quando status atual não é RECEBIDA', async () => {
    const { uc, ordens } = makeUc({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue({
        id: 'os1',
        status: StatusOs.EM_EXECUCAO,
        clienteId: 'c1',
        veiculoId: 'v1',
        cliente: { nome: 'Maria', contato: 'a@b.com' },
      }),
    });
    await expect(uc.execute('os1')).rejects.toThrow(ConflictException);
    expect(ordens.updateStatus).not.toHaveBeenCalled();
  });

  it('transiciona para EM_DIAGNOSTICO e registra auditoria', async () => {
    const updateStatus = jest.fn().mockResolvedValue({
      id: 'os1',
      status: StatusOs.EM_DIAGNOSTICO,
      cliente: { nome: 'Maria', contato: 'a@b.com' },
    });
    const recordOsTransition = jest.fn().mockResolvedValue(undefined);
    const { uc, statusNotifier } = makeUc({
      findWithClienteVeiculoById: jest.fn().mockResolvedValue({
        id: 'os1',
        status: StatusOs.RECEBIDA,
        clienteId: 'c1',
        veiculoId: 'v1',
        cliente: { nome: 'Maria', contato: 'a@b.com' },
      }),
      updateStatus,
      audit: { recordOsTransition },
    });
    const result = await uc.execute('os1');
    expect(updateStatus).toHaveBeenCalledWith('os1', {
      status: StatusOs.EM_DIAGNOSTICO,
    });
    expect(recordOsTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        ordemServicoId: 'os1',
        fromStatus: StatusOs.RECEBIDA,
        toStatus: StatusOs.EM_DIAGNOSTICO,
        domainEvent: expect.objectContaining({
          eventType: OsDomainEventType.OsEmDiagnostico,
        }),
      }),
    );
    expect(result.status).toBe(StatusOs.EM_DIAGNOSTICO);
    expect(statusNotifier.notificarMudancaStatus).toHaveBeenCalled();
  });
});
