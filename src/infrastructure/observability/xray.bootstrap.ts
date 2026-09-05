import { Logger } from '@nestjs/common';

const logger = new Logger('XRay');

type ExpressMw = (
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) => void;

interface XRaySegment {
  trace_id: string;
  parent_id: string;
  close: () => void;
}

interface XRayNamespace {
  run: (fn: () => void) => void;
}

interface XRaySdk {
  captureHTTPsGlobal: (
    mod: typeof import('node:http') | typeof import('node:https'),
  ) => void;
  setContextMissingStrategy: (strategy: 'LOG_ERROR' | 'RUNTIME_ERROR') => void;
  Segment: new (name: string) => XRaySegment;
  utils?: {
    processTraceData: (header: string) => { root?: string; parent?: string };
  };
  getNamespace: () => XRayNamespace;
  setSegment: (segment: XRaySegment) => void;
}

/** aws-xray-sdk-core ESM: `import()` expõe API em `.default`. */
async function loadXRaySdk(): Promise<XRaySdk> {
  const mod = await import('aws-xray-sdk-core');
  const sdk = (mod as { default?: XRaySdk }).default ?? (mod as XRaySdk);
  return sdk;
}

function isXRayEnabled(): boolean {
  return (
    process.env.AWS_XRAY_ENABLED === 'true' ||
    process.env.AWS_XRAY_ENABLED === '1'
  );
}

/**
 * Instrumenta HTTP outbound quando AWS_XRAY_ENABLED=true.
 */
export async function bootstrapXRay(): Promise<boolean> {
  if (!isXRayEnabled()) {
    return false;
  }

  try {
    const AWSXRay = await loadXRaySdk();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const http = require('node:http') as typeof import('node:http');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const https = require('node:https') as typeof import('node:https');
    AWSXRay.captureHTTPsGlobal(http);
    AWSXRay.captureHTTPsGlobal(https);
    AWSXRay.setContextMissingStrategy(
      (process.env.AWS_XRAY_CONTEXT_MISSING as 'LOG_ERROR' | 'RUNTIME_ERROR') ||
        'LOG_ERROR',
    );
    logger.log('AWS X-Ray SDK enabled');
    return true;
  } catch (err) {
    logger.warn(
      `AWS X-Ray SDK failed to load: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

export async function openXRaySegmentMiddleware(
  serviceName: string,
): Promise<ExpressMw | undefined> {
  if (!isXRayEnabled()) {
    return undefined;
  }
  try {
    const AWSXRay = await loadXRaySdk();
    if (typeof AWSXRay.Segment !== 'function') {
      logger.warn('AWS X-Ray Segment API unavailable; middleware skipped');
      return undefined;
    }
    return (req, res, next) => {
      const raw = req.headers['x-amzn-trace-id'];
      const headerStr = Array.isArray(raw) ? raw[0] : raw;
      const segment = new AWSXRay.Segment(serviceName);
      if (headerStr && typeof AWSXRay.utils?.processTraceData === 'function') {
        try {
          const incoming = AWSXRay.utils.processTraceData(headerStr);
          if (incoming?.root) {
            segment.trace_id = incoming.root;
          }
          if (incoming?.parent) {
            segment.parent_id = incoming.parent;
          }
        } catch {
          /* header malformado: segue com novo segment */
        }
      }
      const ns = AWSXRay.getNamespace();
      ns.run(() => {
        AWSXRay.setSegment(segment);
        res.on('finish', () => {
          segment.close();
        });
        next();
      });
    };
  } catch {
    return undefined;
  }
}
