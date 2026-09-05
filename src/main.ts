import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { JsonLogger } from './infrastructure/observability/json-logger.service';
import { OrderStatusConflictFilter } from './infrastructure/observability/order-status-conflict.filter';
import {
  bootstrapXRay,
  openXRaySegmentMiddleware,
} from './infrastructure/observability/xray.bootstrap';

function resolveCorsOrigin(
  nodeEnv: string,
  corsOriginRaw: string | undefined,
): string | string[] {
  const origins = corsOriginRaw
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (nodeEnv === 'production') {
    if (!origins?.length) {
      throw new Error('CORS_ORIGIN is required in production');
    }
    return origins;
  }

  return origins?.length ? origins : '*';
}

function isSwaggerEnabled(
  nodeEnv: string,
  swaggerEnabledRaw: string | undefined,
): boolean {
  if (swaggerEnabledRaw === 'true') {
    return true;
  }
  if (swaggerEnabledRaw === 'false') {
    return false;
  }
  return nodeEnv !== 'production';
}

async function bootstrap(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const useJsonLogs =
    process.env.LOG_FORMAT === 'json' || nodeEnv === 'production';

  const app = await NestFactory.create(AppModule, {
    bufferLogs: useJsonLogs,
    logger: useJsonLogs ? new JsonLogger() : undefined,
  });

  if (useJsonLogs) {
    app.useLogger(new JsonLogger());
  }

  app.enableShutdownHooks();

  await bootstrapXRay();
  const xrayMw = await openXRaySegmentMiddleware('autoservice-api');
  if (xrayMw) {
    app.use(xrayMw);
  }

  app.use(helmet());

  const configService = app.get(ConfigService);
  const corsOrigin = resolveCorsOrigin(
    nodeEnv,
    configService.get<string>('CORS_ORIGIN'),
  );

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new OrderStatusConflictFilter());

  if (isSwaggerEnabled(nodeEnv, configService.get<string>('SWAGGER_ENABLED'))) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AutoServiceManager API')
      .setDescription(
        'API REST de gestão de oficina. `/admin/*` exige JWT HS256. Rotas de cliente exigem headers `x-cpf`/`x-scope` (JWT Authorizer no API Gateway — ADR-007).',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();
