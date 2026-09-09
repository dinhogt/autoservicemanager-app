import * as Joi from 'joi';
import {
  FORBIDDEN_JWT_SECRETS,
  FORBIDDEN_WEBHOOK_SECRETS,
  isForbiddenDatabaseUrl,
} from '../security/forbidden-secrets';

function nodeEnvFromHelpers(helpers: Joi.CustomHelpers): string | undefined {
  const ancestors = helpers.state.ancestors as Array<{ NODE_ENV?: string }>;
  return ancestors[0]?.NODE_ENV;
}

function rejectForbiddenInProduction(
  value: string,
  forbidden: readonly string[],
  helpers: Joi.CustomHelpers,
) {
  if (
    nodeEnvFromHelpers(helpers) === 'production' &&
    forbidden.includes(value)
  ) {
    return helpers.error('any.invalid');
  }
  return value;
}

/**
 * Validates environment variables at application bootstrap.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  /** MySQL connection string for Prisma (required). */
  DATABASE_URL: Joi.string()
    .required()
    .custom((value: string, helpers) => {
      if (
        nodeEnvFromHelpers(helpers) === 'production' &&
        isForbiddenDatabaseUrl(value)
      ) {
        return helpers.error('any.invalid');
      }
      return value;
    }),

  /** Shadow database for Prisma migrate dev (optional). */
  SHADOW_DATABASE_URL: Joi.string().optional().allow(''),

  /** Namespace suffix for CloudWatch EMF (optional; default NODE_ENV). */
  METRICS_ENVIRONMENT: Joi.string().optional().allow(''),
  APP_ENVIRONMENT: Joi.string().optional().allow(''),

  /** SNS topic for serverless notifications (optional — SMTP fallback local). */
  OS_NOTIFICATIONS_TOPIC_ARN: Joi.string().optional().allow(''),
  AWS_REGION: Joi.string().optional().allow(''),

  /** Minimum length enforced for JWT signing (auth phase). */
  JWT_SECRET: Joi.string()
    .min(16)
    .required()
    .custom((value: string, helpers) =>
      rejectForbiddenInProduction(value, FORBIDDEN_JWT_SECRETS, helpers),
    ),

  /** Comma-separated CORS allowlist — required in production. */
  CORS_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .required()
      .custom((value: string, helpers) => {
        const origins = value
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
        if (origins.length === 0 || origins.includes('*')) {
          return helpers.error('any.invalid');
        }
        return value;
      }),
    otherwise: Joi.string().optional().allow(''),
  }),

  /** Swagger UI — off by default in production. */
  SWAGGER_ENABLED: Joi.string().valid('true', 'false').optional(),

  /**
   * When true in production, CLIENTE routes require header `x-gateway-verified`
   * set by API Gateway integration (T1 fail-closed).
   */
  REQUIRE_GATEWAY_HEADERS: Joi.string().valid('true', 'false').optional(),

  /** E-mail outbound (optional; false em test/dev sem SMTP). */
  EMAIL_ENABLED: Joi.string().valid('true', 'false').default('false'),
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().email().optional().allow(''),

  /** Secret para webhook de atualização de status (opcional até configurar). */
  WEBHOOK_SECRET: Joi.string()
    .min(16)
    .optional()
    .allow('')
    .custom((value: string | undefined, helpers) => {
      if (!value) {
        return value;
      }
      return rejectForbiddenInProduction(
        value,
        FORBIDDEN_WEBHOOK_SECRETS,
        helpers,
      );
    }),

  /** Logs JSON (default em production). */
  LOG_FORMAT: Joi.string().valid('json', 'pretty').optional(),

  /** AWS X-Ray SDK (DaemonSet no EKS). */
  AWS_XRAY_ENABLED: Joi.string().valid('true', 'false', '1', '0').optional(),
  AWS_XRAY_CONTEXT_MISSING: Joi.string()
    .valid('LOG_ERROR', 'RUNTIME_ERROR', 'IGNORE_ERROR')
    .optional(),
  AWS_XRAY_DAEMON_ADDRESS: Joi.string().optional().allow(''),
});
