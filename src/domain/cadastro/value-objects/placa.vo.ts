import { DomainException } from '../../../shared/errors/domain.exception';
import { isValidPlaca, normalizePlaca } from '../../../shared/utils/placa.util';

export class Placa {
  private constructor(public readonly value: string) {}

  static create(raw: string): Placa {
    const normalized = normalizePlaca(raw);
    if (!isValidPlaca(normalized)) {
      throw new DomainException('Placa inválida', 'INVALID_PLACA');
    }
    return new Placa(normalized);
  }

  static fromStored(normalized: string): Placa {
    return new Placa(normalized);
  }
}
