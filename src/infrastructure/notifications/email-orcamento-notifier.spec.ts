import { EmailOrcamentoNotifier } from './email-orcamento-notifier';
import { SmtpMailService } from './smtp-mail.service';

describe('EmailOrcamentoNotifier', () => {
  const sendMail = jest.fn().mockResolvedValue(true);
  const smtpMail = { sendMail } as unknown as SmtpMailService;
  const notifier = new EmailOrcamentoNotifier(smtpMail);

  it('delega envio ao SmtpMailService com dados do orçamento', async () => {
    await notifier.enviar({
      ordemServicoId: 'os-1',
      clienteNome: 'João',
      clienteContato: 'joao@test.com',
      total: 250.5,
      linkAprovacao: '/ordens-servico/os-1/aprovacoes',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joao@test.com',
        subject: expect.stringContaining('os-1'),
        text: expect.stringContaining('250.50'),
      }),
    );
  });
});
