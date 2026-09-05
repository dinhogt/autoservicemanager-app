import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Welcome to AutoServiceManager API!"', () => {
      expect(appController.getHello()).toBe(
        'Welcome to AutoServiceManager API!',
      );
    });

    it('getHealth mirrors readiness payload', () => {
      expect(appController.getHealth()).toBe(
        'Welcome to AutoServiceManager API!',
      );
    });
  });
});
