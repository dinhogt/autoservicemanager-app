import { ConfigService } from '@nestjs/config';
import { StatusOs } from '../../domain/atendimento/value-objects/status-os.enum';
import { CompositeOsStatusNotifier } from './composite-os-status-notifier';
import { EmailOsStatusNotifier } from './email-os-status-notifier';
import { LogOsStatusNotifier } from './log-os-status-notifier';
import { SnsOsStatusNotifier } from './sns-os-status-notifier';

describe('CompositeOsStatusNotifier', () => {
  const payload = {
    ordemServicoId: 'os-1',
    clienteNome: 'Maria',
    clienteContato: 'maria@test.com',
    statusAnterior: StatusOs.RECEBIDA,
    statusNovo: StatusOs.EM_DIAGNOSTICO,
  };

  function make(
    topicArn: string | undefined,
  ): {
    composite: CompositeOsStatusNotifier;
    log: jest.Mock;
    sns: jest.Mock;
    email: jest.Mock;
  } {
    const log = jest.fn().mockResolvedValue(undefined);
    const sns = jest.fn().mockResolvedValue(undefined);
    const email = jest.fn().mockResolvedValue(undefined);
    const config = {
      get: jest.fn().mockReturnValue(topicArn),
    } as unknown as ConfigService;

    const composite = new CompositeOsStatusNotifier(
      { notificarMudancaStatus: log } as unknown as LogOsStatusNotifier,
      { notificarMudancaStatus: sns } as unknown as SnsOsStatusNotifier,
      { notificarMudancaStatus: email } as unknown as EmailOsStatusNotifier,
      config,
    );
    return { composite, log, sns, email };
  }

  it('com SNS topic: log + sns, sem SMTP', async () => {
    const { composite, log, sns, email } = make('arn:aws:sns:us-east-1:1:t');
    await composite.notificarMudancaStatus(payload);
    expect(log).toHaveBeenCalledWith(payload);
    expect(sns).toHaveBeenCalledWith(payload);
    expect(email).not.toHaveBeenCalled();
  });

  it('sem SNS topic: log + SMTP fallback', async () => {
    const { composite, log, sns, email } = make(undefined);
    await composite.notificarMudancaStatus(payload);
    expect(log).toHaveBeenCalledWith(payload);
    expect(sns).not.toHaveBeenCalled();
    expect(email).toHaveBeenCalledWith(payload);
  });
});
