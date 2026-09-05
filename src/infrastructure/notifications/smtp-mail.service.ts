import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SmtpMailPayload {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class SmtpMailService {
  private readonly logger = new Logger(SmtpMailService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<string>('EMAIL_ENABLED') === 'true';
  }

  /**
   * Envia e-mail via SMTP (best-effort). Não propaga erros para não
   * reverter transações de negócio já commitadas.
   */
  async sendMail(payload: SmtpMailPayload): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    const to = payload.to.trim();
    if (!to || !to.includes('@')) {
      this.logger.warn(`Destinatário sem e-mail válido: ${payload.to}`);
      return false;
    }

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST não configurado; e-mail não enviado');
      return false;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'noreply@autoservice.local';

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user ? { user, pass } : undefined,
      });

      await transporter.sendMail({
        from,
        to,
        subject: payload.subject,
        text: payload.text,
      });

      this.logger.log(`E-mail enviado para ${to}: ${payload.subject}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${message}`);
      return false;
    }
  }
}
