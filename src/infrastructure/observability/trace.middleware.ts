import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from './request-context';

export const TRACE_HEADER = 'x-amzn-trace-id';
export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Propaga X-Amzn-Trace-Id e correlationId (ALS) para logs / X-Ray.
 */
@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingTrace = header(req, TRACE_HEADER);
    const incomingCorrelation = header(req, CORRELATION_HEADER);
    const correlationId =
      incomingCorrelation ||
      extractRootFromAmznTrace(incomingTrace) ||
      randomUUID();

    if (incomingTrace) {
      res.setHeader(TRACE_HEADER, incomingTrace);
    }
    res.setHeader(CORRELATION_HEADER, correlationId);

    const augmented = req as Request & {
      correlationId?: string;
      amznTraceId?: string;
    };
    augmented.correlationId = correlationId;
    if (incomingTrace) {
      augmented.amznTraceId = incomingTrace;
    }

    requestContext.run({ correlationId, traceHeader: incomingTrace }, () =>
      next(),
    );
  }
}

function header(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' ? value : undefined;
}

/** Root=1-... do header AWS; fallback undefined. */
export function extractRootFromAmznTrace(
  headerValue?: string,
): string | undefined {
  if (!headerValue) {
    return undefined;
  }
  const match = /Root=([^;]+)/i.exec(headerValue);
  return match?.[1];
}
