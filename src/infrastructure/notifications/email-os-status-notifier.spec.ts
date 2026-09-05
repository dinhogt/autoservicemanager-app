import { StatusOs } from '../../domain/atendimento/value-objects/status-os.enum';
import { EmailOsStatusNotifier } from './email-os-status-notifier';
import { SmtpMailService } from './smtp-mail.service';

describe('EmailOsStatusNotifier', () => {
  const sendMail = jest.fn().mockResolvedValue(true);
  const smtpMail = { sendMail } as unknown as SmtpMailService;
  const notifier = new EmailOsStatusNotifier(smtpMail);

  it('delega envio ao SmtpMailService com assunto e corpo de status', async () => {
    await notifier.notificarMudancaStatus({
      ordemServicoId: 'os-1',
      clienteNome: 'Maria',
      clienteContato: 'maria@test.com',
      statusAnterior: StatusOs.RECEBIDA,
      statusNovo: StatusOs.EM_DIAGNOSTICO,
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@test.com',
        subject: expect.stringContaining('os-1'),
        text: expect.stringContaining('Maria'),
      }),
    );
  });
});
