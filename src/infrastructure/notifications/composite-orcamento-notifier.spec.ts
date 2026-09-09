import { ConfigService } from '@nestjs/config';
import { CompositeOrcamentoNotifier } from './composite-orcamento-notifier';
import { EmailOrcamentoNotifier } from './email-orcamento-notifier';
import { LogOrcamentoNotifier } from './log-orcamento-notifier';
import { SnsOrcamentoNotifier } from './sns-orcamento-notifier';

describe('CompositeOrcamentoNotifier', () => {
  const payload = {
    ordemServicoId: 'os-1',
    clienteNome: 'João',
    clienteContato: 'joao@test.com',
    total: 100,
    linkAprovacao: '/ordens-servico/os-1/aprovacoes',
  };

  it('com SNS: log + sns', async () => {
    const log = jest.fn().mockResolvedValue(undefined);
    const sns = jest.fn().mockResolvedValue(undefined);
    const email = jest.fn().mockResolvedValue(undefined);
    const composite = new CompositeOrcamentoNotifier(
      { enviar: log } as unknown as LogOrcamentoNotifier,
      { enviar: sns } as unknown as SnsOrcamentoNotifier,
      { enviar: email } as unknown as EmailOrcamentoNotifier,
      { get: () => 'arn:aws:sns:us-east-1:1:t' } as unknown as ConfigService,
    );
    await composite.enviar(payload);
    expect(log).toHaveBeenCalled();
    expect(sns).toHaveBeenCalled();
    expect(email).not.toHaveBeenCalled();
  });

  it('sem SNS: log + email fallback', async () => {
    const log = jest.fn().mockResolvedValue(undefined);
    const sns = jest.fn().mockResolvedValue(undefined);
    const email = jest.fn().mockResolvedValue(undefined);
    const composite = new CompositeOrcamentoNotifier(
      { enviar: log } as unknown as LogOrcamentoNotifier,
      { enviar: sns } as unknown as SnsOrcamentoNotifier,
      { enviar: email } as unknown as EmailOrcamentoNotifier,
      { get: () => undefined } as unknown as ConfigService,
    );
    await composite.enviar(payload);
    expect(email).toHaveBeenCalled();
    expect(sns).not.toHaveBeenCalled();
  });
});
