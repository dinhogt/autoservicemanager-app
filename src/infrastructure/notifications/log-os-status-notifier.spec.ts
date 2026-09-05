import { LogOsStatusNotifier } from './log-os-status-notifier';
import { StatusOs } from '../../domain/atendimento/value-objects/status-os.enum';

describe('LogOsStatusNotifier', () => {
  it('loga mudança de status', async () => {
    const notifier = new LogOsStatusNotifier();
    await expect(
      notifier.notificarMudancaStatus({
        ordemServicoId: 'os-1',
        clienteNome: 'Maria',
        clienteContato: 'maria@test.com',
        statusAnterior: StatusOs.RECEBIDA,
        statusNovo: StatusOs.EM_DIAGNOSTICO,
      }),
    ).resolves.toBeUndefined();
  });
});
