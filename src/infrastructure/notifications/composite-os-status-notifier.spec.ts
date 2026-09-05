import { StatusOs } from '../../domain/atendimento/value-objects/status-os.enum';
import { CompositeOsStatusNotifier } from './composite-os-status-notifier';
import { EmailOsStatusNotifier } from './email-os-status-notifier';
import { LogOsStatusNotifier } from './log-os-status-notifier';

describe('CompositeOsStatusNotifier', () => {
  const payload = {
    ordemServicoId: 'os-1',
    clienteNome: 'Maria',
    clienteContato: 'maria@test.com',
    statusAnterior: StatusOs.RECEBIDA,
    statusNovo: StatusOs.EM_DIAGNOSTICO,
  };

  it('chama log e email notifiers', async () => {
    const logNotifier = {
      notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as LogOsStatusNotifier;
    const emailNotifier = {
      notificarMudancaStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as EmailOsStatusNotifier;

    const composite = new CompositeOsStatusNotifier(logNotifier, emailNotifier);
    await composite.notificarMudancaStatus(payload);

    expect(logNotifier.notificarMudancaStatus).toHaveBeenCalledWith(payload);
    expect(emailNotifier.notificarMudancaStatus).toHaveBeenCalledWith(payload);
  });
});
