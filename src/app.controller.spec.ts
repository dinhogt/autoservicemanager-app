import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let checkReady: jest.Mock;

  beforeEach(async () => {
    checkReady = jest.fn().mockResolvedValue({ status: 'ok' });
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: () => 'Welcome to AutoServiceManager API!',
            checkReady,
          },
        },
      ],
    }).compile();

    appController = app.get(AppController);
  });

  describe('root', () => {
    it('should return welcome message', () => {
      expect(appController.getHello()).toBe(
        'Welcome to AutoServiceManager API!',
      );
    });

    it('getHealth delegates to checkReady', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
      });
      expect(checkReady).toHaveBeenCalled();
    });
  });
});
