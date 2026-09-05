import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  correlationId: string;
  traceHeader?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function getTraceHeader(): string | undefined {
  return requestContext.getStore()?.traceHeader;
}
