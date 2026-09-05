import { CompositeOrcamentoNotifier } from './composite-orcamento-notifier';
import { EmailOrcamentoNotifier } from './email-orcamento-notifier';
import { LogOrcamentoNotifier } from './log-orcamento-notifier';

describe('CompositeOrcamentoNotifier', () => {
  const payload = {
    ordemServicoId: 'os-1',
    clienteNome: 'João',
    clienteContato: 'joao@test.com',
    total: 100,
    linkAprovacao: '/ordens-servico/os-1/aprovacoes',
  };

  it('chama log e email notifiers', async () => {
    const logNotifier = {
      enviar: jest.fn().mockResolvedValue(undefined),
    } as unknown as LogOrcamentoNotifier;
    const emailNotifier = {
      enviar: jest.fn().mockResolvedValue(undefined),
    } as unknown as EmailOrcamentoNotifier;

    const composite = new CompositeOrcamentoNotifier(
      logNotifier,
      emailNotifier,
    );
    await composite.enviar(payload);

    expect(logNotifier.enviar).toHaveBeenCalledWith(payload);
    expect(emailNotifier.enviar).toHaveBeenCalledWith(payload);
  });
});
