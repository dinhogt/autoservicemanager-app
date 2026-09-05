import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpMailService } from './smtp-mail.service';

jest.mock('nodemailer');

describe('SmtpMailService', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
  const createTransport = jest.mocked(nodemailer.createTransport);

  beforeEach(() => {
    jest.clearAllMocks();
    createTransport.mockReturnValue({ sendMail } as never);
  });

  function makeService(config: Record<string, string | number | undefined>) {
    const configService = {
      get: <T>(key: string): T | undefined => config[key] as T | undefined,
    } as ConfigService;
    return new SmtpMailService(configService);
  }

  it('isEnabled retorna true somente quando EMAIL_ENABLED é "true"', () => {
    expect(makeService({ EMAIL_ENABLED: 'true' }).isEnabled()).toBe(true);
    expect(makeService({ EMAIL_ENABLED: 'false' }).isEnabled()).toBe(false);
    expect(makeService({}).isEnabled()).toBe(false);
  });

  it('retorna false quando EMAIL_ENABLED não é true', async () => {
    const service = makeService({ EMAIL_ENABLED: 'false' });
    const result = await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('retorna false quando destinatário não tem @', async () => {
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
    });
    const result = await service.sendMail({
      to: 'telefone',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('retorna false quando destinatário fica vazio após trim', async () => {
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
    });
    const result = await service.sendMail({
      to: '   ',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
  });

  it('retorna false quando SMTP_HOST ausente', async () => {
    const service = makeService({ EMAIL_ENABLED: 'true' });
    const result = await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
  });

  it('envia e-mail quando configurado corretamente com SMTP_PORT numérico', async () => {
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'sandbox.smtp.mailtrap.io',
      SMTP_PORT: 587,
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      EMAIL_FROM: 'from@test.com',
    });
    const result = await service.sendMail({
      to: 'cliente@test.com',
      subject: 'Assunto',
      text: 'Corpo',
    });
    expect(result).toBe(true);
    expect(createTransport).toHaveBeenCalledWith({
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'from@test.com',
      to: 'cliente@test.com',
      subject: 'Assunto',
      text: 'Corpo',
    });
  });

  it('usa porta padrão 587 e EMAIL_FROM default quando omitidos', async () => {
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
    });
    await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.test',
      port: 587,
      secure: false,
      auth: undefined,
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@autoservice.local',
      }),
    );
  });

  it('habilita secure quando SMTP_PORT é 465', async () => {
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: 465,
    });
    await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true,
      }),
    );
  });

  it('não propaga erro do SMTP (Error)', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP down'));
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: 587,
    });
    const result = await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
  });

  it('não propaga erro do SMTP (valor não-Error)', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    sendMail.mockRejectedValueOnce('falha-string');
    const service = makeService({
      EMAIL_ENABLED: 'true',
      SMTP_HOST: 'smtp.test',
    });
    const result = await service.sendMail({
      to: 'a@b.com',
      subject: 's',
      text: 't',
    });
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('falha-string'),
    );
    errorSpy.mockRestore();
  });
});
