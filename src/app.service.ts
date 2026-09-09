import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/mysql/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Welcome to AutoServiceManager API!';
  }

  /** Readiness: MySQL ping. Liveness continues to use getHello() on `/`. */
  async checkReady(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('database_unavailable');
    }
  }
}
