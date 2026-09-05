import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LoginAdminUseCase } from '../../src/application/autenticacao/use-cases/login-admin.use-case';
import { AuthController } from '../../src/interfaces/http/modules/auth/auth.controller';
import { buildControllerApp } from './utils/build-controller-app';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  const execute = jest.fn().mockResolvedValue({ accessToken: 'jwt-token' });

  beforeAll(async () => {
    app = await buildControllerApp({
      controllers: [AuthController],
      providers: [{ provide: LoginAdminUseCase, useValue: { execute } }],
    });
  });

  afterAll(async () => app.close());

  it('POST /auth/login é público e retorna token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'secret1234' })
      .expect(201);
    expect(res.body.accessToken).toBe('jwt-token');
    expect(execute).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret1234',
    });
  });

  it('POST /auth/login valida dto', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'invalid', password: '' })
      .expect(400);
  });
});
