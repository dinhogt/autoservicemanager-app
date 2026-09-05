import { StatusOs as PrismaStatusOs } from '@prisma/client';
import { StatusOs } from '../../../../domain/atendimento/value-objects/status-os.enum';
import { statusOsToDomain, statusOsToPrisma } from './status-os.mapper';

describe('status-os.mapper', () => {
  it('converte todos os valores Prisma para domínio', () => {
    const values = Object.values(PrismaStatusOs);
    for (const v of values) {
      expect(statusOsToDomain(v)).toBe(v);
      expect(statusOsToPrisma(statusOsToDomain(v))).toBe(v);
    }
  });

  it('mantém enum de domínio alinhado ao Prisma', () => {
    expect(Object.keys(StatusOs).length).toBe(
      Object.values(PrismaStatusOs).length,
    );
  });
});
