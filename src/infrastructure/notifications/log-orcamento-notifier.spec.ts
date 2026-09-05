import { Logger } from '@nestjs/common';
import { LogOrcamentoNotifier } from './log-orcamento-notifier';

describe('LogOrcamentoNotifier', () => {
  it('loga payload da notificação', async () => {
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const notifier = new LogOrcamentoNotifier();
    await notifier.enviar({
      ordemServicoId: 'os1',
      clienteNome: 'João',
      clienteContato: 'joao@x.com',
      total: 250,
      linkAprovacao: 'https://example.com/aprovar/os1',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('OrcamentoEnviadoParaCliente');
    expect(spy.mock.calls[0][0]).toContain('osId=os1');
    expect(spy.mock.calls[0][0]).toContain('total=250');
    spy.mockRestore();
  });
});
