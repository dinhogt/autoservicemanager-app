import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { ProcessarWebhookStatusOsUseCase } from '../../src/application/atendimento/use-cases/processar-webhook-status-os.use-case';
import { WebhookSecretGuard } from '../../src/infrastructure/auth/webhook-secret.guard';
import { WebhookOsController } from '../../src/interfaces/http/modules/atendimento/webhook-os.controller';
import { buildControllerApp } from './utils/build-controller-app';

const OS_ID = '22222222-2222-4222-8222-222222222222';

describe('WebhookOsController (integration)', () => {
  let app: INestApplication;
  const execute = jest.fn();

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [WebhookOsController],
      providers: [
        WebhookSecretGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'WEBHOOK_SECRET'
                ? 'test-webhook-secret-min-16'
                : undefined,
          },
        },
        { provide: ProcessarWebhookStatusOsUseCase, useValue: { execute } },
      ],
    });
  });

  afterAll(async () => app.close());

  beforeEach(() => jest.clearAllMocks());

  it('POST /webhooks/os/:id/status retorna 401 sem secret', async () => {
    await request(app.getHttpServer())
      .post(`/webhooks/os/${OS_ID}/status`)
      .send({ status: 'EM_DIAGNOSTICO' })
      .expect(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('POST /webhooks/os/:id/status retorna 401 com secret inválido', async () => {
    await request(app.getHttpServer())
      .post(`/webhooks/os/${OS_ID}/status`)
      .set('X-Webhook-Secret', 'invalid')
      .send({ status: 'EM_DIAGNOSTICO' })
      .expect(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('POST /webhooks/os/:id/status retorna 201 com secret válido', async () => {
    execute.mockResolvedValueOnce({
      id: OS_ID,
      status: 'EM_DIAGNOSTICO',
      mensagem: 'ok',
    });
    await request(app.getHttpServer())
      .post(`/webhooks/os/${OS_ID}/status`)
      .set('X-Webhook-Secret', 'test-webhook-secret-min-16')
      .send({ status: 'EM_DIAGNOSTICO' })
      .expect(201);
    expect(execute).toHaveBeenCalledWith(OS_ID, { status: 'EM_DIAGNOSTICO' });
  });
});
