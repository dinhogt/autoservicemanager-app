import { StatusOs as PrismaStatusOs } from '@prisma/client';
import { StatusOs } from '../../../../domain/atendimento/value-objects/status-os.enum';

export function statusOsToDomain(status: PrismaStatusOs): StatusOs {
  return status as StatusOs;
}

export function statusOsToPrisma(status: StatusOs): PrismaStatusOs {
  return status as PrismaStatusOs;
}
