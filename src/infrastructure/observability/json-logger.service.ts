import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { getCorrelationId, getTraceHeader } from './request-context';
import { extractRootFromAmznTrace } from './trace.middleware';
import { redactLogText } from '../security/log-redact';

@Injectable()
export class JsonLogger implements LoggerService {
  private static readonly levels: LogLevel[] = [
    'error',
    'warn',
    'log',
    'debug',
    'verbose',
  ];

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams);
  }

  private write(
    level: string,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const context =
      typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined;
    const stack =
      level === 'error' && typeof optionalParams[0] === 'string'
        ? optionalParams.find(
            (p, i) =>
              i > 0 && typeof p === 'string' && String(p).includes('\n'),
          )
        : undefined;

    let textMessage: string;
    let event: string | undefined;
    if (
      typeof message === 'object' &&
      message !== null &&
      !Array.isArray(message)
    ) {
      const record = message as Record<string, unknown>;
      event = typeof record.event === 'string' ? record.event : undefined;
      textMessage =
        typeof record.message === 'string'
          ? redactLogText(record.message)
          : redactLogText(JSON.stringify(message));
    } else {
      textMessage =
        typeof message === 'string'
          ? redactLogText(message)
          : redactLogText(JSON.stringify(message));
    }

    const traceHeader = getTraceHeader();
    const payload = {
      level,
      message: textMessage,
      context,
      correlationId: getCorrelationId(),
      xrayTraceId: extractRootFromAmznTrace(traceHeader),
      timestamp: new Date().toISOString(),
      ...(event ? { event } : {}),
      ...(typeof stack === 'string' ? { stack } : {}),
    };
    const line = `${JSON.stringify(payload)}\n`;
    if (level === 'error') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  }
}
