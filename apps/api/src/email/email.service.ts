import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { AllConfigType } from '../config/config.type';

export type EmailLogStatus = 'sent' | 'failed' | 'pending';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  sentAt: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logs: EmailLog[] = [];

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('mail.host', { infer: true }),
      port: configService.get('mail.port', { infer: true }),
      ignoreTLS: configService.get('mail.ignoreTLS', { infer: true }),
      secure: configService.get('mail.secure', { infer: true }),
      requireTLS: configService.get('mail.requireTLS', { infer: true }),
      auth: {
        user: configService.get('mail.user', { infer: true }),
        pass: configService.get('mail.password', { infer: true }),
      },
    });
  }

  async send(to: string, subject: string, body: string): Promise<EmailLog> {
    const log: EmailLog = {
      id: randomUUID(),
      recipient: to,
      subject,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };
    this.logs.push(log);

    try {
      const defaultName = this.configService.get('mail.defaultName', {
        infer: true,
      });
      const defaultEmail = this.configService.get('mail.defaultEmail', {
        infer: true,
      });
      await this.transporter.sendMail({
        from: `"${defaultName}" <${defaultEmail}>`,
        to,
        subject,
        html: body,
      });
      log.status = 'sent';
    } catch {
      log.status = 'failed';
    }

    return log;
  }

  getLogs(): EmailLog[] {
    return this.logs;
  }
}
